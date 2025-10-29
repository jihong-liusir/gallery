import type { COSConfig } from '../../storage/interfaces.js'
import { COSStorageProvider } from '../../storage/providers/cos-provider.js'
import type { BuilderPlugin } from '../types.js'

export interface COSStoragePluginOptions {
    provider?: string
}

export default function cosStoragePlugin(
    options: COSStoragePluginOptions = {},
): BuilderPlugin {
    const providerName = options.provider ?? 'cos'

    return {
        name: `afilmory:storage:${providerName}`,
        hooks: {
            onInit: ({ registerStorageProvider }) => {
                registerStorageProvider(providerName, (config) => {
                    return new COSStorageProvider(config as COSConfig)
                })
            },
        },
    }
}