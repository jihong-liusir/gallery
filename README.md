<p align="center">
  <img src="https://github.com/Afilmory/assets/blob/main/afilmory-readme.webp?raw=true" alt="Afilmory" width="100%" />
</p>

# <p align="center">Afilmory</p>

Afilmory (/əˈfɪlməri/, "uh-FIL-muh-ree") is a term created for personal photography websites, blending Auto Focus (AF), aperture (light control), film (vintage medium), and memory (captured moments).

A modern photo gallery website built with React + TypeScript, supporting automatic photo synchronization from multiple storage sources (S3, GitHub), featuring high-performance WebGL rendering, masonry layout, EXIF information display, thumbnail generation, and more.

Live Photo Galleries:

- https://afilmory.innei.in
- https://gallery.mxte.cc
- https://photography.pseudoyu.com
- https://afilmory.magren.cc

## 🌟 Features

### Core Functionality

- 🖼️ **High-Performance WebGL Image Renderer** - Custom WebGL component with smooth zoom and pan operations
- 📱 **Responsive Masonry Layout** - Powered by Masonic, adapts to different screen sizes
- 🎨 **Modern UI Design** - Built with Tailwind CSS and Radix UI component library
- ⚡ **Incremental Sync** - Smart change detection, processes only new or modified photos
- 🌐 **i18n** - Multi-language support
- 🔗 **OpenGraph** - OpenGraph metadata for social media sharing

### Image Processing

- 🔄 **HEIC/HEIF Format Support** - Automatic conversion of Apple device HEIC format
- 📷 **TIFF Format Support** - Automatic conversion of TIFF format
- 🖼️ **Smart Thumbnail Generation** - Multi-size thumbnails for optimized loading performance
- 📊 **EXIF Information Display** - Complete shooting parameters including camera model, focal length, aperture, etc.
- 🌈 **Blurhash Placeholders** - Elegant image loading experience
- 📱 **Live Photo Support** - Detection and display of iPhone Live Photos
- ☀️ **HDR Image Support** - Display HDR images

### Advanced Features

- 🎛️ **Fujifilm Recipe** - Read and display Fujifilm camera film simulation settings
- 🔍 **Fullscreen Viewer** - Image viewer with gesture support
- 🏷️ **File System Tags** - Auto-generated tags based on file system
- ⚡ **Concurrent Processing** - Multi-process/multi-thread concurrent processing support
- 🗂️ **Multi-Storage Support** - S3, GitHub, and other storage backends
- 📷 **Share Image** - Share image to social media or embed iframe to your website
- 🗺️ **Interactive Map Explorer** - Geographic visualization of photos with GPS coordinates from EXIF data using MapLibre

## 🏗️ Technical Architecture

### Frontend Tech Stack

- **React 19** - Latest React version with Compiler
- **TypeScript** - Complete type safety
- **Vite** - Modern build tool
- **Tailwind CSS** - Atomic CSS framework
- **Radix UI** - Accessible component library
- **Jotai** - State management
- **TanStack Query** - Data fetching and caching
- **React Router 7** - Routing management
- **i18next** - Internationalization

### Build System

- **Node.js** - Server-side runtime
- **Sharp** - High-performance image processing
- **AWS SDK** - S3 storage operations
- **Worker Threads/Cluster** - Concurrent processing
- **EXIF-Reader** - EXIF data extraction

### Storage Architecture

Designed with adapter pattern, supporting multiple storage backends:

- **S3-Compatible Storage** - AWS S3, MinIO, Alibaba Cloud OSS, etc.
- **GitHub Storage** - Using GitHub repository as image storage

## 🚀 Quick Start

### Docker Deployment

