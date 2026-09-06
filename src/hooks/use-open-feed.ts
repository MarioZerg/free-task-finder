import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '@/hooks/use-app-state';

/**
 * Переход к заказам.
 *
 * Кнопки вроде «Смотреть заказы» должны вести к цели, а не к форме входа.
 * Вошедшего сразу отправляем в ленту, гостю показываем вход — после него
 * он попадёт туда же. Раньше окно входа открывалось всем: у вошедшего оно
 * мгновенно закрывалось, и выглядело так, будто кнопка сломана.
 */
export const useOpenFeed = () => {
  const { user, openLogin } = useAppState();
  const navigate = useNavigate();

  return useCallback(() => {
    if (user) navigate('/dashboard');
    else openLogin();
  }, [user, navigate, openLogin]);
};

export default useOpenFeed;
