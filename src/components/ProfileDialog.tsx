import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import type { ReviewItem, User } from '@/lib/api';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileReviews from '@/components/profile/ProfileReviews';
import Avatar from '@/components/Avatar';

interface Props {
  userId: number | null;
  onOpenChange: (v: boolean) => void;
  showDetails?: boolean;
}

const seenText = (u: User) => {
  if (u.online) return 'в сети';
  if (!u.lastSeen) return 'давно не заходил';
  const min = Math.floor((Date.now() - new Date(u.lastSeen).getTime()) / 60000);
  if (min < 60) return `был в сети ${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `был в сети ${h} ч назад`;
  const d = Math.floor(h / 24);
  if (d < 30) return `был в сети ${d} дн назад`;
  return 'давно не заходил';
};

const ProfileDialog = ({ userId, onOpenChange, showDetails = false }: Props) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [exReviews, setExReviews] = useState<ReviewItem[]>([]);
  const [cuReviews, setCuReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setExReviews([]);
      setCuReviews([]);
      return;
    }
    let alive = true;
    setLoading(true);
    api
      .auth('profile', { params: { id: String(userId) } })
      .then((r) => {
        if (!alive) return;
        setProfile(r.user);
        setExReviews(r.reviewsExecutor || []);
        setCuReviews(r.reviewsCustomer || []);
      })
      .catch(() => {
        if (alive) setProfile(null);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId]);

  return (
    <Dialog open={!!userId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-line bg-surface text-foreground sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-medium tracking-tight">
            {profile?.name || 'Профиль'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Участник Доделай.ру
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-chip">Загружаем профиль…</p>}

        {profile && (
          <>
            <div className="flex items-center gap-4">
              <Avatar
                src={profile.avatar}
                name={profile.name}
                size={56}
                online={profile.online}
              />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate font-head text-lg font-medium">
                  {profile.name}
                  {profile.verified && (
                    <Icon name="BadgeCheck" size={16} className="shrink-0 text-primary" />
                  )}
                  {profile.isPro && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                      <Icon name="Crown" size={11} />
                      PRO
                    </span>
                  )}
                </p>
                <p
                  className={`truncate text-sm ${profile.online ? 'text-emerald-600' : 'text-chip'}`}
                >
                  {seenText(profile)}
                </p>
              </div>
            </div>

            {(profile.professions || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {(profile.professions || []).map((p) => (
                  <span
                    key={p.id}
                    className="flex items-center gap-1.5 rounded-full border border-line bg-tile px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    <Icon name={p.icon} size={13} fallback="Wrench" />
                    {p.label}
                  </span>
                ))}
              </div>
            )}

            <ProfileStats user={profile} />

            {showDetails &&
              (profile.about || profile.aboutCustomer || profile.city || profile.skill) && (
                <div className="rounded-3xl border border-line bg-tile p-5">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-chip">
                    {profile.city && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="MapPin" size={14} />
                        {profile.city}
                      </span>
                    )}
                    {profile.skill && (
                      <span className="flex items-center gap-1.5">
                        <Icon name="Hammer" size={14} />
                        {profile.skill}
                      </span>
                    )}
                  </div>

                  {/* Два описания: под работу и под заказы. Показываем
                      только заполненные и только для включённых режимов. */}
                  {profile.asExecutor !== false && profile.about && (
                    <>
                      <h4 className="mt-3 flex items-center gap-1.5 font-head text-base font-medium">
                        <Icon name="Hammer" size={15} className="text-primary" />
                        Как исполнитель
                      </h4>
                      <p className="mt-1 whitespace-pre-line break-words text-sm text-muted-foreground">
                        {profile.about}
                      </p>
                    </>
                  )}

                  {profile.asCustomer !== false && profile.aboutCustomer && (
                    <>
                      <h4 className="mt-4 flex items-center gap-1.5 font-head text-base font-medium">
                        <Icon name="ClipboardList" size={15} className="text-primary" />
                        Как заказчик
                      </h4>
                      <p className="mt-1 whitespace-pre-line break-words text-sm text-muted-foreground">
                        {profile.aboutCustomer}
                      </p>
                    </>
                  )}
                </div>
              )}

            <ProfileReviews
              asExecutor={profile.asExecutor !== false}
              asCustomer={profile.asCustomer !== false}
              executorReviews={exReviews}
              customerReviews={cuReviews}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;