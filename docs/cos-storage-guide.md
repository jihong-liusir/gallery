# Tencent Cloud COS Storage Provider

This guide shows how to configure and use the Tencent Cloud COS (Cloud Object Storage) provider for your photo gallery.

## Prerequisites

1. A Tencent Cloud account
2. COS service enabled
3. A COS bucket created
4. API credentials (SecretId and SecretKey)

## Setup Steps

### 1. Configure Environment Variables

Copy the environment template:

```bash
cp .env.cos.example .env
```

Update the COS configuration in your `.env` file:

```env
# Tencent Cloud COS Configuration
COS_REGION=ap-beijing
COS_BUCKET=your-bucket-1234567890
COS_SECRET_ID=your-secret-id
COS_SECRET_KEY=your-secret-key
COS_PREFIX=photos/
COS_CUSTOM_DOMAIN=https://cdn.example.com
COS_EXCLUDE_REGEX=\.(tmp|cache)$
```

### 2. Update Builder Configuration

Modify your `builder.config.ts` to use COS:

```typescript
import { defineBuilderConfig } from '@afilmory/builder'
import { env } from './env.js'

export default defineBuilderConfig(() => ({
  storage: {
    provider: 'cos',
    bucket: env.COS_BUCKET,
    region: env.COS_REGION,
    secretId: env.COS_SECRET_ID,
    secretKey: env.COS_SECRET_KEY,
    prefix: env.COS_PREFIX,
    customDomain: env.COS_CUSTOM_DOMAIN,
    maxFileLimit: 1000,
    downloadConcurrency: 16,
  },
  // ... other configuration
}))
```

### 3. Register the COS Plugin (if using plugin system)

```typescript
import { cosStoragePlugin } from '@afilmory/builder'

export default defineBuilderConfig(() => ({
  plugins: [
    cosStoragePlugin(),
    // ... other plugins
  ],
  // ... other configuration
}))
```

## Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `provider` | `'cos'` | ✅ | Storage provider type |
| `bucket` | `string` | ✅ | COS bucket name (format: BucketName-APPID) |
| `region` | `string` | ✅ | COS region (e.g., 'ap-beijing') |
| `secretId` | `string` | ✅ | Tencent Cloud SecretId |
| `secretKey` | `string` | ✅ | Tencent Cloud SecretKey |
| `prefix` | `string` | ❌ | Object key prefix |
| `customDomain` | `string` | ❌ | Custom domain for CDN |
| `excludeRegex` | `string` | ❌ | Regex to exclude files |
| `maxFileLimit` | `number` | ❌ | Maximum number of files to process |
| `downloadConcurrency` | `number` | ❌ | Concurrent downloads (default: 16) |

## Common COS Regions

- `ap-beijing` - Beijing
- `ap-shanghai` - Shanghai  
- `ap-guangzhou` - Guangzhou
- `ap-chengdu` - Chengdu
- `ap-singapore` - Singapore
- `ap-tokyo` - Tokyo
- `na-ashburn` - Virginia
- `eu-frankfurt` - Frankfurt

## Usage Example

```typescript
import { COSStorageProvider } from '@afilmory/builder'

const provider = new COSStorageProvider({
  provider: 'cos',
  bucket: 'my-gallery-1234567890',
  region: 'ap-beijing',
  secretId: 'your-secret-id',
  secretKey: 'your-secret-key',
  prefix: 'photos/',
})

// List all images
const images = await provider.listImages()

// Get a file
const buffer = await provider.getFile('sunset.jpg')

// Generate public URL
const url = provider.generatePublicUrl('sunset.jpg')
// Returns: https://my-gallery-1234567890.cos.ap-beijing.myqcloud.com/photos/sunset.jpg
```

## CDN Configuration

To use CDN acceleration:

1. Set up CDN in Tencent Cloud console
2. Configure your CDN domain
3. Update the `customDomain` in your configuration:

```typescript
{
  provider: 'cos',
  customDomain: 'https://cdn.example.com',
  // ... other options
}
```

URLs will then use your CDN domain:
```
https://cdn.example.com/photos/sunset.jpg
```

## Troubleshooting

### Common Issues

1. **Invalid credentials**: Check SecretId and SecretKey
2. **Bucket not found**: Ensure bucket exists and name is correct
3. **Permission denied**: Verify bucket permissions and access policies
4. **Region mismatch**: Confirm the region code is correct

### Debug Mode

Enable verbose logging to debug issues:

```typescript
export default defineBuilderConfig(() => ({
  logging: {
    verbose: true,
    level: 'debug',
  },
  // ... other configuration
}))
```

## Security Best Practices

1. Use environment variables for sensitive data
2. Create dedicated CAM users with minimal permissions
3. Configure bucket access policies appropriately
4. Enable HTTPS for all requests
5. Regularly rotate access keys

## Migration from S3

To migrate from S3 to COS:

1. Update your `.env` file with COS credentials
2. Change `provider: 's3'` to `provider: 'cos'` in your config
3. Update the configuration keys (see mapping below)

### S3 to COS Configuration Mapping

| S3 | COS |
|----|-----|
| `accessKeyId` | `secretId` |
| `secretAccessKey` | `secretKey` |
| `bucket` | `bucket` (format may differ) |
| `region` | `region` |
| `endpoint` | Not needed |

## Performance Tuning

For better performance with large galleries:

```typescript
{
  provider: 'cos',
  downloadConcurrency: 32,        // Increase concurrent downloads
  maxAttempts: 5,                 // More retry attempts
  requestTimeoutMs: 30_000,       // Longer timeout
  // ... other options
}
```

## Support

For issues specific to the COS provider, please:

1. Check the Tencent Cloud COS documentation
2. Verify your configuration against this guide
3. Enable debug logging to identify the issue
4. Open an issue in the project repository