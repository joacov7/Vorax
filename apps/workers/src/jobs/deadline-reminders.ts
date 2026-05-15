import { schedules } from '@trigger.dev/sdk/v3'
import { runDeadlineReminders } from '@empresa-ia/core/deadlines'

export const deadlineReminders = schedules.task({
  id: 'deadline-reminders',
  cron: '0 8 * * *', // todos los días a las 8 AM
  run: async () => runDeadlineReminders(),
})
