import base64
import datetime as dt
import json
import os
import random
import re
import secrets
import ssl
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional

import boto3
import psycopg2
import psycopg2.extras

try:
    from push import VAPID_PUBLIC_KEY, push_enabled, send_push
except ImportError:  # pragma: no cover
    VAPID_PUBLIC_KEY = ''

    def push_enabled() -> bool:
        return False

    def send_push(*args, **kwargs) -> int:
        return 0

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
BOT_TOKEN = os.environ.get('MAX_BOT_TOKEN', '')
BOT_NAME = os.environ.get('MAX_BOT_NAME', 'id760218194200_3_bot')
TOCHKA_TOKEN = os.environ.get('TOCHKA_MERCHANT_TOKEN', '')
TOCHKA_CUSTOMER_CODE = os.environ.get('TOCHKA_CUSTOMER_CODE', '')
TOCHKA_TERMINAL_ID = os.environ.get('TOCHKA_TERMINAL_ID', '')
TOCHKA_API = 'https://enter.tochka.com/uapi/acquiring/v1.0/payments'
SITE_URL = os.environ.get('SITE_URL', 'https://dodelay.ru')
PRO_PRICE = 990
PAID_STATUSES = ('approved', 'confirmed', 'paid', 'success', 'succeeded')

FEMALE_NAMES = {
    'анна', 'елена', 'ольга', 'наталья', 'наталия', 'татьяна', 'ирина', 'светлана',
    'мария', 'екатерина', 'юлия', 'марина', 'надежда', 'любовь', 'галина', 'валентина',
    'людмила', 'вера', 'оксана', 'дарья', 'анастасия', 'ксения', 'полина', 'софия',
    'софья', 'виктория', 'алина', 'диана', 'кристина', 'евгения', 'алёна', 'алена',
    'лариса', 'нина', 'зоя', 'инна', 'яна', 'василиса', 'маргарита', 'регина', 'элина',
    'милана', 'арина', 'ульяна', 'варвара', 'эльвира', 'роза', 'гульнара', 'лилия',
    'альбина', 'сабина', 'камила', 'камилла', 'амина', 'карина', 'кира', 'вероника',
    'валерия', 'ангелина', 'есения', 'таисия', 'злата', 'эмилия', 'олеся', 'снежана',
    'жанна', 'аида', 'алиса', 'дина', 'элла', 'эльмира', 'динара', 'земфира', 'нелли',
    'римма', 'тамара', 'фаина', 'клавдия', 'лидия', 'антонина', 'раиса', 'зинаида',
    'станислава', 'ярослава', 'мирослава', 'владислава', 'агата', 'ева', 'мила',
    'сафия', 'лейла', 'малика', 'фатима', 'айгуль', 'алсу', 'гузель', 'юля', 'катя',
    'таня', 'оля', 'настя', 'даша', 'маша', 'лена', 'света', 'ира', 'наташа', 'люба',
    'нюра', 'аня', 'ксюша', 'лиза', 'елизавета', 'нонна', 'сара', 'эстер',
}

MALE_NAMES_ENDING_A = {
    'никита', 'илья', 'кузьма', 'фома', 'савва', 'лука', 'данила', 'гаврила',
    'добрыня', 'серёжа', 'сережа', 'слава', 'миша', 'саша', 'женя', 'вася',
    'коля', 'толя', 'витя', 'петя', 'ваня', 'дима', 'лёша', 'леша', 'гриша',
    'паша', 'рома', 'жора', 'сила', 'фёдора', 'мустафа', 'муса', 'иса', 'аника',
}

GENDERS = ('male', 'female', '')

ADMIN_IDS = {
    x.strip().lstrip('@').lower()
    for x in os.environ.get('ADMIN_MAX_IDS', '').split(',')
    if x.strip()
}


def _tochka_call(method: str, url: str, payload: Optional[bytes] = None) -> Dict[str, Any]:
    headers = {'Authorization': f'Bearer {TOCHKA_TOKEN}', 'Accept': 'application/json'}
    if payload is not None:
        headers['Content-Type'] = 'application/json'
    try:
        import requests

        try:
            res = requests.request(
                method, url, data=payload, headers=headers, timeout=8
            )
        except requests.exceptions.SSLError:
            res = requests.request(
                method, url, data=payload, headers=headers, timeout=8, verify=False
            )
        if res.status_code >= 400:
            raise urllib.error.HTTPError(url, res.status_code, res.text[:400], None, None)
        return json.loads(res.text or '{}')
    except ImportError:
        pass
    ctx = ssl.create_default_context()
    try:
        req = urllib.request.Request(url, data=payload, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=8, context=ctx) as res:
            return json.loads(res.read().decode() or '{}')
    except urllib.error.URLError as exc:
        if not isinstance(getattr(exc, 'reason', None), ssl.SSLError):
            raise
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(url, data=payload, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=8, context=ctx) as res:
            return json.loads(res.read().decode() or '{}')


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


