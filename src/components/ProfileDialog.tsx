import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { api, User } from '@/lib/api';
import { initials, money } from '@/data/mock';

interface ReviewItem {
  rating: number;
  text: string;
  created_at: string;
  author_name: string;
  job_title: string;
  final_price: number | null;
}

interface Props {
  userId: number | null;
  onOpenChange: (v: boolean) => void;
}

const dateRu = (v: string) =>
  new Date(v).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

const ProfileDialog = ({ userId, onOpenChange }: Props) => {
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
          <DialogDescription className="text-muted-foreground/80">
            {profile?.role === 'executor' ? 'Исполнитель Доделай.ру' : 'Заказчик Доделай.ру'}
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-chip">Загружаем профиль…</p>}

        {profile && (
          <>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 font-head text-base font-semibold text-primary">
                {initials(profile.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-head text-lg font-medium">{profile.name}</p>
                <p className="truncate text-sm text-chip">
                  {profile.skill || profile.city}
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

            {profile.about && (
              <p className="text-sm leading-relaxed text-muted-foreground/85">{profile.about}</p>
            )}

            <p className="flex items-center gap-2 text-sm text-chip">
              <Icon name="MapPin" size={16} />
              {profile.city}
            </p>

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
                        <p className="mt-2 text-sm text-muted-foreground/85">{r.text}</p>
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
