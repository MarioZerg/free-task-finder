import datetime as dt
import json
import os
import re
import urllib.request
from typing import Any, Dict, Optional

import psycopg2
import psycopg2.extras

try:
    from push import send_push
except ImportError:  # pragma: no cover
    def send_push(*args, **kwargs) -> int:
        return 0

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}

MIN_PRICE = 1
MAX_PRICE = 1000000


SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
BOT_TOKEN = os.environ.get('MAX_BOT_TOKEN', '')
SITE_URL = os.environ.get('SITE_URL', 'https://dodelay.ru')


def _notify(max_user_id: Any, text: str):
    if not BOT_TOKEN or not max_user_id:
        return
    try:
        req = urllib.request.Request(
            f'https://botapi.max.ru/messages?user_id={max_user_id}',
            data=json.dumps({'text': text}).encode(),
            headers={'Content-Type': 'application/json', 'Authorization': BOT_TOKEN},
        )
        urllib.request.urlopen(req, timeout=3).read()
    except Exception:
        pass


def _notify_admins(cur, text: str):
    """Шлёт сообщение в MAX всем администраторам сервиса. Ошибки не пробрасывает."""
    if not BOT_TOKEN:
        return
    try:
        cur.execute(
            f"SELECT DISTINCT max_user_id FROM {SCHEMA}.users "
            f'WHERE is_admin = TRUE AND max_user_id IS NOT NULL '
            f"AND max_user_id <> ''"
        )
        for row in cur.fetchall():
            _notify(row['max_user_id'], text)
    except Exception:
        pass


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _esc(v: Any) -> str:
    return str(v).replace("'", "''")


def _int(v: Any, default: int = 0) -> int:
    digits = re.sub(r'\D', '', str(v))
    return int(digits) if digits else default


def _json_default(v: Any) -> str:
    if isinstance(v, dt.datetime):
        return v.isoformat() + 'Z'
    return str(v)


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **CORS},
        'body': json.dumps(body, ensure_ascii=False, default=_json_default),
        'isBase64Encoded': False,
    }


JOB_SELECT = f"""
SELECT j.*,
       o.name AS owner_name, o.city AS owner_city, o.rating AS owner_rating,
       o.contact AS owner_contact, o.phone AS owner_phone,
       e.name AS executor_name, e.rating AS executor_rating, e.skill AS executor_skill,
       e.contact AS executor_contact, e.phone AS executor_phone, e.done_count AS executor_done,
       e.avatar AS executor_avatar, o.avatar AS owner_avatar,
       o.last_seen AS owner_seen, e.last_seen AS executor_seen,
       o.max_user_id AS owner_max, e.max_user_id AS executor_max
FROM {SCHEMA}.jobs j
JOIN {SCHEMA}.users o ON o.id = j.owner_id
LEFT JOIN {SCHEMA}.users e ON e.id = j.assigned_executor_id
"""


def _online(seen) -> bool:
    if not seen:
        return False
    return dt.datetime.now() - seen < dt.timedelta(minutes=3)


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
        'photo': row['photo_thumb'] or row['photo'],
        'hasFullPhoto': bool(row['photo_full']),
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
        'ownerOnline': _online(row['owner_seen']),
        'executorOnline': _online(row['executor_seen']),
        'ownerContactShared': row['owner_contact_shared'],
        'moderation': row['moderation'],
        'expiresAt': row['expires_at'],
        'bumpedAt': row['bumped_at'],
    }
    if (is_owner or is_executor) and (assigned or row['status'] == 'done'):
        if is_owner or row['owner_contact_shared']:
            data['ownerContact'] = {
                'contact': row['owner_contact'],
                'phone': row['owner_phone'],
            }
        else:
            data['ownerContact'] = None
        if is_executor or row['executor_contact_shared']:
            data['executorContact'] = {
                'contact': row['executor_contact'],
                'phone': row['executor_phone'],
            }
        else:
            data['executorContact'] = None
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
                   u.name, u.city, u.skill, u.about, u.rating, u.done_count, u.reviews_count, u.avatar,
                   u.last_seen
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
            'online': _online(r['last_seen']),
        })
    return out


def _expire(cur):
    cur.execute(
        f"UPDATE {SCHEMA}.jobs SET status = 'expiring' WHERE status = 'assigned' AND deadline_at < NOW()"
    )
    cur.execute(
        f"""DELETE FROM {SCHEMA}.job_responses WHERE job_id IN (
                SELECT id FROM {SCHEMA}.jobs
                WHERE status = 'open' AND expires_at IS NOT NULL AND expires_at < NOW()
            )"""
    )
    cur.execute(
        f"""DELETE FROM {SCHEMA}.job_messages WHERE job_id IN (
                SELECT id FROM {SCHEMA}.jobs
                WHERE status = 'open' AND expires_at IS NOT NULL AND expires_at < NOW()
            )"""
    )
    cur.execute(
        f"""DELETE FROM {SCHEMA}.job_invites WHERE job_id IN (
                SELECT id FROM {SCHEMA}.jobs
                WHERE status = 'open' AND expires_at IS NOT NULL AND expires_at < NOW()
            )"""
    )
    cur.execute(
        f"""DELETE FROM {SCHEMA}.jobs
            WHERE status = 'open' AND expires_at IS NOT NULL AND expires_at < NOW()"""
    )
    cur.execute(
        f"""DELETE FROM {SCHEMA}.job_responses WHERE job_id IN (
                SELECT id FROM {SCHEMA}.jobs
                WHERE status = 'cancelled' AND created_at < NOW() - INTERVAL '7 days'
            )"""
    )
    cur.execute(
        f"""DELETE FROM {SCHEMA}.job_messages WHERE job_id IN (
                SELECT id FROM {SCHEMA}.jobs
                WHERE status = 'cancelled' AND created_at < NOW() - INTERVAL '7 days'
            )"""
    )
    cur.execute(
        f"""DELETE FROM {SCHEMA}.job_invites WHERE job_id IN (
                SELECT id FROM {SCHEMA}.jobs
                WHERE status = 'cancelled' AND created_at < NOW() - INTERVAL '7 days'
            )"""
    )
    cur.execute(
        f"""DELETE FROM {SCHEMA}.jobs
            WHERE status = 'cancelled' AND created_at < NOW() - INTERVAL '7 days'
              AND id NOT IN (SELECT job_id FROM {SCHEMA}.reviews)"""
    )