def _guess_gender(name: str) -> str:
    """Определяет пол по первому слову имени: 'female' или 'male'."""
    first = re.split(r'[\s,.]+', str(name or '').strip().lower())
    first = first[0] if first else ''
    if not first:
        return 'male'
    if first in FEMALE_NAMES:
        return 'female'
    if first in MALE_NAMES_ENDING_A:
        return 'male'
    if first.endswith('а') or first.endswith('я'):
        return 'female'
    return 'male'


def _default_avatar(gender: str) -> str:
    if gender == 'female':
        return '/avatar-female.png'
    return '/avatar-male.png'


def _prof_row(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'id': row['id'],
        'slug': row['slug'],
        'label': row['label'],
        'icon': row.get('icon') or '',
    }


def _professions_map(cur, user_ids) -> Dict[int, list]:
    """Профессии сразу для пачки пользователей — один запрос, без N+1."""
    ids = sorted({int(u) for u in user_ids if u})
    out: Dict[int, list] = {i: [] for i in ids}
    if not ids:
        return out
    try:
        cur.execute(
            f"""SELECT up.user_id, p.id, p.slug, p.label, p.icon
                FROM {SCHEMA}.user_professions up
                JOIN {SCHEMA}.professions p ON p.id = up.profession_id
                WHERE up.user_id IN ({','.join(str(i) for i in ids)})
                ORDER BY p.sort_order, p.id"""
        )
        for r in cur.fetchall():
            out.setdefault(int(r['user_id']), []).append(_prof_row(r))
    except Exception:
        pass
    return out


def _user_professions(cur, user_id: Any) -> list:
    return _professions_map(cur, [user_id]).get(int(user_id), [])


def _user_row(
    row: Dict[str, Any],
    private: bool = False,
    profs_map: Optional[Dict[int, list]] = None,
    cur=None,
) -> Dict[str, Any]:
    if profs_map is not None:
        professions = profs_map.get(int(row['id']), [])
    elif cur is not None:
        professions = _user_professions(cur, row['id'])
    else:
        professions = []
    data = {
        'id': row['id'],
        'maxId': row['max_id'],
        'role': row['role'],
        'name': row['name'],
        'city': row['city'],
        'skill': row['skill'],
        'about': row['about'],
        'avatar': row.get('avatar'),
        'gender': row.get('gender') or '',
        'professions': professions,
        'rating': float(row['rating']) if row['rating'] is not None else 0.0,
        'reviewsCount': row['reviews_count'],
        'doneCount': row['done_count'],
        'verified': bool(row.get('verified')),
        'online': _online(row.get('last_seen')),
        'lastSeen': row.get('last_seen'),
        'subscriptionUntil': row.get('subscription_until'),
        'autoRenew': bool(row.get('subscription_auto_renew')),
        'isPro': _is_pro(row.get('subscription_until')),
        'blocked': bool(row.get('blocked')),
        'createdAt': row['created_at'],
    }
    if private:
        data['phone'] = row['phone']
        data['contact'] = row['contact']
        data['token'] = row['token']
        data['isAdmin'] = bool(row.get('is_admin'))
        data['notifyMessages'] = bool(row.get('notify_messages', True))
        data['notifyResponses'] = bool(row.get('notify_responses', True))
        data['notifyStatus'] = bool(row.get('notify_status', True))
    return data


def _is_pro(until) -> bool:
    return bool(until and until > dt.datetime.now())


def _int_safe(v) -> int:
    digits = re.sub(r'\D', '', str(v or ''))
    return int(digits) if digits else 0


def _online(seen) -> bool:
    if not seen:
        return False
    return dt.datetime.now() - seen < dt.timedelta(minutes=3)


def _me(cur, token: str) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    cur.execute(f"SELECT * FROM {SCHEMA}.users WHERE token = '{_esc(token)}'")
    row = cur.fetchone()
    if row:
        cur.execute(f"UPDATE {SCHEMA}.users SET last_seen = NOW() WHERE id = {row['id']}")
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


def _notify(max_user_id: Any, text: str):
    """Сообщение пользователю в мессенджер MAX. Никогда не бросает исключений."""
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


