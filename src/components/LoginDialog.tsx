import { Suspense, lazy } from 'react';
import { useAppState } from '@/hooks/use-app-state';

/** Окно входа грузится только когда человек его открыл.
 *
 *  Раньше форма входа со всеми шагами (ник, код из бота, анкета) попадала
 *  в первый загружаемый файл на каждой странице — хотя большинству гостей
 *  она не нужна, они просто смотрят ленту. Теперь до нажатия «Войти»
 *  этот код не скачивается, и первый экран открывается заметно быстрее.
 */
const LoginDialogBody = lazy(() => import('@/components/login/LoginDialogBody'));

const LoginDialog = () => {
  const { loginOpen } = useAppState();
  if (!loginOpen) return null;
  return (
    <Suspense fallback={null}>
      <LoginDialogBody />
    </Suspense>
  );
};

export default LoginDialog;