def _is_pro(user: Dict[str, Any]) -> bool:
    until = user.get('subscription_until')
    return bool(until and until > dt.datetime.now())


EXECUTOR_FREE_LIMIT = 1
EXECUTOR_PRO_LIMIT = 3


def _executor_active_count(cur, user_id: int) -> int:
    cur.execute(
        f"""SELECT COUNT(*) AS c FROM {SCHEMA}.jobs
            WHERE assigned_executor_id = {user_id} AND status IN ('assigned', 'expiring')"""
    )
    return cur.fetchone()['c']


def _busy_executor(cur, user_id: int, pro: bool = False) -> bool:
    limit = EXECUTOR_PRO_LIMIT if pro else EXECUTOR_FREE_LIMIT
    return _executor_active_count(cur, user_id) >= limit


def _active_customer_job(cur, user_id: int, pro: bool = False):
    if pro:
        cur.execute(
            f"""SELECT id, title, expires_at, status FROM {SCHEMA}.jobs
                WHERE owner_id = {user_id} AND status IN ('open', 'assigned', 'expiring')
                  AND created_at > NOW() - INTERVAL '1 hour'
                ORDER BY created_at DESC LIMIT 1"""
        )
    else:
        cur.execute(
            f"""SELECT id, title, expires_at, status FROM {SCHEMA}.jobs
                WHERE owner_id = {user_id} AND status IN ('open', 'assigned', 'expiring')
                ORDER BY created_at DESC LIMIT 1"""
        )
    return cur.fetchone()


