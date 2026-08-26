import json
import os
import re
import secrets
from typing import Any, Dict

import psycopg2
import psycopg2.extras

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}


SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _esc(v: str) -> str:
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
        'rating': float(row['rating']) if row['rating'] is not None else 0.0,
        'reviewsCount': row['reviews_count'],
        'doneCount': row['done_count'],
        'createdAt': row['created_at'],
    }
    if private:
        data['phone'] = row['phone']
        data['contact'] = row['contact']
        data['token'] = row['token']
    return data


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """Аккаунты сервиса Доделай.ру: вход через профиль MAX, профиль пользователя, списки людей."""
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

    if method == 'GET' and action == 'me':
        if not token:
            return _resp(401, {'error': 'no_token'})
        cur.execute(f"SELECT * FROM {SCHEMA}.users WHERE token = '{_esc(token)}'")
        row = cur.fetchone()
        if not row:
            return _resp(401, {'error': 'bad_token'})
        return _resp(200, {'user': _user_row(row, True)})

    if method == 'GET' and action == 'people':
        cur.execute(
            f"SELECT * FROM {SCHEMA}.users WHERE role = 'executor' ORDER BY rating DESC, done_count DESC LIMIT 100"
        )
        executors = [_user_row(r) for r in cur.fetchall()]
        cur.execute(
            f"SELECT * FROM {SCHEMA}.users WHERE role = 'customer' ORDER BY created_at DESC LIMIT 100"
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
            f"""SELECT r.rating, r.text, r.created_at, u.name AS author_name, j.title AS job_title, j.final_price
                FROM {SCHEMA}.reviews r
                JOIN {SCHEMA}.users u ON u.id = r.author_id
                JOIN {SCHEMA}.jobs j ON j.id = r.job_id
                WHERE r.target_id = {uid}
                ORDER BY r.created_at DESC LIMIT 30"""
        )
        reviews = [dict(r) for r in cur.fetchall()]
        return _resp(200, {'user': _user_row(row), 'reviews': reviews})

    body = json.loads(event.get('body') or '{}')

    if method == 'POST' and action == 'login':
        max_id = str(body.get('maxId', '')).strip().lstrip('@').lower()
        role = body.get('role')
        if not re.fullmatch(r'[a-z0-9._-]{3,60}', max_id):
            return _resp(400, {'error': 'bad_max_id'})
        if role not in ('customer', 'executor'):
            return _resp(400, {'error': 'bad_role'})

        cur.execute(
            f"SELECT * FROM {SCHEMA}.users WHERE max_id = '{_esc(max_id)}' AND role = '{role}'"
        )
        row = cur.fetchone()
        if row:
            return _resp(200, {'user': _user_row(row, True), 'created': False})

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
            f"""INSERT INTO {SCHEMA}.users (max_id, role, name, city, phone, contact, skill, about, accepted_terms, token)
                VALUES ('{_esc(max_id)}', '{role}', '{_esc(name)}', '{_esc(city)}',
                        '{_esc(phone)}', '{_esc(contact)}', '{_esc(skill)}', '{_esc(about)}',
                        TRUE, '{_esc(new_token)}')
                RETURNING *"""
        )
        return _resp(200, {'user': _user_row(cur.fetchone(), True), 'created': True})

    if method == 'PUT' and action == 'profile':
        if not token:
            return _resp(401, {'error': 'no_token'})
        cur.execute(f"SELECT * FROM {SCHEMA}.users WHERE token = '{_esc(token)}'")
        row = cur.fetchone()
        if not row:
            return _resp(401, {'error': 'bad_token'})
        name = str(body.get('name', row['name'])).strip()[:160] or row['name']
        city = str(body.get('city', row['city'])).strip()[:160] or row['city']
        phone = str(body.get('phone', row['phone'] or '')).strip()[:60]
        contact = str(body.get('contact', row['contact'] or '')).strip()[:200]
        skill = str(body.get('skill', row['skill'] or '')).strip()[:200]
        about = str(body.get('about', row['about'] or '')).strip()[:1000]
        cur.execute(
            f"""UPDATE {SCHEMA}.users SET name = '{_esc(name)}', city = '{_esc(city)}',
                phone = '{_esc(phone)}', contact = '{_esc(contact)}',
                skill = '{_esc(skill)}', about = '{_esc(about)}'
                WHERE id = {row['id']} RETURNING *"""
        )
        return _resp(200, {'user': _user_row(cur.fetchone(), True)})

    return _resp(404, {'error': 'unknown_action'})
