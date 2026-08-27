import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
}

BOT_TOKEN = os.environ.get('MAX_BOT_TOKEN', '')
WEBHOOK_URL = 'https://functions.poehali.dev/ed035bdd-fa92-41df-9f81-85c5cf6555f4?action=bot_webhook'


def _call(path: str, method: str = 'GET', payload: Any = None) -> Any:
    url = f'https://botapi.max.ru/{path}'
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={'Content-Type': 'application/json', 'Authorization': BOT_TOKEN},
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as res:
            return json.loads(res.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'detail': e.read().decode()[:300]}


def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """Настройка бота MAX для входа на сайт: подписка на сообщения и проверка связи."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    if not BOT_TOKEN:
        body = {'ok': False, 'error': 'no_bot_token'}
    else:
        info = _call('me')
        if isinstance(info, dict) and info.get('error') == 401:
            token = BOT_TOKEN.strip()
            probe = {
                'looksLikeUrl': token.startswith('http'),
                'looksLikeBearer': token.lower().startswith('bearer'),
                'hasColon': ':' in token,
                'hasAt': '@' in token,
                'segments': len(token.split('.')),
                'startsWithAlnum': token[:1].isalnum() if token else False,
            }
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', **CORS},
                'body': json.dumps({
                    'ok': False,
                    'error': 'bad_token',
                    'tokenLength': len(BOT_TOKEN),
                    'hasSpaces': ' ' in BOT_TOKEN or '\n' in BOT_TOKEN,
                    'probe': probe,
                    'detail': info.get('detail'),
                }, ensure_ascii=False),
                'isBase64Encoded': False,
            }
        subs = _call('subscriptions', 'POST', {'url': WEBHOOK_URL, 'update_types': ['message_created']})
        current = _call('subscriptions')
        body = {
            'ok': True,
            'bot': {'name': info.get('name'), 'username': info.get('username')},
            'subscribe': subs,
            'subscriptions': current,
        }

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', **CORS},
        'body': json.dumps(body, ensure_ascii=False),
        'isBase64Encoded': False,
    }