def _recalc(cur, user_id: int):
    cur.execute(
        f"""UPDATE {SCHEMA}.users SET
              rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM {SCHEMA}.reviews
                                 WHERE target_id = {user_id} AND hidden = FALSE), 0),
              reviews_count = (SELECT COUNT(*) FROM {SCHEMA}.reviews
                               WHERE target_id = {user_id} AND hidden = FALSE)
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
    if me:
        cur.execute(f"UPDATE {SCHEMA}.users SET last_seen = NOW() WHERE id = {me['id']}")

    if method == 'GET' and action == 'photo':
        jid = _int(params.get('jobId'))
        cur.execute(f'SELECT photo_full, photo_thumb, photo FROM {SCHEMA}.jobs WHERE id = {jid}')
        row = cur.fetchone()
        if not row:
            return _resp(404, {'error': 'not_found'})
        return _resp(200, {'photo': row['photo_full'] or row['photo_thumb'] or row['photo']})

    if method == 'GET' and action == 'feed':
        cur.execute(
            JOB_SELECT
            + " WHERE j.status = 'open' AND j.moderation = 'approved'"
            + ' ORDER BY COALESCE(j.bumped_at, j.created_at) DESC LIMIT 100'
        )
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
        pro = _is_pro(me)
        active_count = _executor_active_count(cur, me['id']) if me['role'] == 'executor' else 0
        executor_limit = EXECUTOR_PRO_LIMIT if pro else EXECUTOR_FREE_LIMIT
        limits = {
            'busy': active_count >= executor_limit,
            'pro': pro,
            'activeCount': active_count,
            'activeLimit': executor_limit,
        }
        if me['role'] == 'customer':
            active = None if pro else _active_customer_job(cur, me['id'])
            limits['canCreate'] = active is None
            limits['activeJobId'] = active['id'] if active else None
            limits['activeExpiresAt'] = (
                _json_default(active['expires_at']) if active and active['expires_at'] else None
            )
        invites = []
        if me['role'] == 'executor':
            cur.execute(
                f"""SELECT i.id, i.job_id, i.note, i.created_at,
                           j.title, j.price, j.city, j.when_text, j.status AS job_status,
                           c.name AS customer_name, c.avatar AS customer_avatar,
                           c.rating AS customer_rating
                    FROM {SCHEMA}.job_invites i
                    JOIN {SCHEMA}.jobs j ON j.id = i.job_id
                    JOIN {SCHEMA}.users c ON c.id = i.customer_id
                    WHERE i.executor_id = {me['id']} AND i.status = 'pending' AND j.status = 'open'
                    ORDER BY i.created_at DESC"""
            )
            for r in cur.fetchall():
                invites.append({
                    'id': r['id'],
                    'jobId': r['job_id'],
                    'note': r['note'],
                    'createdAt': r['created_at'],
                    'title': r['title'],
                    'price': r['price'],
                    'city': r['city'],
                    'when': r['when_text'],
                    'customerName': r['customer_name'],
                    'customerAvatar': r['customer_avatar'],
                    'customerRating': float(r['customer_rating'] or 0),
                })
        cur.execute(
            f"""SELECT from_id, COUNT(*) AS c FROM {SCHEMA}.direct_messages
                WHERE to_id = {me['id']} AND read_at IS NULL
                GROUP BY from_id"""
        )
        unread_rows = cur.fetchall()
        unread = {
            'total': sum(r['c'] for r in unread_rows),
            'byUser': {str(r['from_id']): r['c'] for r in unread_rows},
        }
        return _resp(
            200,
            {'jobs': jobs, 'limits': limits, 'invites': invites, 'unread': unread},
        )

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

    if method == 'GET' and action == 'messages':
        if not me:
            return _resp(401, {'error': 'no_token'})
        jid = _int(params.get('jobId'))
        cur.execute(f'SELECT * FROM {SCHEMA}.jobs WHERE id = {jid}')
        j = cur.fetchone()
        if not j:
            return _resp(404, {'error': 'job_not_found'})
        if me['id'] not in (j['owner_id'], j['assigned_executor_id']):
            return _resp(403, {'error': 'not_participant'})
        cur.execute(
            f"""SELECT m.id, m.text, m.created_at, m.author_id, u.name, u.avatar
                FROM {SCHEMA}.job_messages m JOIN {SCHEMA}.users u ON u.id = m.author_id
                WHERE m.job_id = {jid} ORDER BY m.created_at ASC LIMIT 200"""
        )
        msgs = [
            {
                'id': r['id'],
                'text': r['text'],
                'createdAt': r['created_at'],
                'authorId': r['author_id'],
                'authorName': r['name'],
                'authorAvatar': r['avatar'],
                'mine': r['author_id'] == me['id'],
            }
            for r in cur.fetchall()
        ]
        return _resp(200, {'messages': msgs})

    body = json.loads(event.get('body') or '{}')

    if not me:
        return _resp(401, {'error': 'no_token'})

    if action.startswith('admin_'):
        if not me.get('is_admin'):
            return _resp(403, {'error': 'not_admin'})

        if method == 'POST' and action == 'admin_jobs':
            status = str(body.get('status', ''))
            where = ''
            if status == 'moderation':
                where = " WHERE j.moderation = 'pending'"
            elif status in ('open', 'assigned', 'expiring', 'done', 'cancelled'):
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
            moderation = str(body.get('moderation', ''))
            if moderation in ('approved', 'pending', 'rejected'):
                sets.append(f"moderation = '{moderation}'")
                if moderation == 'approved':
                    sets.append("expires_at = NOW() + INTERVAL '24 hours'")
            if not sets or not jid:
                return _resp(400, {'error': 'nothing_to_update'})
            cur.execute(
                f"UPDATE {SCHEMA}.jobs SET {', '.join(sets)} WHERE id = {jid} "
                f'RETURNING owner_id, title'
            )
            updated = cur.fetchone()
            if updated and moderation == 'approved':
                send_push(
                    cur, SCHEMA, updated['owner_id'], 'status', 'Задание одобрено',
                    f"Ваше задание «{updated['title']}» появилось в ленте заказов",
                    url='/dashboard', job_id=jid, esc=_esc,
                )
            elif updated and moderation == 'rejected':
                send_push(
                    cur, SCHEMA, updated['owner_id'], 'status', 'Задание отклонено',
                    f"Модератор отклонил «{updated['title']}». "
                    f'Разместите новое с более точным описанием.',
                    url='/dashboard', job_id=jid, esc=_esc,
                )
            return _resp(200, {'ok': True})

        if method == 'POST' and action == 'admin_delete_job':
            jid = _int(body.get('jobId'))
            if not jid:
                return _resp(400, {'error': 'no_job'})
            cur.execute(f'DELETE FROM {SCHEMA}.reviews WHERE job_id = {jid}')
            cur.execute(f'DELETE FROM {SCHEMA}.job_messages WHERE job_id = {jid}')
            cur.execute(f'DELETE FROM {SCHEMA}.job_responses WHERE job_id = {jid}')
            cur.execute(f'DELETE FROM {SCHEMA}.job_invites WHERE job_id = {jid}')
            cur.execute(f'DELETE FROM {SCHEMA}.jobs WHERE id = {jid}')
            return _resp(200, {'ok': True})

        if method == 'POST' and action == 'admin_clear_history':
            scope = str(body.get('scope', ''))
            if scope == 'cancelled':
                where = "status = 'cancelled'"
            elif scope == 'done':
                where = "status = 'done'"
            elif scope == 'all_closed':
                where = "status IN ('done', 'cancelled')"
            else:
                return _resp(400, {'error': 'bad_scope'})
            cur.execute(
                f'DELETE FROM {SCHEMA}.reviews WHERE job_id IN '
                f'(SELECT id FROM {SCHEMA}.jobs WHERE {where})'
            )
            cur.execute(
                f'DELETE FROM {SCHEMA}.job_messages WHERE job_id IN '
                f'(SELECT id FROM {SCHEMA}.jobs WHERE {where})'
            )
            cur.execute(
                f'DELETE FROM {SCHEMA}.job_responses WHERE job_id IN '
                f'(SELECT id FROM {SCHEMA}.jobs WHERE {where})'
            )
            cur.execute(
                f'DELETE FROM {SCHEMA}.job_invites WHERE job_id IN '
                f'(SELECT id FROM {SCHEMA}.jobs WHERE {where})'
            )
            cur.execute(f'DELETE FROM {SCHEMA}.jobs WHERE {where} RETURNING id')
            removed = len(cur.fetchall())
            cur.execute(
                f"""UPDATE {SCHEMA}.users u SET
                      rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2)
                                         FROM {SCHEMA}.reviews r
                                         WHERE r.target_id = u.id AND r.hidden = FALSE), 0),
                      reviews_count = (SELECT COUNT(*) FROM {SCHEMA}.reviews r
                                       WHERE r.target_id = u.id AND r.hidden = FALSE)"""
            )
            return _resp(200, {'ok': True, 'removed': removed})

        if method == 'POST' and action == 'admin_reviews':
            direction = str(body.get('direction', ''))
            extra = ''
            if direction == 'to_executor':
                extra = " AND t.role = 'executor'"
            elif direction == 'to_customer':
                extra = " AND t.role = 'customer'"
            cur.execute(
                f"""SELECT r.id, r.rating, r.text, r.created_at, r.hidden,
                           a.name AS author_name, a.role AS author_role, a.avatar AS author_avatar,
                           t.id AS target_id, t.name AS target_name, t.role AS target_role,
                           j.title AS job_title, j.final_price
                    FROM {SCHEMA}.reviews r
                    JOIN {SCHEMA}.users a ON a.id = r.author_id
                    JOIN {SCHEMA}.users t ON t.id = r.target_id
                    JOIN {SCHEMA}.jobs j ON j.id = r.job_id
                    WHERE TRUE{extra}
                    ORDER BY r.created_at DESC LIMIT 200"""
            )
            return _resp(200, {'reviews': [dict(r) for r in cur.fetchall()]})

        if method == 'POST' and action == 'admin_review_action':
            rid = _int(body.get('reviewId'))
            act_type = str(body.get('act', ''))
            if not rid:
                return _resp(400, {'error': 'no_review'})
            cur.execute(f'SELECT target_id FROM {SCHEMA}.reviews WHERE id = {rid}')
            row = cur.fetchone()
            if not row:
                return _resp(404, {'error': 'not_found'})
            target = row['target_id']
            if act_type == 'hide':
                cur.execute(f'UPDATE {SCHEMA}.reviews SET hidden = TRUE WHERE id = {rid}')
            elif act_type == 'show':
                cur.execute(f'UPDATE {SCHEMA}.reviews SET hidden = FALSE WHERE id = {rid}')
            elif act_type == 'delete':
                cur.execute(f'DELETE FROM {SCHEMA}.reviews WHERE id = {rid}')
            else:
                return _resp(400, {'error': 'bad_act'})
            cur.execute(
                f"""UPDATE {SCHEMA}.users SET
                      rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2)
                                         FROM {SCHEMA}.reviews
                                         WHERE target_id = {target} AND hidden = FALSE), 0),
                      reviews_count = (SELECT COUNT(*) FROM {SCHEMA}.reviews
                                       WHERE target_id = {target} AND hidden = FALSE)
                    WHERE id = {target}"""
            )
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
        pro = _is_pro(me)
        active = _active_customer_job(cur, me['id'], pro) if not pro else None
        if active:
            return _resp(400, {
                'error': 'active_job_exists',
                'activeJob': {
                    'id': active['id'],
                    'title': active['title'],
                    'status': active['status'],
                    'expiresAt': _json_default(active['expires_at']) if active['expires_at'] else None,
                },
            })
        title = str(body.get('title', '')).strip()[:200]
        description = str(body.get('description', '')).strip()[:2000]
        price = _int(body.get('price'))
        city = str(body.get('city', me['city'])).strip()[:160]
        when_text = str(body.get('when', '')).strip()[:160] or 'Срок не указан'
        category = str(body.get('category', 'Разное')).strip()[:80]
        photo_thumb = str(body.get('photoThumb') or '')
        photo_full = str(body.get('photoFull') or '')
        if photo_thumb and not photo_thumb.startswith('data:image/'):
            photo_thumb = ''
        if photo_full and not photo_full.startswith('data:image/'):
            photo_full = ''
        if len(photo_thumb) > 400000 or len(photo_full) > 3000000:
            return _resp(400, {'error': 'photo_too_big'})
        if len(title) < 3:
            return _resp(400, {'error': 'bad_title'})
        if len(description) < 10:
            return _resp(400, {'error': 'bad_description'})
        if price < MIN_PRICE or price > MAX_PRICE:
            return _resp(400, {'error': 'bad_price'})
        cur.execute(
            f"""INSERT INTO {SCHEMA}.jobs
                  (owner_id, title, description, price, city, when_text, category,
                   photo_thumb, photo_full, moderation, expires_at)
                VALUES ({me['id']}, '{_esc(title)}', '{_esc(description)}', {price},
                        '{_esc(city)}', '{_esc(when_text)}', '{_esc(category)}',
                        {"'" + _esc(photo_thumb) + "'" if photo_thumb else 'NULL'},
                        {"'" + _esc(photo_full) + "'" if photo_full else 'NULL'},
                        'pending', NOW() + INTERVAL '24 hours')
                RETURNING id"""
        )
        new_id = cur.fetchone()['id']
        _notify_admins(
            cur,
            f'Новое объявление на проверку: «{title}» за {price} ₽ '
            f'({city}). Автор: {me["name"]}. Откройте админку Доделай.ру.',
        )
        return _resp(200, {'id': new_id})

    if method == 'POST' and action == 'edit':
        job_id_edit = _int(body.get('jobId'))
        cur.execute(f'SELECT * FROM {SCHEMA}.jobs WHERE id = {job_id_edit}')
        target = cur.fetchone()
        if not target:
            return _resp(404, {'error': 'job_not_found'})
        if target['owner_id'] != me['id']:
            return _resp(403, {'error': 'not_owner'})
        if target['status'] not in ('open', 'cancelled'):
            return _resp(400, {'error': 'job_in_work'})
        title = str(body.get('title', '')).strip()[:200]
        description = str(body.get('description', '')).strip()[:2000]
        price = _int(body.get('price'))
        city = str(body.get('city', target['city'])).strip()[:160]
        when_text = str(body.get('when', '')).strip()[:160] or 'Срок не указан'
        category = str(body.get('category', target['category'])).strip()[:80]
        if len(title) < 3:
            return _resp(400, {'error': 'bad_title'})
        if len(description) < 10:
            return _resp(400, {'error': 'bad_description'})
        if price < MIN_PRICE or price > MAX_PRICE:
            return _resp(400, {'error': 'bad_price'})
        photo_thumb = str(body.get('photoThumb') or '')
        photo_full = str(body.get('photoFull') or '')
        photo_sets = ''
        if photo_thumb.startswith('data:image/'):
            if len(photo_thumb) > 400000 or len(photo_full) > 3000000:
                return _resp(400, {'error': 'photo_too_big'})
            full_sql = "'" + _esc(photo_full) + "'" if photo_full else 'NULL'
            photo_sets = (
                ", photo_thumb = '" + _esc(photo_thumb) + "'"
                + ', photo_full = ' + full_sql
            )
        cur.execute(
            f"""UPDATE {SCHEMA}.jobs SET
                    title = '{_esc(title)}',
                    description = '{_esc(description)}',
                    price = {price},
                    city = '{_esc(city)}',
                    when_text = '{_esc(when_text)}',
                    category = '{_esc(category)}',
                    status = 'open',
                    moderation = 'pending',
                    expires_at = NOW() + INTERVAL '24 hours'
                    {photo_sets}
                WHERE id = {job_id_edit}"""
        )
        _notify_admins(
            cur,
            f'Объявление отредактировано и ждёт повторной проверки: «{title}» '
            f'за {price} ₽ ({city}). Автор: {me["name"]}. Откройте админку Доделай.ру.',
        )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'dm_send':
        to_id = _int(body.get('toId'))
        text = str(body.get('text', '')).strip()[:1000]
        if not to_id or not text:
            return _resp(400, {'error': 'bad_message'})
        cur.execute(f"SELECT role, max_user_id, name FROM {SCHEMA}.users WHERE id = {to_id}")
        target = cur.fetchone()
        if not target:
            return _resp(404, {'error': 'user_not_found'})
        if me['role'] == 'executor':
            if not _is_pro(me) or target['role'] != 'customer':
                return _resp(403, {'error': 'pro_executor_required'})
        else:
            cur.execute(
                f"""SELECT 1 FROM {SCHEMA}.direct_messages
                    WHERE from_id = {to_id} AND to_id = {me['id']} LIMIT 1"""
            )
            if not cur.fetchone():
                return _resp(403, {'error': 'no_thread'})
        cur.execute(
            f"""INSERT INTO {SCHEMA}.direct_messages (from_id, to_id, text)
                VALUES ({me['id']}, {to_id}, '{_esc(text)}')"""
        )
        cur.execute(
            f"""DELETE FROM {SCHEMA}.dm_archive
                WHERE (user_id = {to_id} AND peer_id = {me['id']})
                   OR (user_id = {me['id']} AND peer_id = {to_id})"""
        )
        _notify(
            target['max_user_id'],
            f"{me['name']} написал вам в Доделай.ру: {text[:120]}",
        )
        send_push(
            cur, SCHEMA, to_id, 'messages', f"Сообщение от {me['name']}",
            text[:100],
            url='/dashboard', esc=_esc,
        )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'invite':
        if me['role'] != 'customer':
            return _resp(403, {'error': 'only_customer'})
        if not _is_pro(me):
            return _resp(403, {'error': 'pro_required'})
        executor_id = _int(body.get('executorId'))
        jid = _int(body.get('jobId'))
        cur.execute(
            f"""SELECT * FROM {SCHEMA}.jobs
                WHERE id = {jid} AND owner_id = {me['id']} AND status = 'open'"""
        )
        target_job = cur.fetchone()
        if not target_job:
            return _resp(400, {'error': 'no_open_job'})
        cur.execute(
            f"""SELECT name, max_user_id, subscription_until FROM {SCHEMA}.users
                WHERE id = {executor_id} AND role = 'executor'"""
        )
        ex = cur.fetchone()
        if not ex:
            return _resp(404, {'error': 'executor_not_found'})
        if _busy_executor(cur, executor_id, _is_pro(ex)):
            return _resp(400, {'error': 'executor_busy'})
        note = str(body.get('note', '')).strip()[:500] or 'Заказчик приглашает вас на заказ.'
        cur.execute(
            f"""INSERT INTO {SCHEMA}.job_invites (job_id, executor_id, customer_id, note)
                VALUES ({jid}, {executor_id}, {me['id']}, '{_esc(note)}')
                ON CONFLICT (job_id, executor_id) DO UPDATE SET note = EXCLUDED.note,
                    status = 'pending', created_at = NOW()"""
        )
        _notify(
            ex['max_user_id'],
            f"{me['name']} приглашает вас на заказ «{target_job['title']}» "
            f"за {target_job['price']} ₽. Откройте ленту Доделай.ру и откликнитесь.",
        )
        send_push(
            cur, SCHEMA, executor_id, 'responses', 'Приглашение на заказ',
            f"{me['name']} зовёт вас на «{target_job['title']}» за {target_job['price']} ₽",
            url='/dashboard', job_id=jid, esc=_esc,
        )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'invite_accept':
        if me['role'] != 'executor':
            return _resp(403, {'error': 'only_executor'})
        invite_id = _int(body.get('inviteId'))
        cur.execute(
            f"""SELECT i.*, j.status AS job_status, j.title, j.owner_id
                FROM {SCHEMA}.job_invites i JOIN {SCHEMA}.jobs j ON j.id = i.job_id
                WHERE i.id = {invite_id} AND i.executor_id = {me['id']} AND i.status = 'pending'"""
        )
        inv = cur.fetchone()
        if not inv:
            return _resp(404, {'error': 'invite_not_found'})
        if inv['job_status'] != 'open':
            return _resp(400, {'error': 'job_closed'})
        if _busy_executor(cur, me['id'], _is_pro(me)):
            return _resp(400, {'error': 'executor_busy'})
        accept_note = _esc(inv['note'] or 'Готов взяться.')
        cur.execute(
            f"""INSERT INTO {SCHEMA}.job_responses (job_id, executor_id, note)
                VALUES ({inv['job_id']}, {me['id']}, '{accept_note}')
                ON CONFLICT (job_id, executor_id) DO UPDATE SET note = EXCLUDED.note"""
        )
        cur.execute(f"UPDATE {SCHEMA}.job_invites SET status = 'accepted' WHERE id = {invite_id}")
        cur.execute(f"SELECT max_user_id FROM {SCHEMA}.users WHERE id = {inv['owner_id']}")
        owner = cur.fetchone()
        _notify(
            owner['max_user_id'] if owner else None,
            f"{me['name']} принял приглашение на «{inv['title']}». "
            f'Откройте кабинет Доделай.ру, чтобы назначить исполнителя.',
        )
        send_push(
            cur, SCHEMA, inv['owner_id'], 'responses', 'Приглашение принято',
            f"{me['name']} готов взяться за «{inv['title']}»",
            url='/dashboard', job_id=inv['job_id'], esc=_esc,
        )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'invite_decline':
        if me['role'] != 'executor':
            return _resp(403, {'error': 'only_executor'})
        invite_id = _int(body.get('inviteId'))
        cur.execute(
            f"""UPDATE {SCHEMA}.job_invites SET status = 'declined'
                WHERE id = {invite_id} AND executor_id = {me['id']} AND status = 'pending'"""
        )
        return _resp(200, {'ok': True})

    if method == 'GET' and action == 'dm_list':
        want_archived = str(params.get('archived', '')) in ('1', 'true')
        arch_cond = 'EXISTS' if want_archived else 'NOT EXISTS'
        cur.execute(
            f"""SELECT u.id, u.name, u.avatar, u.role, u.last_seen,
                       MAX(dm.created_at) AS last_at,
                       COUNT(*) FILTER (
                           WHERE dm.to_id = {me['id']} AND dm.read_at IS NULL
                       ) AS unread,
                       (ARRAY_AGG(dm.text ORDER BY dm.created_at DESC))[1] AS last_text
                FROM {SCHEMA}.direct_messages dm
                JOIN {SCHEMA}.users u
                  ON u.id = CASE WHEN dm.from_id = {me['id']} THEN dm.to_id ELSE dm.from_id END
                WHERE (dm.from_id = {me['id']} OR dm.to_id = {me['id']})
                  AND {arch_cond} (
                      SELECT 1 FROM {SCHEMA}.dm_archive a
                      WHERE a.user_id = {me['id']} AND a.peer_id = u.id
                  )
                GROUP BY u.id, u.name, u.avatar, u.role, u.last_seen
                ORDER BY last_at DESC LIMIT 50"""
        )
        threads = [
            {
                'userId': r['id'],
                'name': r['name'],
                'avatar': r['avatar'],
                'role': r['role'],
                'online': _online(r['last_seen']),
                'lastAt': r['last_at'],
                'lastText': r['last_text'],
                'unread': r['unread'],
            }
            for r in cur.fetchall()
        ]
        cur.execute(
            f"""SELECT COUNT(*) AS c FROM {SCHEMA}.dm_archive a
                WHERE a.user_id = {me['id']}
                  AND EXISTS (
                      SELECT 1 FROM {SCHEMA}.direct_messages dm
                      WHERE (dm.from_id = {me['id']} AND dm.to_id = a.peer_id)
                         OR (dm.from_id = a.peer_id AND dm.to_id = {me['id']})
                  )"""
        )
        return _resp(200, {'threads': threads, 'archivedCount': cur.fetchone()['c']})

    if method == 'POST' and action == 'dm_archive':
        peer_id = _int(body.get('peerId'))
        if not peer_id:
            return _resp(400, {'error': 'no_user'})
        if body.get('restore'):
            cur.execute(
                f"""DELETE FROM {SCHEMA}.dm_archive
                    WHERE user_id = {me['id']} AND peer_id = {peer_id}"""
            )
            return _resp(200, {'ok': True, 'archived': False})
        cur.execute(
            f"""INSERT INTO {SCHEMA}.dm_archive (user_id, peer_id)
                VALUES ({me['id']}, {peer_id})
                ON CONFLICT (user_id, peer_id) DO NOTHING"""
        )
        return _resp(200, {'ok': True, 'archived': True})

    if method == 'GET' and action == 'dm_thread':
        if not me:
            return _resp(401, {'error': 'no_token'})
        other_id = _int(params.get('userId'))
        if not other_id:
            return _resp(400, {'error': 'no_user'})
        cur.execute(
            f"""SELECT dm.id, dm.text, dm.created_at, dm.from_id,
                       u.name AS from_name, u.avatar AS from_avatar
                FROM {SCHEMA}.direct_messages dm JOIN {SCHEMA}.users u ON u.id = dm.from_id
                WHERE (dm.from_id = {me['id']} AND dm.to_id = {other_id})
                   OR (dm.from_id = {other_id} AND dm.to_id = {me['id']})
                ORDER BY dm.created_at ASC LIMIT 200"""
        )
        msgs = [
            {
                'id': r['id'],
                'text': r['text'],
                'createdAt': r['created_at'],
                'fromId': r['from_id'],
                'fromName': r['from_name'],
                'fromAvatar': r['from_avatar'],
                'mine': r['from_id'] == me['id'],
            }
            for r in cur.fetchall()
        ]
        cur.execute(
            f"""UPDATE {SCHEMA}.direct_messages SET read_at = NOW()
                WHERE from_id = {other_id} AND to_id = {me['id']} AND read_at IS NULL"""
        )
        return _resp(200, {'messages': msgs})

    if method == 'POST' and action == 'my_open_jobs':
        cur.execute(
            f"""SELECT id, title, price FROM {SCHEMA}.jobs
                WHERE owner_id = {me['id']} AND status = 'open'
                ORDER BY created_at DESC LIMIT 20"""
        )
        return _resp(200, {'jobs': [dict(r) for r in cur.fetchall()]})

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
        if _busy_executor(cur, me['id'], _is_pro(me)):
            return _resp(400, {'error': 'executor_busy'})
        note = str(body.get('note', '')).strip()[:500] or 'Готов взяться.'
        cur.execute(
            f"""INSERT INTO {SCHEMA}.job_responses (job_id, executor_id, note)
                VALUES ({job_id}, {me['id']}, '{_esc(note)}')
                ON CONFLICT (job_id, executor_id) DO UPDATE SET note = EXCLUDED.note"""
        )
        cur.execute(f"SELECT max_user_id FROM {SCHEMA}.users WHERE id = {job['owner_id']}")
        owner = cur.fetchone()
        _notify(
            owner['max_user_id'] if owner else None,
            f"Новый отклик на «{job['title']}»: {me['name']}. "
            f'Откройте кабинет Доделай.ру, чтобы выбрать исполнителя.',
        )
        send_push(
            cur, SCHEMA, job['owner_id'], 'responses', 'Новый отклик',
            f"{me['name']} готов взяться за «{job['title']}»",
            url='/dashboard', job_id=job_id, esc=_esc,
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
        cur.execute(f"SELECT subscription_until FROM {SCHEMA}.users WHERE id = {executor_id}")
        ex_sub = cur.fetchone()
        if _busy_executor(cur, executor_id, _is_pro(ex_sub) if ex_sub else False):
            return _resp(400, {'error': 'executor_already_busy'})
        cur.execute(
            f"""UPDATE {SCHEMA}.jobs SET status = 'assigned', assigned_executor_id = {executor_id},
                assigned_at = NOW(), deadline_at = NOW() + INTERVAL '48 hours',
                owner_contact_shared = FALSE, executor_contact_shared = FALSE
                WHERE id = {job_id}"""
        )
        cur.execute(f'SELECT name, max_user_id FROM {SCHEMA}.users WHERE id = {executor_id}')
        ex = cur.fetchone()
        _notify(
            ex['max_user_id'] if ex else None,
            f"Вас назначили на заказ «{job['title']}». Откройте кабинет Доделай.ру: "
            f'обменяйтесь контактами и договоритесь в чате заказа.',
        )
        _notify(
            me['max_user_id'],
            f"Вы назначили исполнителя на «{job['title']}»: {ex['name'] if ex else ''}. "
            f'На выполнение — 48 часов.',
        )
        send_push(
            cur, SCHEMA, executor_id, 'status', 'Вас выбрали исполнителем',
            f"Заказ «{job['title']}» ваш. На работу — 48 часов.",
            url='/dashboard', job_id=job_id, esc=_esc,
        )
        send_push(
            cur, SCHEMA, me['id'], 'status', 'Исполнитель назначен',
            f"{ex['name'] if ex else 'Исполнитель'} взялся за «{job['title']}». На работу — 48 часов.",
            url='/dashboard', job_id=job_id, esc=_esc,
        )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'share_contact':
        if me['id'] == job['owner_id']:
            column = 'owner_contact_shared'
            other = job['assigned_executor_id']
        elif me['id'] == job['assigned_executor_id']:
            column = 'executor_contact_shared'
            other = job['owner_id']
        else:
            return _resp(403, {'error': 'not_participant'})
        cur.execute(f'UPDATE {SCHEMA}.jobs SET {column} = TRUE WHERE id = {job_id}')
        if other:
            cur.execute(f'SELECT max_user_id FROM {SCHEMA}.users WHERE id = {other}')
            row = cur.fetchone()
            _notify(
                row['max_user_id'] if row else None,
                f"{me['name']} открыл контакты по заказу «{job['title']}».",
            )
            send_push(
                cur, SCHEMA, other, 'status', 'Контакты открыты',
                f"{me['name']} открыл контакты по заказу «{job['title']}»",
                url='/dashboard', job_id=job_id, esc=_esc,
            )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'complete':
        if job['owner_id'] != me['id']:
            return _resp(403, {'error': 'not_owner'})
        if job['status'] not in ('assigned', 'expiring'):
            return _resp(400, {'error': 'bad_status'})
        cur.execute(
            f"""SELECT assigned_at + INTERVAL '15 minutes' > NOW() AS too_soon,
                       assigned_at + INTERVAL '15 minutes' AS ready_at
                FROM {SCHEMA}.jobs WHERE id = {job_id}"""
        )
        gate = cur.fetchone()
        if gate and gate['too_soon']:
            return _resp(400, {'error': 'too_soon', 'readyAt': str(gate['ready_at'])})
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
        cur.execute(
            f"SELECT max_user_id FROM {SCHEMA}.users WHERE id = {job['assigned_executor_id']}"
        )
        row = cur.fetchone()
        _notify(
            row['max_user_id'] if row else None,
            f"Заказ «{job['title']}» завершён на сумму {final_price} ₽. "
            f'Оставьте отзыв о заказчике в кабинете Доделай.ру.',
        )
        send_push(
            cur, SCHEMA, job['assigned_executor_id'], 'status', 'Заказ завершён',
            f"«{job['title']}» закрыт на {final_price} ₽. Оставьте отзыв о заказчике.",
            url='/dashboard', job_id=job_id, esc=_esc,
        )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'cancel':
        allowed = me['id'] in (job['owner_id'], job['assigned_executor_id'])
        if not allowed:
            return _resp(403, {'error': 'not_allowed'})
        if job['status'] == 'done':
            return _resp(400, {'error': 'already_done'})

        by_executor = me['id'] == job['assigned_executor_id'] and me['id'] != job['owner_id']
        if by_executor:
            cur.execute(
                f"""UPDATE {SCHEMA}.jobs
                    SET status = 'open', assigned_executor_id = NULL, assigned_at = NULL,
                        deadline_at = NULL, owner_contact_shared = FALSE,
                        executor_contact_shared = FALSE, bumped_at = NOW(),
                        expires_at = NOW() + INTERVAL '24 hours'
                    WHERE id = {job_id}"""
            )
            cur.execute(
                f'DELETE FROM {SCHEMA}.job_responses WHERE job_id = {job_id} '
                f"AND executor_id = {me['id']}"
            )
            cur.execute(f'SELECT max_user_id FROM {SCHEMA}.users WHERE id = {job["owner_id"]}')
            row = cur.fetchone()
            _notify(
                row['max_user_id'] if row else None,
                f"Исполнитель {me['name']} отказался от заказа «{job['title']}». "
                f'Задание снова в ленте — выберите другого исполнителя.',
            )
            send_push(
                cur, SCHEMA, job['owner_id'], 'status', 'Исполнитель отказался',
                f"{me['name']} отказался от «{job['title']}». Задание снова в ленте.",
                url='/dashboard', job_id=job_id, esc=_esc,
            )
            return _resp(200, {'ok': True, 'returnedToFeed': True})

        cur.execute(f"UPDATE {SCHEMA}.jobs SET status = 'cancelled' WHERE id = {job_id}")
        if job['assigned_executor_id']:
            cur.execute(
                f"SELECT max_user_id FROM {SCHEMA}.users WHERE id = {job['assigned_executor_id']}"
            )
            row = cur.fetchone()
            _notify(
                row['max_user_id'] if row else None,
                f"Заказчик отменил заказ «{job['title']}».",
            )
            send_push(
                cur, SCHEMA, job['assigned_executor_id'], 'status', 'Заказ отменён',
                f"Заказчик отменил «{job['title']}»",
                url='/dashboard', job_id=job_id, esc=_esc,
            )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'message':
        if me['id'] not in (job['owner_id'], job['assigned_executor_id']):
            return _resp(403, {'error': 'not_participant'})
        text = str(body.get('text', '')).strip()[:1000]
        if not text:
            return _resp(400, {'error': 'empty_message'})
        cur.execute(
            f"""INSERT INTO {SCHEMA}.job_messages (job_id, author_id, text)
                VALUES ({job_id}, {me['id']}, '{_esc(text)}')"""
        )
        other = (
            job['assigned_executor_id'] if me['id'] == job['owner_id'] else job['owner_id']
        )
        if other:
            cur.execute(f'SELECT max_user_id FROM {SCHEMA}.users WHERE id = {other}')
            row = cur.fetchone()
            _notify(
                row['max_user_id'] if row else None,
                f"Новое сообщение по заказу «{job['title']}» от {me['name']}: {text[:120]}",
            )
            send_push(
                cur, SCHEMA, other, 'messages', f"Сообщение по «{job['title']}»",
                f"{me['name']}: {text[:100]}",
                url='/dashboard', job_id=job_id, esc=_esc,
            )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'delete':
        if job['owner_id'] != me['id']:
            return _resp(403, {'error': 'not_owner'})
        if job['status'] not in ('open', 'cancelled'):
            return _resp(400, {'error': 'job_in_work'})
        cur.execute(f'DELETE FROM {SCHEMA}.job_responses WHERE job_id = {job_id}')
        cur.execute(f'DELETE FROM {SCHEMA}.job_invites WHERE job_id = {job_id}')
        cur.execute(f'DELETE FROM {SCHEMA}.jobs WHERE id = {job_id}')
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
        send_push(
            cur, SCHEMA, target, 'status', 'Новый отзыв о вас',
            f"{me['name']} поставил {rating} из 5",
            url='/dashboard', job_id=job_id, esc=_esc,
        )
        return _resp(200, {'ok': True})

    return _resp(404, {'error': 'unknown_action'})