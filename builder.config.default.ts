import os from 'node:os'

import { defineBuilderConfig } from '@afilmory/builder'

import { env } from './env.js'

export default defineBuilderConfig(() => ({
  repo: {
    enable: false,
    url: process.env.BUILDER_REPO_URL ?? '',
    token: env.GIT_TOKEN,
  },
  storage: {
    provider: 'cos',
    bucket: env.COS_BUCKET || 'your-bucket-name', // You'll need to set this
    region: env.COS_REGION || 'ap-beijing',
    secretId: env.COS_SECRET_ID || 'YOUR_SECRET_ID_HERE',
    secretKey: env.COS_SECRET_KEY || 'YOUR_SECRET_KEY_HERE',
    prefix: env.COS_PREFIX || '',
    customDomain: env.COS_CUSTOM_DOMAIN,
    excludeRegex: env.COS_EXCLUDE_REGEX,
    maxFileLimit: 1000,
    keepAlive: true,
    maxSockets: 64,
    connectionTimeoutMs: 5_000,
    socketTimeoutMs: 30_000,
    requestTimeoutMs: 20_000,
    idleTimeoutMs: 10_000,
    totalTimeoutMs: 60_000,
    retryMode: 'standard',
    maxAttempts: 3,
    downloadConcurrency: 16,
  },
  options: {
    defaultConcurrency: 10,
    enableLivePhotoDetection: true,
    showProgress: true,
    showDetailedStats: true,
    digestSuffixLength: 0,
  },
  logging: {
    verbose: false,
    level: 'info',
    outputToFile: false,
  },
  performance: {
    worker: {
      workerCount: os.cpus().length * 2,
      timeout: 30_000,
      useClusterMode: true,
      workerConcurrency: 2,
    },
  },
  plugins: [],
}))
