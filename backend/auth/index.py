import base64
import json
import os
import random
import re
import secrets
import urllib.request
from typing import Any, Dict, Optional

import boto3
import psycopg2
import psycopg2.extras

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
BOT_TOKEN = os.environ.get('MAX_BOT_TOKEN', '')
BOT_NAME = os.environ.get('MAX_BOT_NAME', 'id760218194200_3_bot')
ADMIN_IDS = {
    x.strip().lstrip('@').lower()
    for x in os.environ.get('ADMIN_MAX_IDS', '').split(',')
    if x.strip()
}


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _esc(v: Any) -> str:
    return str(v).replace("'", "''")


def _resp(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **CORS},
        'body': json.dumps(body, ensure_ascii=False, default=str),
        'isBase64Encoded': False,
    }


def _user_row(row: Dict[str, Any], private: bool = False) -> Dict[str, Any]:
    data = {
        'id': row['id'],
        'maxId': row['max_id'],
        'role': row['role'],
        'name': row['name'],
        'city': row['city'],
        'skill': row['skill'],
        'about': row['about'],
        'avatar': row.get('avatar'),
        'rating': float(row['rating']) if row['rating'] is not None else 0.0,
        'reviewsCount': row['reviews_count'],
        'doneCount': row['done_count'],
        'verified': bool(row.get('verified')),
        'blocked': bool(row.get('blocked')),
        'createdAt': row['created_at'],
    }
    if private:
        data['phone'] = row['phone']
        data['contact'] = row['contact']
        data['token'] = row['token']
        data['isAdmin'] = bool(row.get('is_admin'))
    return data


def _me(cur, token: str) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    cur.execute(f"SELECT * FROM {SCHEMA}.users WHERE token = '{_esc(token)}'")
    row = cur.fetchone()
    return dict(row) if row else None


def _upload_avatar(data_url: str, user_id: int) -> Optional[str]:
    match = re.match(r'data:image/(png|jpe?g|webp);base64,(.+)', data_url or '', re.S)
    if not match:
        return None
    ext = 'jpg' if match.group(1).startswith('jp') else match.group(1)
    raw = base64.b64decode(match.group(2))
    if len(raw) > 3 * 1024 * 1024:
        return None
    key_id = os.environ['AWS_ACCESS_KEY_ID']
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=key_id,
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    name = f'avatars/u{user_id}-{secrets.token_hex(6)}.{ext}'
    s3.put_object(Bucket='files', Key=name, Body=raw, ContentType=f'image/{match.group(1)}')
    return f'https://cdn.poehali.dev/projects/{key_id}/bucket/{name}'


