import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { api, ReviewItem, User } from '@/lib/api';
import { money } from '@/data/mock';
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

const dateRu = (v: string) =>
  new Date(v).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

const ProfileDialog = ({ userId, onOpenChange, showDetails = false }: Props) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setReviews([]);
      return;
    }
    let alive = true;
    setLoading(true);
    api
      .auth('profile', { params: { id: String(userId) } })
      .then((r) => {
        if (!alive) return;
        setProfile(r.user);
        setReviews(r.reviews || []);
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
            {profile?.role === 'executor' ? 'Исполнитель Доделай.ру' : 'Заказчик Доделай.ру'}
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
                </p>
                <p
                  className={`truncate text-sm ${profile.online ? 'text-emerald-600' : 'text-chip'}`}
                >
                  {seenText(profile)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-3xl border border-line bg-tile p-5 text-center">
              <div>
                <p className="font-head text-lg text-primary">★ {profile.rating.toFixed(1)}</p>
                <p className="text-xs text-chip">рейтинг</p>
              </div>
              <div>
                <p className="font-head text-lg">{profile.doneCount}</p>
                <p className="text-xs text-chip">работ</p>
              </div>
              <div>
                <p className="font-head text-lg">{profile.reviewsCount}</p>
                <p className="text-xs text-chip">отзывов</p>
              </div>
            </div>

            {showDetails && (profile.about || profile.city || profile.skill) && (
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
                {profile.about && (
                  <>
                    <h4 className="mt-3 font-head text-base font-medium">О себе</h4>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                      {profile.about}
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="border-t border-line pt-4">
              <h4 className="font-head text-lg font-medium">Отзывы</h4>
              {reviews.length === 0 ? (
                <p className="mt-2 text-sm text-chip">Отзывов пока нет.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {reviews.map((r, i) => (
                    <div key={i} className="rounded-2xl border border-line bg-tile p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium">{r.author_name}</span>
                        <span className="text-sm text-primary">
                          {'★'.repeat(r.rating)}
                          <span className="text-chip">{'★'.repeat(5 - r.rating)}</span>
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-chip">
                        {r.job_title}
                        {r.final_price ? ` · ${money(r.final_price)}` : ''} · {dateRu(r.created_at)}
                      </p>
                      {r.text && (
                        <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;