[Docker Deployment](https://github.com/Afilmory/docker)

## ⚙️ Configuration Options

#### Remote Repository Configuration (`repo`)

To achieve incremental builds in CI, it is necessary to configure a cache repository, which will pull the cache before each build and upload the build results after the build.

```json
{
  "repo": {
    "enable": true,
    "url": "https://github.com/username/gallery-assets"
  }
}
```

This will automatically pull resources from the remote repository, avoiding rebuilds each time.

**In order to achieve uploading to the git repository, you need to provide a `GIT_TOKEN` and write it in the `.env` file.**

#### Storage Configuration (`storage`)

- `provider`: Storage provider (`s3` | `github`)
- `bucket`: S3 bucket name
- `region`: S3 region
- `endpoint`: S3 endpoint (optional)
- `prefix`: File prefix
- `customDomain`: Custom domain
- `excludeRegex`: Regular expression to exclude files (optional)

#### Build Options (`options`)

- `defaultConcurrency`: Default concurrency
- `digestSuffixLength`: The length of the SHA-256 digest appended to the photo ID.
- `enableLivePhotoDetection`: Enable Live Photo detection
- `showProgress`: Show build progress
- `showDetailedStats`: Show detailed statistics

#### Performance Configuration (`performance`)

- `worker.workerCount`: Number of worker processes
- `worker.timeout`: Worker timeout (milliseconds)
- `worker.useClusterMode`: Enable cluster mode

#### Logging Configuration (`logging`)

- `verbose`: Verbose logging
- `level`: Log level (`info` | `warn` | `error` | `debug`)
- `outputToFile`: Output to file

## 📋 CLI Commands

### Build Commands

```bash
# View help
pnpm run build:manifest -- --help

# Incremental update (default)
pnpm run build:manifest

# Force full update
pnpm run build:manifest -- --force

# Only regenerate thumbnails
pnpm run build:manifest -- --force-thumbnails

# Only regenerate manifest
pnpm run build:manifest -- --force-manifest
```

### Development Commands

```bash
# Start development server
pnpm dev

# Build production version
pnpm build
```

### Notes

- Ensure your S3 bucket already contains photo files
- If using remote repository, configure `builder.config.ts` first

## 🔧 Advanced Usage

### Custom Storage Provider

Implement the `StorageProvider` interface to support new storage backends:

```typescript
import { StorageProvider } from './src/core/storage/interfaces'

class MyStorageProvider implements StorageProvider {
  async getFile(key: string): Promise<Buffer | null> {
    // Implement file retrieval logic
  }

  async listImages(): Promise<StorageObject[]> {
    // Implement image list retrieval logic
  }

  // ... other methods
}
```

### Custom Image Processing

Add custom processors in the `src/core/image/` directory:

```typescript
export async function customImageProcessor(buffer: Buffer) {
  // Custom image processing logic
  return processedBuffer
}
```

## 📄 License

Attribution Network License (ANL) v1.0 © 2025 Afilmory Team. See [LICENSE](LICENSE) for more details.

## 🔗 Related Links

- [Live Demo](https://gallery.innei.in)
- [Personal Website](https://innei.in)
- [GitHub](https://github.com/innei)

---

If this project helps you, please give it a ⭐️ Star for support!

## Jihong chats with Claude Sonnet
Yes, you need to rebuild the manifest when new photos are added to remote storage. Let me explain the workflow and whether you need to redeploy:

Workflow for New Photos
1. Rebuild Manifest (Required)
When new photos are added to your remote storage (S3/GitHub/COS):

This command will:

Download new photos from remote storage
Process EXIF metadata, GPS data, camera info
Generate thumbnails and blurhash placeholders
Update photos-manifest.json with new photo data
2. Deployment (Depends on Your Setup)
You have two deployment scenarios:

Scenario A: Manifest Stored in Git Repository
If your builder.config.ts is configured to push manifest updates to a git repository:

You DON'T need to redeploy the app because:

The SPA fetches the manifest from the remote repository at runtime
Users will see new photos automatically after manifest is pushed to git
The app dynamically loads photos-manifest.json from the configured source
Scenario B: Manifest Bundled with App
If the manifest is bundled directly into your build:

You MUST redeploy the app because:

The manifest is embedded in window.__MANIFEST__ during build
New photos won't appear until you rebuild and redeploy
Check Your Configuration
Let me check your builder config to see which scenario applies to you:

Read builder.config.ts

Based on your configuration:

Your Setup: Manifest Bundled with App ⚠️
Your builder.config.ts shows:

This means you MUST redeploy the app after adding new photos.

Complete Workflow for New Photos
Optional: Enable Dynamic Manifest Loading
If you want to avoid redeployment for new photos, you can:

Enable Git Repository Sync
Update your builder.config.ts:

With this enabled:

Run pnpm run build:manifest - it will push manifest to git
No app redeployment needed - users see new photos automatically
The SPA fetches the manifest from the git repository at runtime
Trade-offs
Approach	Pros	Cons
Current (Bundled)	Faster load time, no external dependency	Must redeploy for new photos
Git Sync (Dynamic)	No redeployment needed, update photos anytime	Extra HTTP request, slight delay
For most use cases, enabling git sync is more convenient if you frequently add new photos. Would you like help setting up the git repository sync?