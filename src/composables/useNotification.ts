import { readonly, ref } from 'vue'

const notification = ref('')

let notificationTimer: number | undefined

function showNotification(message: string) {
  notification.value = message

  if (notificationTimer) {
    window.clearTimeout(notificationTimer)
  }

  notificationTimer = window.setTimeout(() => {
    notification.value = ''
  }, 2600)
}

export function useNotification() {
  return {
    notification: readonly(notification),
    showNotification,
  }
}
