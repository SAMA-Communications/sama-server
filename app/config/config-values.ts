export type ConfigValues = {
  app: {
    env: string
    ip?: string
    name: string
    hostName?: string
    isStandAloneNode: boolean
    watchdogPingSocketInterval: number
    xmppDomain?: string
  }
  logger: {
    logLevel: string
    singleLine: boolean
  }
  ws: {
    options: {
      ssl: {
        key?: string
        cert?: string
      }
      isSecure?: boolean
    }
    cluster: {
      nodeExpiresIn: number
      port?: string | number
      endpoint?: string
    }
    api: {
      port: string | number
    }
  }
  tcp: {
    isEnabled: boolean
    options: {
      tls: {
        key?: string
        cert?: string
      }
      isTls?: boolean
    }
    api: {
      port: string | number
    }
  }
  db: {
    mongo: {
      main: {
        url?: string
      }
      chat?: {
        url?: string
      }
      logQueries: boolean
    }
  }
  redis: {
    main: {
      url?: string
      host?: string
      port?: string
      password?: string
      db: string | number
    }
  }
  storage: {
    driver: string
    uploadUrlExpiresIn?: string
    downloadUrlExpiresIn?: string
    minio: {
      key?: string
      secret?: string
      endpoint?: string | null
      bucket?: string
      port: string | number
      useSSL: boolean
    }
    s3: {
      key?: string
      secret?: string
      endpoint?: string | null
      bucket?: string
      region: string
    }
    spaces: {
      key?: string
      secret?: string
      endpoint?: string | null
      bucket?: string
      region: string
    }
  }
  jwt: {
    access: {
      secret?: string
      expiresIn: number
    }
    refresh: {
      secret?: string
      expiresIn: number
    }
  }
  http: {
    cookie: {
      secret?: string
    }
    corsOrigin?: string
    admin: {
      apiKey?: string
    }
  }
  repl: {
    http: {
      port: number
      accessKey?: string
    }
    socket: {
      handler?: string
    }
    file: {
      in?: string
      out?: string
    }
  }
  conversation: {
    disableChannelsLogic: boolean
    isEventsEnabled: boolean
    maxParticipants: number
    preloadCount: number
    searchLimit: number
    messages: {
      preloadCount: number
    }
  }
  operationsLogs: {
    expiresIn?: string
  }
  push: {
    queueName?: string
    chatAlertQueueName?: string
  }
  chatBot: {
    login?: string
  }
  resend: {
    apiKey?: string
    sender?: string
  }
  googleAI: {
    model?: string
  }
}
