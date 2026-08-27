import json
import os
import re
from typing import Any, Dict, Optional

import psycopg2
import psycopg2.extras

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}

MIN_PRICE = 1
MAX_PRICE = 1500


SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _esc(v: Any) -> str:
    return str(v).replace("'", "''")


def _int(v: Any, default: int = 0) -> int:
    digits = re.sub(r'\D', '', str(v))
    return int(digits) if digits else default


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **CORS},
        'body': json.dumps(body, ensure_ascii=False, default=str),
        'isBase64Encoded': False,
    }


JOB_SELECT = f"""
SELECT j.*,
       o.name AS owner_name, o.city AS owner_city, o.rating AS owner_rating,
       o.contact AS owner_contact, o.phone AS owner_phone,
       e.name AS executor_name, e.rating AS executor_rating, e.skill AS executor_skill,
       e.contact AS executor_contact, e.phone AS executor_phone, e.done_count AS executor_done,
       e.avatar AS executor_avatar, o.avatar AS owner_avatar
FROM {SCHEMA}.jobs j
JOIN {SCHEMA}.users o ON o.id = j.owner_id
LEFT JOIN {SCHEMA}.users e ON e.id = j.assigned_executor_id
"""


def _job(row: Dict[str, Any], viewer: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    is_owner = bool(viewer and viewer['id'] == row['owner_id'])
    is_executor = bool(viewer and row['assigned_executor_id'] and viewer['id'] == row['assigned_executor_id'])
    assigned = row['status'] in ('assigned', 'expiring')
    data = {
        'id': row['id'],
        'title': row['title'],
        'description': row['description'],
        'price': row['price'],
        'city': row['city'],
        'when': row['when_text'],
        'category': row['category'],
        'photo': row['photo'],
        'status': row['status'],
        'ownerId': row['owner_id'],
        'ownerName': row['owner_name'],
        'ownerCity': row['owner_city'],
        'ownerRating': float(row['owner_rating'] or 0),
        'ownerAvatar': row['owner_avatar'],
        'executorAvatar': row['executor_avatar'],
        'assignedExecutorId': row['assigned_executor_id'],
        'executorName': row['executor_name'],
        'executorRating': float(row['executor_rating'] or 0) if row['executor_rating'] is not None else None,
        'executorSkill': row['executor_skill'],
        'executorDone': row['executor_done'],
        'assignedAt': row['assigned_at'],
        'deadlineAt': row['deadline_at'],
        'finalPrice': row['final_price'],
        'createdAt': row['created_at'],
        'completedAt': row['completed_at'],
        'isOwner': is_owner,
        'isAssignedExecutor': is_executor,
        'executorContactShared': row['executor_contact_shared'],
    }
    if (is_owner or is_executor) and (assigned or row['status'] == 'done'):
        data['ownerContact'] = {'contact': row['owner_contact'], 'phone': row['owner_phone']}
        if is_owner and not row['executor_contact_shared']:
            data['executorContact'] = None
        else:
            data['executorContact'] = {
                'contact': row['executor_contact'],
                'phone': row['executor_phone'],
            }
    return data


def _viewer(cur, token: str) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    cur.execute(f"SELECT * FROM {SCHEMA}.users WHERE token = '{_esc(token)}'")
    row = cur.fetchone()
    return dict(row) if row else None


def _responses(cur, job_id: int) -> list:
    cur.execute(
        f"""SELECT r.executor_id, r.note, r.created_at,
                   u.name, u.city, u.skill, u.about, u.rating, u.done_count, u.reviews_count, u.avatar
            FROM {SCHEMA}.job_responses r JOIN {SCHEMA}.users u ON u.id = r.executor_id
            WHERE r.job_id = {job_id}
            ORDER BY u.rating DESC, r.created_at ASC"""
    )
    out = []
    for r in cur.fetchall():
        out.append({
            'executorId': r['executor_id'],
            'note': r['note'],
            'createdAt': r['created_at'],
            'name': r['name'],
            'city': r['city'],
            'skill': r['skill'],
            'about': r['about'],
            'rating': float(r['rating'] or 0),
            'doneCount': r['done_count'],
            'reviewsCount': r['reviews_count'],
            'avatar': r['avatar'],
        })
    return out


def _expire(cur):
    cur.execute(
        f"UPDATE {SCHEMA}.jobs SET status = 'expiring' WHERE status = 'assigned' AND deadline_at < NOW()"
    )


def _recalc(cur, user_id: int):
    cur.execute(
        f"""UPDATE {SCHEMA}.users SET
              rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM {SCHEMA}.reviews WHERE target_id = {user_id}), 0),
              reviews_count = (SELECT COUNT(*) FROM {SCHEMA}.reviews WHERE target_id = {user_id})
            WHERE id = {user_id}"""
    )


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """Заказы Доделай.ру: радар открытых заданий, отклики, назначение исполнителя, 48 часов на работу, завершение и отзывы."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token') or ''

    conn = _conn()
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    _expire(cur)
    me = _viewer(cur, token)

    if method == 'GET' and action == 'feed':
        cur.execute(JOB_SELECT + " WHERE j.status = 'open' ORDER BY j.created_at DESC LIMIT 100")
        jobs = []
        for row in cur.fetchall():
            item = _job(row, me)
            item['responses'] = _responses(cur, row['id'])
            jobs.append(item)
        return _resp(200, {'jobs': jobs})

    if method == 'GET' and action == 'completed':
        cur.execute(
            JOB_SELECT + " WHERE j.status = 'done' ORDER BY j.completed_at DESC LIMIT 60"
        )
        return _resp(200, {'jobs': [_job(r, me) for r in cur.fetchall()]})

    if method == 'GET' and action == 'mine':
        if not me:
            return _resp(401, {'error': 'no_token'})
        if me['role'] == 'customer':
            cur.execute(
                JOB_SELECT + f" WHERE j.owner_id = {me['id']} ORDER BY j.created_at DESC"
            )
        else:
            cur.execute(
                JOB_SELECT
                + f""" WHERE j.assigned_executor_id = {me['id']}
                       OR j.id IN (SELECT job_id FROM {SCHEMA}.job_responses WHERE executor_id = {me['id']})
                       ORDER BY j.created_at DESC"""
            )
        jobs = []
        for row in cur.fetchall():
            item = _job(row, me)
            item['responses'] = _responses(cur, row['id'])
            cur.execute(
                f"SELECT COUNT(*) AS c FROM {SCHEMA}.reviews WHERE job_id = {row['id']} AND author_id = {me['id']}"
            )
            item['myReviewDone'] = cur.fetchone()['c'] > 0
            jobs.append(item)
        return _resp(200, {'jobs': jobs})

    if method == 'GET' and action == 'stats':
        cur.execute(
            f"""SELECT
                 (SELECT COUNT(*) FROM {SCHEMA}.jobs WHERE status = 'open') AS open_jobs,
                 (SELECT COUNT(*) FROM {SCHEMA}.jobs WHERE status = 'done') AS done_jobs,
                 (SELECT COUNT(*) FROM {SCHEMA}.users WHERE role = 'executor') AS executors,
                 (SELECT COALESCE(ROUND(AVG(final_price)), 0) FROM {SCHEMA}.jobs WHERE status = 'done') AS avg_check"""
        )
        row = cur.fetchone()
        return _resp(200, {
            'openJobs': row['open_jobs'],
            'doneJobs': row['done_jobs'],
            'executors': row['executors'],
            'avgCheck': int(row['avg_check'] or 0),
        })

    body = json.loads(event.get('body') or '{}')

    if not me:
        return _resp(401, {'error': 'no_token'})

    if action.startswith('admin_'):
        if not me.get('is_admin'):
            return _resp(403, {'error': 'not_admin'})

        if method == 'POST' and action == 'admin_jobs':
            status = str(body.get('status', ''))
            where = ''
            if status in ('open', 'assigned', 'expiring', 'done', 'cancelled'):
                where = f" WHERE j.status = '{status}'"
            cur.execute(JOB_SELECT + where + ' ORDER BY j.created_at DESC LIMIT 200')
            jobs = []
            for row in cur.fetchall():
                item = _job(row, me)
                item['responses'] = _responses(cur, row['id'])
                jobs.append(item)
            return _resp(200, {'jobs': jobs})

        if method == 'POST' and action == 'admin_update_job':
            jid = _int(body.get('jobId'))
            sets = []
            new_status = str(body.get('status', ''))
            if new_status in ('open', 'assigned', 'expiring', 'done', 'cancelled'):
                sets.append(f"status = '{new_status}'")
            if body.get('title'):
                sets.append(f"title = '{_esc(str(body['title'])[:200])}'")
            if body.get('description'):
                sets.append(f"description = '{_esc(str(body['description'])[:2000])}'")
            if body.get('price'):
                sets.append(f'price = {min(_int(body["price"]), MAX_PRICE)}')
            if not sets or not jid:
                return _resp(400, {'error': 'nothing_to_update'})
            cur.execute(f"UPDATE {SCHEMA}.jobs SET {', '.join(sets)} WHERE id = {jid}")
            return _resp(200, {'ok': True})

        if method == 'POST' and action == 'admin_stats':
            cur.execute(
                f"""SELECT
                     (SELECT COUNT(*) FROM {SCHEMA}.users WHERE role = 'customer') AS customers,
                     (SELECT COUNT(*) FROM {SCHEMA}.users WHERE role = 'executor') AS executors,
                     (SELECT COUNT(*) FROM {SCHEMA}.users WHERE blocked) AS blocked,
                     (SELECT COUNT(*) FROM {SCHEMA}.jobs WHERE status = 'open') AS open_jobs,
                     (SELECT COUNT(*) FROM {SCHEMA}.jobs WHERE status IN ('assigned','expiring')) AS active_jobs,
                     (SELECT COUNT(*) FROM {SCHEMA}.jobs WHERE status = 'done') AS done_jobs,
                     (SELECT COUNT(*) FROM {SCHEMA}.jobs WHERE status = 'cancelled') AS cancelled_jobs,
                     (SELECT COALESCE(SUM(final_price), 0) FROM {SCHEMA}.jobs WHERE status = 'done') AS turnover,
                     (SELECT COUNT(*) FROM {SCHEMA}.reviews) AS reviews"""
            )
            r = cur.fetchone()
            return _resp(200, {k: int(v or 0) for k, v in dict(r).items()})

    if method == 'POST' and action == 'create':
        if me['role'] != 'customer':
            return _resp(403, {'error': 'only_customer'})
        title = str(body.get('title', '')).strip()[:200]
        description = str(body.get('description', '')).strip()[:2000]
        price = _int(body.get('price'))
        city = str(body.get('city', me['city'])).strip()[:160]
        when_text = str(body.get('when', '')).strip()[:160] or 'Срок не указан'
        category = str(body.get('category', 'Разное')).strip()[:80]
        photo = str(body.get('photo') or '')[:500]
        if len(title) < 3:
            return _resp(400, {'error': 'bad_title'})
        if len(description) < 10:
            return _resp(400, {'error': 'bad_description'})
        if price < MIN_PRICE or price > MAX_PRICE:
            return _resp(400, {'error': 'bad_price'})
        cur.execute(
            f"""INSERT INTO {SCHEMA}.jobs (owner_id, title, description, price, city, when_text, category, photo)
                VALUES ({me['id']}, '{_esc(title)}', '{_esc(description)}', {price},
                        '{_esc(city)}', '{_esc(when_text)}', '{_esc(category)}',
                        {"'" + _esc(photo) + "'" if photo else 'NULL'})
                RETURNING id"""
        )
        return _resp(200, {'id': cur.fetchone()['id']})

    job_id = _int(body.get('jobId'))
    if not job_id:
        return _resp(400, {'error': 'no_job'})
    cur.execute(f'SELECT * FROM {SCHEMA}.jobs WHERE id = {job_id}')
    job = cur.fetchone()
    if not job:
        return _resp(404, {'error': 'job_not_found'})

    if method == 'POST' and action == 'respond':
        if me['role'] != 'executor':
            return _resp(403, {'error': 'only_executor'})
        if job['status'] != 'open':
            return _resp(400, {'error': 'job_closed'})
        note = str(body.get('note', '')).strip()[:500] or 'Готов взяться.'
        cur.execute(
            f"""INSERT INTO {SCHEMA}.job_responses (job_id, executor_id, note)
                VALUES ({job_id}, {me['id']}, '{_esc(note)}')
                ON CONFLICT (job_id, executor_id) DO UPDATE SET note = EXCLUDED.note"""
        )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'assign':
        if job['owner_id'] != me['id']:
            return _resp(403, {'error': 'not_owner'})
        if job['status'] != 'open':
            return _resp(400, {'error': 'job_closed'})
        executor_id = _int(body.get('executorId'))
        cur.execute(
            f'SELECT 1 FROM {SCHEMA}.job_responses WHERE job_id = {job_id} AND executor_id = {executor_id}'
        )
        if not cur.fetchone():
            return _resp(400, {'error': 'no_such_response'})
        cur.execute(
            f"""UPDATE {SCHEMA}.jobs SET status = 'assigned', assigned_executor_id = {executor_id},
                assigned_at = NOW(), deadline_at = NOW() + INTERVAL '48 hours'
                WHERE id = {job_id}"""
        )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'share_contact':
        if job['assigned_executor_id'] != me['id']:
            return _resp(403, {'error': 'not_assigned'})
        cur.execute(f'UPDATE {SCHEMA}.jobs SET executor_contact_shared = TRUE WHERE id = {job_id}')
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'complete':
        if job['owner_id'] != me['id']:
            return _resp(403, {'error': 'not_owner'})
        if job['status'] not in ('assigned', 'expiring'):
            return _resp(400, {'error': 'bad_status'})
        final_price = _int(body.get('finalPrice'), job['price'])
        if final_price < MIN_PRICE or final_price > MAX_PRICE:
            final_price = job['price']
        cur.execute(
            f"""UPDATE {SCHEMA}.jobs SET status = 'done', completed_at = NOW(), final_price = {final_price}
                WHERE id = {job_id}"""
        )
        cur.execute(
            f"UPDATE {SCHEMA}.users SET done_count = done_count + 1 WHERE id = {job['assigned_executor_id']}"
        )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'cancel':
        allowed = me['id'] in (job['owner_id'], job['assigned_executor_id'])
        if not allowed:
            return _resp(403, {'error': 'not_allowed'})
        if job['status'] == 'done':
            return _resp(400, {'error': 'already_done'})
        cur.execute(f"UPDATE {SCHEMA}.jobs SET status = 'cancelled' WHERE id = {job_id}")
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'review':
        if job['status'] != 'done':
            return _resp(400, {'error': 'not_done'})
        if me['id'] == job['owner_id']:
            target = job['assigned_executor_id']
        elif me['id'] == job['assigned_executor_id']:
            target = job['owner_id']
        else:
            return _resp(403, {'error': 'not_participant'})
        rating = max(1, min(5, _int(body.get('rating'), 5)))
        text = str(body.get('text', '')).strip()[:1000]
        cur.execute(
            f"""INSERT INTO {SCHEMA}.reviews (job_id, author_id, target_id, rating, text)
                VALUES ({job_id}, {me['id']}, {target}, {rating}, '{_esc(text)}')
                ON CONFLICT (job_id, author_id) DO UPDATE SET rating = EXCLUDED.rating, text = EXCLUDED.text"""
        )
        _recalc(cur, target)
        return _resp(200, {'ok': True})

    return _resp(404, {'error': 'unknown_action'})