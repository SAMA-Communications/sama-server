const CONFIG = {
  app: {
    env: process.env.NODE_ENV ?? "development",
    ip: void 0,
    name: process.env.APP_NAME ?? "SAMA",
    hostName: process.env.HOSTNAME ?? "SAMA-SERVER",
  },
  logger: {
    logLevel: process.env.LOG_LEVEL ?? "trace",
    singleLine: process.env.LOG_SINGLE_LINE === "true",
  },
  ws: {
    options: {
      ssl: {
        key: process.env.SSL_KEY_FILE_NAME,
        cert: process.env.SSL_CERT_FILE_NAME,
      },
    },
    cluster: {
      nodeExpiresIn: +process.env.NODE_CLUSTER_DATA_EXPIRES_IN,
      port: process.env.APP_CLUSTER_PORT,
    },
    api: {
      port: process.env.APP_WS_PORT ?? process.env.APP_PORT ?? process.env.PORT ?? 9001,
    },
  },
  tcp: {
    options: {
      tls: {
        key: process.env.TLS_KEY_FILE_NAME,
        cert: process.env.TLS_CERT_FILE_NAME,
      },
    },
    api: {
      port: process.env.APP_TCP_PORT ?? 8001,
    },
  },
  db: {
    mongo: {
      main: {
        url: process.env.MONGODB_URL,
      },
      logQueries: process.env.MONGODB_LOG_QUERIES === "true",
    },
  },
  redis: {
    main: {
      url: process.env.REDIS_URL,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB ?? 0,
    },
  },
  storage: {
    driver: process.env.STORAGE_DRIVER ?? "s3",
    uploadUrlExpiresIn: process.env.FILE_UPLOAD_URL_EXPIRES_IN,
    downloadUrlExpiresIn: process.env.FILE_DOWNLOAD_URL_EXPIRES_IN,
    minio: {
      key: process.env.MINIO_ACCESS_KEY,
      secret: process.env.MINIO_SECRET_KEY,
      endpoint: process.env.MINIO_ENDPOINT || null,
      bucket: process.env.MINIO_BUCKET_NAME,
      port: (process.env.MINIO_PORT = 9010),
      useSSL: process.env.MINIO_PORT === "true",
    },
    s3: {
      key: process.env.S3_ACCESS_KEY,
      secret: process.env.S3_SECRET_KEY,
      endpoint: process.env.S3_ENDPOINT || null,
      bucket: process.env.S3_BUCKET_NAME,
      region: process.env.S3_REGION ?? "us-east-1",
    },
    spaces: {
      key: process.env.SPACES_ACCESS_KEY,
      secret: process.env.SPACES_SECRET_KEY,
      endpoint: process.env.SPACES_ENDPOINT || null,
      bucket: process.env.SPACES_BUCKET_NAME,
      region: process.env.SPACES_REGION ?? "us-east-1",
    },
  },
  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: +process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: +process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
    },
  },
  http: {
    cookie: {
      secret: process.env.COOKIE_SECRET,
    },
    corsOrigin: process.env.CORS_ORIGIN,
    admin: {
      apiKey: process.env.HTTP_ADMIN_API_KEY,
    },
  },
  conversation: {
    disableChannelsLogic: process.env.CONVERSATION_DISABLE_CHANNELS_LOGIC === "true",
    isEventsEnabled: process.env.CONVERSATION_NOTIFICATIONS_ENABLED === "true",
    maxParticipants: +(process.env.CONVERSATION_MAX_PARTICIPANTS ?? 50),
    preloadCount: +(process.env.CONVERSATION_PRELOAD_COUNT ?? 30),
    searchLimit: +(process.env.SEARCH_PRELOAD_COUNT ?? 30),
    messages: {
      preloadCount: +(process.env.MESSAGE_PRELOAD_COUNT ?? 30),
    },
  },
  operationsLogs: {
    expiresIn: process.env.OPERATIONS_LOG_EXPIRES_IN,
  },
  push: {
    queueName: process.env.SAMA_NATIVE_PUSH_QUEUE_NAME,
  },
  chatBot: {
    login: process.env.CHAT_BOT_LOGIN,
  },
}

export default CONFIG