def _dig_status(data: Any) -> str:
    """Достаёт статус операции из ответа Точки по нескольким возможным путям."""
    if not isinstance(data, dict):
        return ''
    root = data.get('Data') if isinstance(data.get('Data'), dict) else data
    candidates = [root]
    if isinstance(root, dict):
        op = root.get('Operation')
        if isinstance(op, dict):
            candidates.append(op)
        if isinstance(op, list) and op and isinstance(op[0], dict):
            candidates.append(op[0])
        ops = root.get('Operations')
        if isinstance(ops, list) and ops and isinstance(ops[0], dict):
            candidates.append(ops[0])
        payment = root.get('Payment')
        if isinstance(payment, dict):
            candidates.append(payment)
    candidates.append(data)
    for item in candidates:
        if not isinstance(item, dict):
            continue
        for key in ('status', 'Status', 'operationStatus', 'paymentStatus'):
            value = item.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip().lower()
    return ''


def _apply_payment(cur, payment_row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Помечает платёж оплаченным и продлевает подписку. Возвращает строку пользователя."""
    pid = int(payment_row['id'])
    uid = int(payment_row['user_id'])
    months = max(1, min(12, int(payment_row.get('months') or 1)))
    cur.execute(
        f"""UPDATE {SCHEMA}.payments SET status = 'paid', paid_at = NOW()
            WHERE id = {pid} AND status <> 'paid'"""
    )
    cur.execute(
        f"""UPDATE {SCHEMA}.users
            SET subscription_until = GREATEST(COALESCE(subscription_until, NOW()), NOW())
                                     + INTERVAL '{months} months',
                subscription_auto_renew = FALSE, subscription_cancelled_at = NULL
            WHERE id = {uid} RETURNING *"""
    )
    row = cur.fetchone()
    if not row:
        return None
    row = dict(row)
    until = row.get('subscription_until')
    until_text = until.strftime('%d.%m.%Y') if hasattr(until, 'strftime') else str(until)
    _notify(row.get('max_user_id'), f'Оплата прошла. Доделай PRO активен до {until_text}.')
    send_push(
        cur, SCHEMA, uid, 'status', 'Доделай PRO активен',
        f'Оплата прошла. Подписка действует до {until_text}.',
        url='/dashboard', esc=_esc,
    )
    return row


def _expire_subscriptions(cur):
    """Гасит просроченные подписки и напоминает тем, у кого PRO кончается завтра."""
    try:
        cur.execute(
            f"""SELECT id, max_user_id, subscription_until FROM {SCHEMA}.users
                WHERE subscription_until IS NOT NULL AND subscription_until < NOW()
                LIMIT 50"""
        )
        expired = [dict(r) for r in cur.fetchall()]
        for user in expired:
            uid = int(user['id'])
            cur.execute(
                f"""UPDATE {SCHEMA}.users
                    SET subscription_until = NULL, subscription_auto_renew = FALSE
                    WHERE id = {uid}"""
            )
            _notify(
                user.get('max_user_id'),
                'Подписка Доделай PRO закончилась. Продлите её в кабинете, '
                'чтобы снова размещать задания без лимита.',
            )
            send_push(
                cur, SCHEMA, uid, 'status', 'Подписка закончилась',
                'Доделай PRO больше не активен. Продлите подписку в кабинете.',
                url='/dashboard', esc=_esc,
            )

        cur.execute(
            f"""SELECT id, max_user_id, subscription_until FROM {SCHEMA}.users
                WHERE subscription_until IS NOT NULL
                  AND subscription_until > NOW()
                  AND subscription_until < NOW() + INTERVAL '24 hours'
                LIMIT 50"""
        )
        soon = [dict(r) for r in cur.fetchall()]
        for user in soon:
            uid = int(user['id'])
            cur.execute(
                f"""SELECT 1 FROM {SCHEMA}.push_log
                    WHERE user_id = {uid} AND kind = 'status'
                      AND title = 'Подписка заканчивается'
                      AND created_at > NOW() - INTERVAL '2 days' LIMIT 1"""
            )
            if cur.fetchone():
                continue
            until = user.get('subscription_until')
            until_text = until.strftime('%d.%m.%Y') if hasattr(until, 'strftime') else str(until)
            _notify(
                user.get('max_user_id'),
                f'Подписка Доделай PRO заканчивается завтра, {until_text}. '
                'Продлите её в кабинете, чтобы не потерять возможности PRO.',
            )
            send_push(
                cur, SCHEMA, uid, 'status', 'Подписка заканчивается',
                f'Доделай PRO действует до {until_text}. Продлите подписку в кабинете.',
                url='/dashboard', esc=_esc,
            )
    except Exception:
        pass


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
    _expire_subscriptions(cur)

    if method == 'GET' and action == 'config':
        return _resp(200, {'maxEnabled': bool(BOT_TOKEN), 'botName': BOT_NAME})

    if method == 'GET' and action == 'push_config':
        return _resp(200, {'publicKey': VAPID_PUBLIC_KEY, 'enabled': push_enabled()})

    if method == 'GET' and action == 'me':
        row = _me(cur, token)
        if not row:
            return _resp(401, {'error': 'no_token'})
        return _resp(200, {'user': _user_row(row, True, cur=cur)})

    if method == 'GET' and action == 'professions':
        cur.execute(
            f"""SELECT id, slug, label, icon FROM {SCHEMA}.professions
                ORDER BY sort_order, id"""
        )
        return _resp(200, {'professions': [_prof_row(r) for r in cur.fetchall()]})

    if method == 'GET' and action == 'people':
        wanted = []
        multi = str(params.get('professions') or '').split(',')
        for raw in [params.get('profession') or ''] + multi:
            piece = str(raw or '').strip().lower()[:60]
            if piece:
                wanted.append(piece)
        prof_join = ''
        if wanted:
            slugs = ', '.join(f"'{_esc(w)}'" for w in wanted)
            ids = [str(_int_safe(w)) for w in wanted if _int_safe(w)]
            id_cond = f" OR p.id IN ({', '.join(ids)})" if ids else ''
            prof_join = f"""
                AND EXISTS (
                    SELECT 1 FROM {SCHEMA}.user_professions up
                    JOIN {SCHEMA}.professions p ON p.id = up.profession_id
                    WHERE up.user_id = users.id
                      AND (LOWER(p.slug) IN ({slugs}){id_cond})
                )"""
        cur.execute(
            f"""SELECT * FROM {SCHEMA}.users
                WHERE role = 'executor' AND blocked = FALSE{prof_join}
                ORDER BY (last_seen > NOW() - INTERVAL '3 minutes') DESC,
                         rating DESC, done_count DESC LIMIT 200"""
        )
        executor_rows = [dict(r) for r in cur.fetchall()]
        ex_profs = _professions_map(cur, [r['id'] for r in executor_rows])
        executors = [_user_row(r, profs_map=ex_profs) for r in executor_rows]
        cur.execute(
            f"""SELECT * FROM {SCHEMA}.users WHERE role = 'customer' AND blocked = FALSE
                ORDER BY (last_seen > NOW() - INTERVAL '3 minutes') DESC,
                         last_seen DESC NULLS LAST LIMIT 200"""
        )
        customer_rows = [dict(r) for r in cur.fetchall()]
        cu_profs = _professions_map(cur, [r['id'] for r in customer_rows])
        customers = [_user_row(r, profs_map=cu_profs) for r in customer_rows]
        cur.execute(
            f"""SELECT
                 (SELECT COUNT(*) FROM {SCHEMA}.users WHERE role = 'executor' AND blocked = FALSE) AS executors,
                 (SELECT COUNT(*) FROM {SCHEMA}.users WHERE role = 'customer' AND blocked = FALSE) AS customers,
                 (SELECT COUNT(*) FROM {SCHEMA}.users
                  WHERE role IN ('customer','executor') AND blocked = FALSE
                    AND last_seen > NOW() - INTERVAL '3 minutes') AS online"""
        )
        counts = dict(cur.fetchone())
        return _resp(200, {
            'executors': executors,
            'customers': customers,
            'counts': {k: int(v or 0) for k, v in counts.items()},
        })

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
                WHERE r.target_id = {uid} AND r.hidden = FALSE
                ORDER BY r.created_at DESC LIMIT 30"""
        )
        reviews = [dict(r) for r in cur.fetchall()]
        return _resp(200, {'user': _user_row(row, cur=cur), 'reviews': reviews})

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
                        verified = {'TRUE' if code else 'verified'},
                        last_seen = NOW(),
                        max_user_id = {"'" + _esc(max_user_id) + "'" if max_user_id else 'max_user_id'}
                    WHERE id = {row['id']} RETURNING *"""
            )
            existing = dict(cur.fetchone())
            if not (existing.get('avatar') or '').strip():
                gender = existing.get('gender') or _guess_gender(existing.get('name') or '')
                cur.execute(
                    f"""UPDATE {SCHEMA}.users
                        SET gender = '{_esc(gender)}', avatar = '{_esc(_default_avatar(gender))}'
                        WHERE id = {existing['id']} RETURNING *"""
                )
                existing = dict(cur.fetchone())
            return _resp(200, {'user': _user_row(existing, True, cur=cur), 'created': False})

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
        gender = str(body.get('gender', '')).strip().lower()
        if gender not in ('male', 'female'):
            gender = _guess_gender(name)
        avatar = str(body.get('avatar', '')).strip()
        if not avatar.startswith('http'):
            avatar = _default_avatar(gender)


        cur.execute(
            f"""INSERT INTO {SCHEMA}.users
                  (max_id, max_user_id, role, name, city, phone, contact, skill, about,
                   accepted_terms, token, is_admin, verified, gender, avatar)
                VALUES ('{_esc(max_id)}', '{_esc(max_user_id)}', '{role}', '{_esc(name)}',
                        '{_esc(city)}', '{_esc(phone)}', '{_esc(contact)}', '{_esc(skill)}',
                        '{_esc(about)}', TRUE, '{_esc(new_token)}',
                        {'TRUE' if is_admin else 'FALSE'}, {'TRUE' if code else 'FALSE'},
                        '{_esc(gender)}', '{_esc(avatar)}')
                RETURNING *"""
        )
        return _resp(200, {'user': _user_row(cur.fetchone(), True, cur=cur), 'created': True})

    if method == 'POST' and action == 'support_create':
        me = _me(cur, token)
        if not me:
            return _resp(401, {'error': 'no_token'})
        text = str(body.get('text', '')).strip()[:2000]
        topic = str(body.get('topic', 'other')).strip()[:60] or 'other'
        if len(text) < 10:
            return _resp(400, {'error': 'text_too_short'})
        cur.execute(
            f"""INSERT INTO {SCHEMA}.support_tickets (user_id, topic, text)
                VALUES ({me['id']}, '{_esc(topic)}', '{_esc(text)}') RETURNING id"""
        )
        return _resp(200, {'id': cur.fetchone()['id']})

    if method == 'POST' and action == 'support_my':
        me = _me(cur, token)
        if not me:
            return _resp(401, {'error': 'no_token'})
        cur.execute(
            f"""SELECT id, topic, text, status, answer, created_at, answered_at
                FROM {SCHEMA}.support_tickets WHERE user_id = {me['id']}
                ORDER BY created_at DESC LIMIT 30"""
        )
        return _resp(200, {'tickets': [dict(r) for r in cur.fetchall()]})

    if method == 'GET' and action == 'billing_config':
        return _resp(200, {
            'paymentsEnabled': bool(TOCHKA_TOKEN),
            'price': PRO_PRICE,
            'currency': 'RUB',
        })

    if method == 'POST' and action == 'pay_start':
        me = _me(cur, token)
        if not me:
            return _resp(401, {'error': 'no_token'})
        months = max(1, min(12, _int_safe(body.get('months')) or 1))
        amount = PRO_PRICE * months
        cur.execute(
            f"""INSERT INTO {SCHEMA}.payments (user_id, amount, months, status)
                VALUES ({me['id']}, {amount}, {months}, 'created') RETURNING id"""
        )
        payment_id = cur.fetchone()['id']

        if not TOCHKA_TOKEN:
            return _resp(200, {
                'paymentsEnabled': False,
                'paymentId': payment_id,
                'amount': amount,
                'months': months,
            })

        payload = json.dumps({
            'Data': {
                'customerCode': TOCHKA_CUSTOMER_CODE,
                'amount': f'{amount}.00',
                'purpose': f'Подписка Доделай PRO на {months} мес. Платёж №{payment_id}',
                'redirectUrl': f'{SITE_URL}/dashboard?payment=success&pid={payment_id}',
                'failRedirectUrl': f'{SITE_URL}/dashboard?payment=fail&pid={payment_id}',
                'paymentMode': ['card', 'sbp'],
                'merchantId': TOCHKA_TERMINAL_ID or TOCHKA_CUSTOMER_CODE,
                'preAuthorization': False,
                'ttl': 60,
            }
        }).encode()
        try:
            data = _tochka_call('POST', TOCHKA_API, payload)
            info = (data.get('Data') or {})
            url = info.get('paymentLink') or info.get('paymentUrl') or ''
            operation = info.get('operationId') or ''
            cur.execute(
                f"""UPDATE {SCHEMA}.payments
                    SET payment_url = '{_esc(url)}', operation_id = '{_esc(operation)}',
                        provider = 'tochka', status = 'pending'
                    WHERE id = {payment_id}"""
            )
            return _resp(200, {
                'paymentsEnabled': True,
                'paymentId': payment_id,
                'paymentUrl': url,
                'amount': amount,
                'months': months,
            })
        except urllib.error.HTTPError as exc:
            detail = ''
            try:
                detail = exc.read().decode()[:400]
            except Exception:
                detail = ''
            print(f'TOCHKA_HTTP_ERROR {exc.code}: {detail}')
            cur.execute(
                f"UPDATE {SCHEMA}.payments SET status = 'failed' WHERE id = {payment_id}"
            )
            if exc.code in (401, 403):
                return _resp(502, {'error': 'payment_auth_error'})
            return _resp(502, {'error': 'payment_provider_error'})
        except Exception as exc:
            print(f'TOCHKA_ERROR {type(exc).__name__}: {exc}')
            cur.execute(
                f"UPDATE {SCHEMA}.payments SET status = 'failed' WHERE id = {payment_id}"
            )
            return _resp(502, {'error': 'payment_provider_error'})

    if method == 'POST' and action == 'pay_check':
        me = _me(cur, token)
        if not me:
            return _resp(401, {'error': 'no_token'})
        pid = _int_safe(body.get('paymentId'))
        if not pid:
            return _resp(400, {'error': 'no_payment'})
        cur.execute(
            f"""SELECT * FROM {SCHEMA}.payments
                WHERE id = {pid} AND user_id = {me['id']}"""
        )
        payment = cur.fetchone()
        if not payment:
            return _resp(404, {'error': 'payment_not_found'})
        payment = dict(payment)
        if payment.get('status') == 'paid':
            return _resp(200, {'status': 'paid', 'user': _user_row(me, True, cur=cur)})

        operation = str(payment.get('operation_id') or '').strip()
        if not operation or not TOCHKA_TOKEN:
            return _resp(200, {'status': 'pending'})
        try:
            data = _tochka_call('GET', f'{TOCHKA_API}/{urllib.parse.quote(operation)}')
            if _dig_status(data) not in PAID_STATUSES:
                return _resp(200, {'status': 'pending'})
            row = _apply_payment(cur, payment)
            if not row:
                return _resp(200, {'status': 'pending'})
            return _resp(200, {'status': 'paid', 'user': _user_row(row, True, cur=cur)})
        except Exception:
            return _resp(200, {'status': 'pending'})

    if method == 'POST' and action == 'tochka_webhook':
        try:
            payload = body if isinstance(body, dict) else {}
            root = payload.get('Data') if isinstance(payload.get('Data'), dict) else payload
            operation = ''
            for holder in (root, payload):
                if not isinstance(holder, dict):
                    continue
                for key in ('operationId', 'operation_id', 'paymentId', 'id'):
                    value = holder.get(key)
                    if isinstance(value, (str, int)) and str(value).strip():
                        operation = str(value).strip()[:200]
                        break
                if operation:
                    break
            if operation and _dig_status(payload) in PAID_STATUSES:
                cur.execute(
                    f"""SELECT * FROM {SCHEMA}.payments
                        WHERE operation_id = '{_esc(operation)}' AND status <> 'paid'
                        ORDER BY id DESC LIMIT 1"""
                )
                payment = cur.fetchone()
                if payment:
                    _apply_payment(cur, dict(payment))
        except Exception:
            pass
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'unsubscribe':
        me = _me(cur, token)
        if not me:
            return _resp(401, {'error': 'no_token'})
        immediate = bool(body.get('immediate'))
        if immediate:
            cur.execute(
                f"""UPDATE {SCHEMA}.users
                    SET subscription_until = NULL, subscription_auto_renew = FALSE,
                        subscription_cancelled_at = NOW()
                    WHERE id = {me['id']} RETURNING *"""
            )
        else:
            cur.execute(
                f"""UPDATE {SCHEMA}.users
                    SET subscription_auto_renew = FALSE, subscription_cancelled_at = NOW()
                    WHERE id = {me['id']} RETURNING *"""
            )
        return _resp(200, {'user': _user_row(cur.fetchone(), True, cur=cur)})

    if method == 'POST' and action == 'subscribe':
        me = _me(cur, token)
        if not me:
            return _resp(401, {'error': 'no_token'})
        if not me.get('is_admin'):
            return _resp(403, {'error': 'payment_required'})
        months = 1 if _int_safe(body.get('months')) < 1 else min(12, _int_safe(body.get('months')))
        cur.execute(
            f"""UPDATE {SCHEMA}.users
                SET subscription_until = GREATEST(COALESCE(subscription_until, NOW()), NOW())
                                         + INTERVAL '{months} months',
                    subscription_auto_renew = TRUE, subscription_cancelled_at = NULL
                WHERE id = {me['id']} RETURNING *"""
        )
        return _resp(200, {'user': _user_row(cur.fetchone(), True, cur=cur), 'test': True})

    if method == 'PUT' and action == 'my_professions':
        me = _me(cur, token)
        if not me:
            return _resp(401, {'error': 'no_token'})
        if me.get('role') != 'executor':
            return _resp(403, {'error': 'only_executor'})
        raw_ids = body.get('ids')
        if not isinstance(raw_ids, list):
            return _resp(400, {'error': 'bad_ids'})
        wanted = []
        for item in raw_ids:
            if isinstance(item, bool) or not isinstance(item, (int, float, str)):
                continue
            value = _int_safe(item)
            if value and value not in wanted:
                wanted.append(value)
        wanted = wanted[:8]
        valid = []
        if wanted:
            cur.execute(
                f"""SELECT id FROM {SCHEMA}.professions
                    WHERE id IN ({', '.join(str(i) for i in wanted)})"""
            )
            existing = {int(r['id']) for r in cur.fetchall()}
            valid = [i for i in wanted if i in existing]
        cur.execute(f"DELETE FROM {SCHEMA}.user_professions WHERE user_id = {me['id']}")
        if valid:
            values = ', '.join(f"({me['id']}, {i})" for i in valid)
            cur.execute(
                f"""INSERT INTO {SCHEMA}.user_professions (user_id, profession_id)
                    VALUES {values} ON CONFLICT DO NOTHING"""
            )
        cur.execute(f"SELECT * FROM {SCHEMA}.users WHERE id = {me['id']}")
        return _resp(200, {'user': _user_row(cur.fetchone(), True, cur=cur)})

    if method == 'POST' and action == 'backfill_avatars':
        me = _me(cur, token)
        if not me:
            return _resp(401, {'error': 'no_token'})
        if not me.get('is_admin'):
            return _resp(403, {'error': 'not_admin'})
        cur.execute(
            f"""SELECT id, name, gender FROM {SCHEMA}.users
                WHERE avatar IS NULL OR TRIM(avatar) = '' LIMIT 500"""
        )
        updated = 0
        for r in cur.fetchall():
            gender = str(r.get('gender') or '').strip().lower()
            if gender not in ('male', 'female'):
                gender = _guess_gender(r.get('name') or '')
            cur.execute(
                f"""UPDATE {SCHEMA}.users
                    SET gender = '{_esc(gender)}', avatar = '{_esc(_default_avatar(gender))}'
                    WHERE id = {int(r['id'])}"""
            )
            updated += 1
        return _resp(200, {'updated': updated})

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
        gender_sql = ''
        if 'gender' in body:
            gender = str(body.get('gender') or '').strip().lower()
            if gender not in GENDERS:
                return _resp(400, {'error': 'bad_gender'})
            gender_sql = f", gender = '{gender}'"
        cur.execute(
            f"""UPDATE {SCHEMA}.users SET name = '{_esc(name)}', city = '{_esc(city)}',
                phone = '{_esc(phone)}', contact = '{_esc(contact)}',
                skill = '{_esc(skill)}', about = '{_esc(about)}'{avatar_sql}{gender_sql}
                WHERE id = {row['id']} RETURNING *"""
        )
        return _resp(200, {'user': _user_row(cur.fetchone(), True, cur=cur)})

    if method == 'POST' and action == 'push_subscribe':
        me = _me(cur, token)
        if not me:
            return _resp(401, {'error': 'no_token'})
        endpoint = str(body.get('endpoint', '')).strip()[:500]
        keys = body.get('keys') or {}
        p256dh = str(keys.get('p256dh', '')).strip()[:300]
        auth_key = str(keys.get('auth', '')).strip()[:300]
        user_agent = str(body.get('userAgent', '')).strip()[:300]
        if not endpoint.startswith('http') or not p256dh or not auth_key:
            return _resp(400, {'error': 'bad_subscription'})
        cur.execute(
            f"""INSERT INTO {SCHEMA}.push_subscriptions
                  (user_id, endpoint, p256dh, auth, user_agent)
                VALUES ({me['id']}, '{_esc(endpoint)}', '{_esc(p256dh)}',
                        '{_esc(auth_key)}', '{_esc(user_agent)}')
                ON CONFLICT (endpoint) DO UPDATE
                SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh,
                    auth = EXCLUDED.auth, failed_count = 0"""
        )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'push_unsubscribe':
        me = _me(cur, token)
        if not me:
            return _resp(401, {'error': 'no_token'})
        endpoint = str(body.get('endpoint', '')).strip()[:500]
        if not endpoint:
            return _resp(400, {'error': 'no_endpoint'})
        cur.execute(
            f"""UPDATE {SCHEMA}.push_subscriptions SET failed_count = 99
                WHERE user_id = {me['id']} AND endpoint = '{_esc(endpoint)}'"""
        )
        return _resp(200, {'ok': True})

    if method == 'POST' and action == 'push_test':
        me = _me(cur, token)
        if not me:
            return _resp(401, {'error': 'no_token'})
        sent = send_push(
            cur, SCHEMA, me['id'], 'status', 'Доделай.ру',
            'Уведомления подключены — так они и будут выглядеть.',
            url='/dashboard', esc=_esc,
        )
        return _resp(200, {'ok': True, 'sent': sent})

    if method == 'PUT' and action == 'notify_prefs':
        me = _me(cur, token)
        if not me:
            return _resp(401, {'error': 'no_token'})
        messages = 'TRUE' if body.get('messages', True) else 'FALSE'
        responses = 'TRUE' if body.get('responses', True) else 'FALSE'
        status_pref = 'TRUE' if body.get('status', True) else 'FALSE'
        cur.execute(
            f"""UPDATE {SCHEMA}.users
                SET notify_messages = {messages}, notify_responses = {responses},
                    notify_status = {status_pref}
                WHERE id = {me['id']} RETURNING *"""
        )
        return _resp(200, {'user': _user_row(cur.fetchone(), True, cur=cur)})

    if action.startswith('admin_'):
        me = _me(cur, token)
        if not me or not me.get('is_admin'):
            return _resp(403, {'error': 'not_admin'})

        if method == 'POST' and action == 'admin_support':
            status = str(body.get('status', ''))
            where = ''
            if status in ('new', 'answered', 'closed'):
                where = f"WHERE t.status = '{status}'"
            cur.execute(
                f"""SELECT t.*, u.name, u.role, u.avatar, u.max_id, u.phone, u.contact
                    FROM {SCHEMA}.support_tickets t
                    JOIN {SCHEMA}.users u ON u.id = t.user_id
                    {where}
                    ORDER BY t.created_at DESC LIMIT 200"""
            )
            return _resp(200, {'tickets': [dict(r) for r in cur.fetchall()]})

        if method == 'POST' and action == 'admin_support_action':
            tid = _int_safe(body.get('ticketId'))
            act_type = str(body.get('act', ''))
            if not tid:
                return _resp(400, {'error': 'no_ticket'})
            if act_type == 'answer':
                answer = str(body.get('answer', '')).strip()[:2000]
                cur.execute(
                    f"""UPDATE {SCHEMA}.support_tickets
                        SET answer = '{_esc(answer)}', status = 'answered', answered_at = NOW()
                        WHERE id = {tid}"""
                )
            elif act_type == 'close':
                cur.execute(
                    f"UPDATE {SCHEMA}.support_tickets SET status = 'closed' WHERE id = {tid}"
                )
            elif act_type == 'delete':
                cur.execute(f'DELETE FROM {SCHEMA}.support_tickets WHERE id = {tid}')
            else:
                return _resp(400, {'error': 'bad_act'})
            return _resp(200, {'ok': True})

        if method == 'POST' and action == 'admin_grant_pro':
            uid = _int_safe(body.get('userId'))
            months = _int_safe(body.get('months')) or 1
            if not uid:
                return _resp(400, {'error': 'no_user'})
            if body.get('revoke'):
                cur.execute(
                    f'UPDATE {SCHEMA}.users SET subscription_until = NULL WHERE id = {uid}'
                )
            else:
                cur.execute(
                    f"""UPDATE {SCHEMA}.users
                        SET subscription_until = GREATEST(COALESCE(subscription_until, NOW()), NOW())
                                                 + INTERVAL '{min(12, months)} months'
                        WHERE id = {uid}"""
                )
            return _resp(200, {'ok': True})

        if method == 'POST' and action == 'admin_users':
            role = body.get('role')
            where = "WHERE role IN ('customer', 'executor')"
            if role in ('customer', 'executor'):
                where = f"WHERE role = '{role}'"
            cur.execute(
                f"SELECT * FROM {SCHEMA}.users {where} ORDER BY created_at DESC LIMIT 200"
            )
            rows = [dict(r) for r in cur.fetchall()]
            profs = _professions_map(cur, [r['id'] for r in rows])
            users = []
            for r in rows:
                item = _user_row(r, True, profs_map=profs)
                item.pop('token', None)
                users.append(item)
            return _resp(200, {'users': users})

        if method == 'POST' and action == 'admin_demo_login':
            role = body.get('role')
            if role not in ('customer', 'executor'):
                return _resp(400, {'error': 'bad_role'})
            demo_id = f'demo_{role}'
            cur.execute(
                f"""SELECT * FROM {SCHEMA}.users
                    WHERE max_id = '{demo_id}' AND role = '{role}'"""
            )
            row = cur.fetchone()
            if not row:
                name = 'Демо-заказчик' if role == 'customer' else 'Демо-исполнитель'
                skill = '' if role == 'customer' else 'Разнорабочий, погрузка'
                demo_token = secrets.token_urlsafe(32)
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.users
                          (max_id, role, name, city, phone, contact, skill, about,
                           accepted_terms, token, verified)
                        VALUES ('{demo_id}', '{role}', '{name}', 'Ярославль, Кировский район',
                                '+79000000000', 'Демо-аккаунт для проверки', '{skill}',
                                'Тестовый аккаунт для осмотра кабинета.', TRUE,
                                '{demo_token}', TRUE)
                        RETURNING *"""
                )
                row = cur.fetchone()
            return _resp(200, {'user': _user_row(row, True, cur=cur)})

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
            item = _user_row(updated, True, cur=cur)
            item.pop('token', None)
            return _resp(200, {'user': item})

    return _resp(404, {'error': 'unknown_action'})