def _bot_send(chat_id: Any, text: str):
    if not BOT_TOKEN:
        return
    payload = json.dumps({'text': text}).encode()
    url = f'https://botapi.max.ru/messages?chat_id={chat_id}'
    req = urllib.request.Request(
        url,
        data=payload,
        headers={'Content-Type': 'application/json', 'Authorization': BOT_TOKEN},
    )
    urllib.request.urlopen(req, timeout=4).read()


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """Аккаунты Доделай.ру: вход через мессенджер MAX по коду, профили с аватарками, права администратора."""
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

    if method == 'GET' and action == 'config':
        return _resp(200, {'maxEnabled': bool(BOT_TOKEN), 'botName': BOT_NAME})

    if method == 'GET' and action == 'me':
        row = _me(cur, token)
        if not row:
            return _resp(401, {'error': 'no_token'})
        return _resp(200, {'user': _user_row(row, True)})

    if method == 'GET' and action == 'people':
        cur.execute(
            f"""SELECT * FROM {SCHEMA}.users WHERE role = 'executor' AND blocked = FALSE
                ORDER BY rating DESC, done_count DESC LIMIT 100"""
        )
        executors = [_user_row(r) for r in cur.fetchall()]
        cur.execute(
            f"""SELECT * FROM {SCHEMA}.users WHERE role = 'customer' AND blocked = FALSE
                ORDER BY created_at DESC LIMIT 100"""
        )
        customers = [_user_row(r) for r in cur.fetchall()]
        return _resp(200, {'executors': executors, 'customers': customers})

    if method == 'GET' and action == 'profile':
        uid = re.sub(r'\D', '', params.get('id', '')) or '0'
        cur.execute(f'SELECT * FROM {SCHEMA}.users WHERE id = {uid}')
        row = cur.fetchone()
        if not row:
            return _resp(404, {'error': 'not_found'})
        cur.execute(
            f"""SELECT r.rating, r.text, r.created_at, u.name AS author_name,
                       j.title AS job_title, j.final_price
                FROM {SCHEMA}.reviews r
                JOIN {SCHEMA}.users u ON u.id = r.author_id
                JOIN {SCHEMA}.jobs j ON j.id = r.job_id
                WHERE r.target_id = {uid}
                ORDER BY r.created_at DESC LIMIT 30"""
        )
        reviews = [dict(r) for r in cur.fetchall()]
        return _resp(200, {'user': _user_row(row), 'reviews': reviews})

    if method == 'GET' and action == 'login_status':
        code = re.sub(r'\W', '', params.get('code', ''))[:12]
        if not code:
            return _resp(400, {'error': 'no_code'})
        cur.execute(
            f"""SELECT * FROM {SCHEMA}.login_codes WHERE code = '{_esc(code)}'
                ORDER BY id DESC LIMIT 1"""
        )
        row = cur.fetchone()
        if not row:
            return _resp(404, {'error': 'code_not_found'})
        return _resp(200, {
            'status': row['status'],
            'maxId': row['max_id'],
            'maxName': row['max_name'],
        })

    body = json.loads(event.get('body') or '{}')

    if method == 'POST' and action == 'login_start':
        code = str(random.randint(100000, 999999))
        cur.execute(
            f"INSERT INTO {SCHEMA}.login_codes (code) VALUES ('{code}') RETURNING id"
        )
        return _resp(200, {
            'code': code,
            'botName': BOT_NAME,
            'botLink': f'https://max.ru/{BOT_NAME}',
            'maxEnabled': bool(BOT_TOKEN),
        })

    if method == 'POST' and action == 'bot_webhook':
        message = (body.get('message') or {})
        sender = (message.get('sender') or {})
        recipient = (message.get('recipient') or {})
        text = str(((message.get('body') or {}).get('text') or '')).strip()
        code = re.sub(r'\D', '', text)[:6]
        chat_id = recipient.get('chat_id') or sender.get('user_id')
        if len(code) == 6:
            username = str(sender.get('username') or f"max{sender.get('user_id', '')}").lower()
            name = str(sender.get('name') or username)[:200]
            cur.execute(
                f"""UPDATE {SCHEMA}.login_codes
                    SET status = 'confirmed', max_id = '{_esc(username)}',
                        max_user_id = '{_esc(sender.get('user_id', ''))}',
                        max_name = '{_esc(name)}', confirmed_at = NOW()
                    WHERE code = '{_esc(code)}' AND status = 'pending'
                      AND created_at > NOW() - INTERVAL '15 minutes'
                    RETURNING id"""
            )
            if cur.fetchone():
                _bot_send(chat_id, 'Код принят. Вернитесь на сайт Доделай.ру — вход выполнен.')
            else:
                _bot_send(chat_id, 'Код не найден или устарел. Получите новый код на сайте.')
        else:
            _bot_send(chat_id, 'Пришлите шестизначный код с сайта Доделай.ру, чтобы войти.')
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'login':
        code = re.sub(r'\W', '', str(body.get('code', '')))[:12]
        max_id = str(body.get('maxId', '')).strip().lstrip('@').lower()
        role = body.get('role')
        max_user_id = ''

        if code:
            cur.execute(
                f"""SELECT * FROM {SCHEMA}.login_codes
                    WHERE code = '{_esc(code)}' AND status = 'confirmed'
                    ORDER BY id DESC LIMIT 1"""
            )
            row = cur.fetchone()
            if not row:
                return _resp(400, {'error': 'code_not_confirmed'})
            max_id = str(row['max_id'] or '').lower()
            max_user_id = str(row['max_user_id'] or '')
        elif BOT_TOKEN:
            return _resp(400, {'error': 'code_required'})

        if not re.fullmatch(r'[a-z0-9._-]{3,60}', max_id):
            return _resp(400, {'error': 'bad_max_id'})
        if role not in ('customer', 'executor'):
            return _resp(400, {'error': 'bad_role'})

        is_admin = max_id in ADMIN_IDS
        cur.execute(
            f"SELECT * FROM {SCHEMA}.users WHERE max_id = '{_esc(max_id)}' AND role = '{role}'"
        )
        row = cur.fetchone()
        if row:
            if row['blocked']:
                return _resp(403, {'error': 'blocked'})
            cur.execute(
                f"""UPDATE {SCHEMA}.users
                    SET is_admin = {'TRUE' if is_admin else 'is_admin'},
                        verified = {'TRUE' if code else 'verified'}
                    WHERE id = {row['id']} RETURNING *"""
            )
            return _resp(200, {'user': _user_row(cur.fetchone(), True), 'created': False})

        if not body.get('acceptedTerms'):
            return _resp(400, {'error': 'terms_required'})
        name = str(body.get('name', '')).strip()[:160]
        if len(name) < 2:
            return _resp(400, {'error': 'bad_name'})
        city = str(body.get('city', 'Ярославль')).strip()[:160] or 'Ярославль'
        phone = str(body.get('phone', '')).strip()[:60]
        contact = str(body.get('contact', '')).strip()[:200] or f'MAX: @{max_id}'
        skill = str(body.get('skill', '')).strip()[:200]
        about = str(body.get('about', '')).strip()[:1000]
        new_token = secrets.token_urlsafe(32)

        cur.execute(
            f"""INSERT INTO {SCHEMA}.users
                  (max_id, max_user_id, role, name, city, phone, contact, skill, about,
                   accepted_terms, token, is_admin, verified)
                VALUES ('{_esc(max_id)}', '{_esc(max_user_id)}', '{role}', '{_esc(name)}',
                        '{_esc(city)}', '{_esc(phone)}', '{_esc(contact)}', '{_esc(skill)}',
                        '{_esc(about)}', TRUE, '{_esc(new_token)}',
                        {'TRUE' if is_admin else 'FALSE'}, {'TRUE' if code else 'FALSE'})
                RETURNING *"""
        )
        return _resp(200, {'user': _user_row(cur.fetchone(), True), 'created': True})

    if method == 'PUT' and action == 'profile':
        row = _me(cur, token)
        if not row:
            return _resp(401, {'error': 'no_token'})
        name = str(body.get('name', row['name'])).strip()[:160] or row['name']
        city = str(body.get('city', row['city'])).strip()[:160] or row['city']
        phone = str(body.get('phone', row['phone'] or '')).strip()[:60]
        contact = str(body.get('contact', row['contact'] or '')).strip()[:200]
        skill = str(body.get('skill', row['skill'] or '')).strip()[:200]
        about = str(body.get('about', row['about'] or '')).strip()[:1000]
        avatar_sql = ''
        if body.get('avatar'):
            url = _upload_avatar(str(body['avatar']), row['id'])
            if url:
                avatar_sql = f", avatar = '{_esc(url)}'"
        cur.execute(
            f"""UPDATE {SCHEMA}.users SET name = '{_esc(name)}', city = '{_esc(city)}',
                phone = '{_esc(phone)}', contact = '{_esc(contact)}',
                skill = '{_esc(skill)}', about = '{_esc(about)}'{avatar_sql}
                WHERE id = {row['id']} RETURNING *"""
        )
        return _resp(200, {'user': _user_row(cur.fetchone(), True)})

    if action.startswith('admin_'):
        me = _me(cur, token)
        if not me or not me.get('is_admin'):
            return _resp(403, {'error': 'not_admin'})

        if method == 'POST' and action == 'admin_users':
            role = body.get('role')
            where = "WHERE role IN ('customer', 'executor')"
            if role in ('customer', 'executor'):
                where = f"WHERE role = '{role}'"
            cur.execute(
                f"SELECT * FROM {SCHEMA}.users {where} ORDER BY created_at DESC LIMIT 200"
            )
            users = []
            for r in cur.fetchall():
                item = _user_row(r, True)
                item.pop('token', None)
                users.append(item)
            return _resp(200, {'users': users})

        if method == 'POST' and action == 'admin_update_user':
            uid = re.sub(r'\D', '', str(body.get('userId', ''))) or '0'
            sets = []
            if 'blocked' in body:
                sets.append(f"blocked = {'TRUE' if body['blocked'] else 'FALSE'}")
            if 'verified' in body:
                sets.append(f"verified = {'TRUE' if body['verified'] else 'FALSE'}")
            if body.get('name'):
                sets.append(f"name = '{_esc(str(body['name'])[:160])}'")
            if body.get('city'):
                sets.append(f"city = '{_esc(str(body['city'])[:160])}'")
            if body.get('skill') is not None:
                sets.append(f"skill = '{_esc(str(body['skill'])[:200])}'")
            if not sets:
                return _resp(400, {'error': 'nothing_to_update'})
            cur.execute(
                f"UPDATE {SCHEMA}.users SET {', '.join(sets)} WHERE id = {uid} RETURNING *"
            )
            updated = cur.fetchone()
            if not updated:
                return _resp(404, {'error': 'not_found'})
            item = _user_row(updated, True)
            item.pop('token', None)
            return _resp(200, {'user': item})

    return _resp(404, {'error': 'unknown_action'})