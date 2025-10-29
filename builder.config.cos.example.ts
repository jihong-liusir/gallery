import os from 'node:os'

import { defineBuilderConfig } from '@afilmory/builder'

import { env } from './env.js'

// Example configuration for Tencent Cloud COS
export const cosBuilderConfig = defineBuilderConfig(() => ({
    repo: {
        enable: false,
        url: process.env.BUILDER_REPO_URL ?? '',
        token: env.GIT_TOKEN,
    },
    storage: {
        provider: 'cos',
        bucket: env.COS_BUCKET,
        region: env.COS_REGION,
        secretId: env.COS_SECRET_ID,
        secretKey: env.COS_SECRET_KEY,
        prefix: env.COS_PREFIX,
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

// Default S3 configuration (unchanged)
export default defineBuilderConfig(() => ({
    repo: {
        enable: false,
        url: process.env.BUILDER_REPO_URL ?? '',
        token: env.GIT_TOKEN,
    },
    storage: {
        provider: 's3',
        bucket: env.S3_BUCKET_NAME,
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT,
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        prefix: env.S3_PREFIX,
        customDomain: env.S3_CUSTOM_DOMAIN,
        excludeRegex: env.S3_EXCLUDE_REGEX,
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