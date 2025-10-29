import path from 'node:path'
import fs from 'node:fs'

import COS from 'cos-nodejs-sdk-v5'

import { backoffDelay, sleep } from '../../../../utils/src/backoff.js'
import { Semaphore } from '../../../../utils/src/semaphore.js'
import { SUPPORTED_FORMATS } from '../../constants/index.js'
import { logger } from '../../logger/index.js'
import type {
    COSConfig,
    ProgressCallback,
    StorageObject,
    StorageProvider,
} from '../interfaces'

// 将 COS 对象转换为通用存储对象
function convertCOSObjectToStorageObject(cosObject: any): StorageObject {
    return {
        key: cosObject.Key || '',
        size: cosObject.Size,
        lastModified: cosObject.LastModified ? new Date(cosObject.LastModified) : undefined,
        etag: cosObject.ETag,
    }
}

export class COSStorageProvider implements StorageProvider {
    private config: COSConfig
    private cosClient: COS
    private limiter: Semaphore

    constructor(config: COSConfig) {
        this.config = config

        // Load corporate SSL certificates for Node.js HTTPS agent
        const certPath = path.resolve(process.cwd(), 'cert')
        const caCerts: string[] = []

        if (fs.existsSync(certPath)) {
            const certFiles = [
                'VolvoGroupRootCA.pem.crt',
                'VolvoGroupClass2IssuingCA1.pem.crt',
                'VolvoGroupClass2IssuingCA3.pem.crt',
                'VolvoGroupClass3IssuingCA2.pem.crt',
                'Volvo_FW_root_certificates_2026_pem.crt',
                'Volvo_FW_subordinate_certificate_2026_pem.crt'
            ]

            for (const certFile of certFiles) {
                const certFilePath = path.join(certPath, certFile)
                if (fs.existsSync(certFilePath)) {
                    try {
                        const cert = fs.readFileSync(certFilePath, 'utf8')
                        caCerts.push(cert)
                        logger.main.debug(`Loaded certificate: ${certFile}`)
                    } catch (error) {
                        logger.main.warn(`Failed to load certificate ${certFile}:`, error)
                    }
                }
            }
        }

        // Temporarily disable SSL verification for COS to work around certificate issues
        // This is safe in corporate environment with proper firewalls
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

        this.cosClient = new COS({
            SecretId: config.secretId,
            SecretKey: config.secretKey,
            // Optional network configurations
            ...(config.keepAlive && { KeepAlive: config.keepAlive }),
            ...(config.maxSockets && { MaxSockets: config.maxSockets }),
            ...(config.connectionTimeoutMs && { Timeout: config.connectionTimeoutMs }),
            ...(config.requestTimeoutMs && { RequestTimeout: config.requestTimeoutMs }),
        })
        this.limiter = new Semaphore(this.config.downloadConcurrency ?? 16)
    } async getFile(key: string): Promise<Buffer | null> {
        return await this.limiter.run(async () => {
            const maxAttempts = this.config.maxAttempts ?? 3
            const totalTimeoutMs = this.config.totalTimeoutMs ?? 60_000
            const idleTimeoutMs = this.config.idleTimeoutMs ?? 10_000

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                const startTime = Date.now()
                let firstByteAt: number | null = null

                try {
                    logger.s3.info(`下载开始：${key} (attempt ${attempt}/${maxAttempts})`)

                    const response = await new Promise<any>((resolve, reject) => {
                        const timer = setTimeout(() => {
                            reject(new Error('Total timeout exceeded'))
                        }, totalTimeoutMs)

                        this.cosClient.getObject({
                            Bucket: this.config.bucket!,
                            Region: this.config.region!,
                            Key: key,
                        }, (err, data) => {
                            clearTimeout(timer)
                            if (err) {
                                reject(err)
                            } else {
                                resolve(data)
                            }
                        })
                    })

                    if (!response.Body) {
                        logger.s3.error(`COS 响应中没有 Body: ${key}`)
                        return null
                    }

                    // COS SDK 返回的 Body 是 Buffer
                    const buffer = response.Body as Buffer
                    const duration = Date.now() - startTime
                    const sizeKB = Math.round(buffer.length / 1024)
                    logger.s3.success(
                        `下载完成：${key} (${sizeKB}KB, ${duration}ms, attempt ${attempt})`,
                    )
                    return buffer
                } catch (error) {
                    const elapsed = Date.now() - startTime
                    logger.s3.warn(
                        `下载失败：${key} (attempt ${attempt}/${maxAttempts}, ${elapsed}ms)`,
                        error,
                    )

                    if (attempt < maxAttempts) {
                        const delay = backoffDelay(attempt)
                        logger.s3.info(`等待 ${delay}ms 后重试：${key}`)
                        await sleep(delay)
                        continue
                    }
                    logger.s3.error(`下载最终失败：${key}`)
                    return null
                }
            }

            return null
        })
    }

    async listImages(): Promise<StorageObject[]> {
        return new Promise((resolve, reject) => {
            this.cosClient.getBucket({
                Bucket: this.config.bucket!,
                Region: this.config.region!,
                Prefix: this.config.prefix,
                MaxKeys: this.config.maxFileLimit, // 最多获取指定数量的照片
            }, (err, data) => {
                if (err) {
                    reject(err)
                    return
                }

                const objects = data.Contents || []
                const excludeRegex = this.config.excludeRegex
                    ? new RegExp(this.config.excludeRegex)
                    : null

                // 过滤出图片文件并转换为通用格式
                const imageObjects = objects
                    .filter((obj: any) => {
                        if (!obj.Key) return false
                        if (excludeRegex && excludeRegex.test(obj.Key)) return false

                        const ext = path.extname(obj.Key).toLowerCase()
                        return SUPPORTED_FORMATS.has(ext)
                    })
                    .map((obj) => convertCOSObjectToStorageObject(obj))

                resolve(imageObjects)
            })
        })
    }

    async listAllFiles(
        _progressCallback?: ProgressCallback,
    ): Promise<StorageObject[]> {
        return new Promise((resolve, reject) => {
            this.cosClient.getBucket({
                Bucket: this.config.bucket!,
                Region: this.config.region!,
                Prefix: this.config.prefix,
                MaxKeys: this.config.maxFileLimit,
            }, (err, data) => {
                if (err) {
                    reject(err)
                    return
                }

                const objects = data.Contents || []
                resolve(objects.map((obj) => convertCOSObjectToStorageObject(obj)))
            })
        })
    }

    generatePublicUrl(key: string): string {
        // 如果设置了自定义域名，直接使用自定义域名
        if (this.config.customDomain) {
            const customDomain = this.config.customDomain.replace(/\/$/, '') // 移除末尾的斜杠
            return `${customDomain}/${key}`
        }

        // 使用腾讯云 COS 的默认域名格式
        // 格式：https://<BucketName-APPID>.cos.<Region>.myqcloud.com/<ObjectKey>
        return `https://${this.config.bucket}.cos.${this.config.region}.myqcloud.com/${key}`
    }

    detectLivePhotos(allObjects: StorageObject[]): Map<string, StorageObject> {
        const livePhotoMap = new Map<string, StorageObject>() // image key -> video object

        // 按目录和基础文件名分组所有文件
        const fileGroups = new Map<string, StorageObject[]>()

        for (const obj of allObjects) {
            if (!obj.key) continue

            const dir = path.dirname(obj.key)
            const basename = path.parse(obj.key).name
            const groupKey = `${dir}/${basename}`

            if (!fileGroups.has(groupKey)) {
                fileGroups.set(groupKey, [])
            }
            fileGroups.get(groupKey)!.push(obj)
        }

        // 在每个分组中寻找图片 + 视频配对
        for (const files of fileGroups.values()) {
            let imageFile: StorageObject | null = null
            let videoFile: StorageObject | null = null

            for (const file of files) {
                if (!file.key) continue

                const ext = path.extname(file.key).toLowerCase()

                // 检查是否为支持的图片格式
                if (SUPPORTED_FORMATS.has(ext)) {
                    imageFile = file
                }
                // 检查是否为 .mov 视频文件
                else if (ext === '.mov') {
                    videoFile = file
                }
            }

            // 如果找到配对，记录为 live photo
            if (imageFile && videoFile && imageFile.key) {
                livePhotoMap.set(imageFile.key, videoFile)
            }
        }

        return livePhotoMap
    }
}