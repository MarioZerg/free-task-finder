"""Web Push уведомления Доделай.ру: отправка через VAPID, тихий отказ при любой ошибке."""
import json
import os
from typing import Any, Optional

VAPID_PUBLIC_KEY = 'BFwxO64wNrfiwBCtokGUfKiIyZokt3Ai2E1ydU5Yqcw1ErVTlDGUHxvzO7NYvco0lgj5_pkK37Cdkhq2JiKyWo8'
VAPID_CLAIMS_SUB = 'mailto:support@dodelay.ru'
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')

MAX_SUBS = 5
PUSH_TIMEOUT = 3
KINDS = ('messages', 'responses', 'status')


def push_enabled() -> bool:
    return bool(VAPID_PRIVATE_KEY)


def _default_esc(v: Any) -> str:
    return str(v).replace("'", "''")


def send_push(
    cur,
    schema: str,
    user_id: Any,
    kind: str,
    title: str,
    body: str,
    url: str = '/dashboard',
    job_id: Optional[int] = None,
    esc=None,
) -> int:
    """Шлёт web push всем живым подпискам пользователя. Никогда не бросает исключений."""
    esc = esc or _default_esc
    sent = 0
    try:
        if not VAPID_PRIVATE_KEY or not user_id or kind not in KINDS:
            return 0
        uid = int(user_id)

        cur.execute(f'SELECT notify_{kind} AS allowed FROM {schema}.users WHERE id = {uid}')
        row = cur.fetchone()
        if not row or not row['allowed']:
            return 0

        cur.execute(
            f"""SELECT id, endpoint, p256dh, auth FROM {schema}.push_subscriptions
                WHERE user_id = {uid} AND failed_count < 3
                ORDER BY last_used_at DESC NULLS LAST, id DESC LIMIT {MAX_SUBS}"""
        )
        subs = [dict(r) for r in cur.fetchall()]
        if not subs:
            return 0

        from pywebpush import WebPushException, webpush

        payload = json.dumps({
            'title': title,
            'body': body,
            'url': url,
            'kind': kind,
            'jobId': job_id,
        }, ensure_ascii=False)

        for sub in subs:
            try:
                webpush(
                    subscription_info={
                        'endpoint': sub['endpoint'],
                        'keys': {'p256dh': sub['p256dh'], 'auth': sub['auth']},
                    },
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={'sub': VAPID_CLAIMS_SUB},
                    timeout=PUSH_TIMEOUT,
                )
                sent += 1
                cur.execute(
                    f"""UPDATE {schema}.push_subscriptions
                        SET last_used_at = NOW(), failed_count = 0 WHERE id = {int(sub['id'])}"""
                )
            except WebPushException as exc:
                code = getattr(getattr(exc, 'response', None), 'status_code', 0)
                try:
                    if code in (404, 410):
                        cur.execute(
                            f"""UPDATE {schema}.push_subscriptions
                                SET failed_count = 99 WHERE id = {int(sub['id'])}"""
                        )
                    else:
                        cur.execute(
                            f"""UPDATE {schema}.push_subscriptions
                                SET failed_count = failed_count + 1 WHERE id = {int(sub['id'])}"""
                        )
                except Exception:
                    pass
            except Exception:
                pass

        try:
            cur.execute(
                f"""INSERT INTO {schema}.push_log (user_id, kind, title, body, url, job_id, sent_count)
                    VALUES ({uid}, '{esc(kind)}', '{esc(str(title)[:300])}', '{esc(str(body)[:500])}',
                            '{esc(url)}', {int(job_id) if job_id else 'NULL'}, {sent})"""
            )
        except Exception:
            pass
    except Exception:
        return sent
    return sent