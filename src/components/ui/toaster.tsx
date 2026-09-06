import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTimer,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

/* Сколько живёт уведомление. Пять секунд — успеть прочитать две строки
   и не держать сообщение на экране дольше нужного. */
const TOAST_DURATION = 5000

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={TOAST_DURATION}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const duration = props.duration ?? TOAST_DURATION
        return (
          <Toast key={id} {...props} duration={duration}>
            <div className="grid gap-1 pr-6">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            <ToastTimer duration={duration} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
