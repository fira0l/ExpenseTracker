import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export const NotificationService = {
  setup: async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D9FF5B',
      });
    }
  },
  requestPermissions: async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return
    await Notifications.cancelAllScheduledNotificationsAsync()
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💸 Daily Expense Reminder',
        body: "Don't forget to log your expenses today!",
      },
      trigger: { hour: 21, minute: 0, repeats: true } as any,
    })
  },

  scheduleDailyReminder: async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💸 Daily Expense Reminder',
        body: "Don't forget to log your expenses today!",
      },
      trigger: { hour: 21, minute: 0, repeats: true } as any,
    })
  },

  sendBudgetAlert: async (pct: number) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Budget Alert',
        body: `You've used ${pct}% of your monthly income!`,
      },
      trigger: null,
    })
  },

  promptExpenseReason: async (transactionId: string, amount: number) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🤔 New Expense Logged',
        body: `An expense of ${amount} was auto-parsed. Tap here to add the reason/merchant.`,
        data: { transactionId },
      },
      trigger: null,
    })
  },
}
