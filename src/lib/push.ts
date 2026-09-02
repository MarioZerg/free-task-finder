import { pushSubscribe, pushUnsubscribe } from '@/lib/api';

export const urlBase64ToUint8Array = (base64: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
};

export const pushSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

const swReady = (): Promise<ServiceWorkerRegistration> =>
  Promise.race([
    navigator.serviceWorker.ready,
    new Promise<ServiceWorkerRegistration>((_, reject) =>
      setTimeout(() => reject(new Error('sw_timeout')), 5000),
    ),
  ]);

export const getPermission = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
  try {
    return Notification.permission;
  } catch {
    return 'default';
  }
};

export const iosNeedsInstall = (): boolean => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document);
  if (!isIOS) return false;
  const standalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return !standalone;
};

export const currentSubscription = async (): Promise<PushSubscription | null> => {
  if (!pushSupported()) return null;
  try {
    const registration = await swReady();
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
};

export const enablePush = async (
  publicKey: string,
): Promise<{ ok: boolean; reason?: string }> => {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: 'denied' };

    const registration = await swReady();
    const existing = await registration.pushManager.getSubscription();
    const sub =
      existing ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      }));

    const json = sub.toJSON() as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, reason: 'error' };
    }

    await pushSubscribe(
      {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      },
      navigator.userAgent,
    );
    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
};

export const disablePush = async (): Promise<void> => {
  try {
    const sub = await currentSubscription();
    if (!sub) return;
    await pushUnsubscribe(sub.endpoint).catch(() => undefined);
    await sub.unsubscribe().catch(() => undefined);
  } catch {
    /* noop */
  }
};