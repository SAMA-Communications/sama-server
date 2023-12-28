import Queue from 'bull'

const pushNotificationQueue = new Queue(
  'notification',
  process.env.REDIS_URL
)

export default pushNotificationQueue
