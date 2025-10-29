# Timeout Optimization Guide

## Summary of Changes

To fix the persistent timeout issues when downloading large photos from Tencent COS, I've made the following optimizations:

### 1. **Reduced Download Concurrency** (CRITICAL)
- **Before**: `downloadConcurrency: 16` - Too many simultaneous downloads
- **After**: `downloadConcurrency: 4` - Conservative limit for stability
- **Reason**: Lower concurrency prevents network congestion and gives each download more bandwidth

### 2. **Reduced Worker Concurrency** (CRITICAL)
- **Before**: `workerConcurrency: 2` - Each worker processes 2 photos at once
- **After**: `workerConcurrency: 1` - Each worker processes 1 photo at a time
- **Reason**: Prevents workers from timing out while waiting for multiple large downloads

### 3. **Increased Timeout Values**
- `totalTimeoutMs: 300_000 → 600_000` (5 min → 10 min)
- `socketTimeoutMs: 120_000 → 180_000` (2 min → 3 min)
- `requestTimeoutMs: 120_000 → 180_000` (2 min → 3 min)
- `idleTimeoutMs: 60_000 → 90_000` (1 min → 1.5 min)
- `worker.timeout: 600_000 → 1_200_000` (10 min → 20 min)

### 4. **Better Error Handling**
- Added timeout detection in error messages
- Doubled backoff delay for timeout errors (more aggressive retry)
- Improved logging with download speed metrics (MB/s)

### 5. **Reduced Worker Count**
- **Before**: `os.cpus().length * 2` (e.g., 32 workers on 16-core CPU)
- **After**: `Math.min(os.cpus().length, 8)` (max 8 workers)
- **Reason**: Too many workers can overwhelm the network and COS API

## Current Configuration

```typescript
{
  storage: {
    downloadConcurrency: 4,        // Max 4 concurrent downloads per worker
    totalTimeoutMs: 600_000,       // 10 min total per download
    socketTimeoutMs: 180_000,      // 3 min socket timeout
    requestTimeoutMs: 180_000,     // 3 min request timeout
    maxAttempts: 5,                // Retry up to 5 times
  },
  performance: {
    worker: {
      workerCount: 8,              // Max 8 workers (not CPU count * 2)
      timeout: 1_200_000,          // 20 min per worker task
      workerConcurrency: 1,        // 1 photo at a time per worker
    }
  }
}
```

## Expected Behavior

### Download Throughput
- **Total concurrent downloads**: `workerCount × workerConcurrency × downloadConcurrency`
- **With current config**: `8 workers × 1 photo × 4 downloads = 32 max concurrent downloads`
- This is much more conservative than before (was potentially 16 workers × 2 photos × 16 downloads = 512!)

### Timeout Progression
1. **First attempt**: Downloads with 10-minute timeout
2. **Second attempt**: Waits 4 seconds, retries (8s backoff for timeout)
3. **Third attempt**: Waits 16 seconds, retries
4. **Fourth attempt**: Waits 32 seconds, retries
5. **Fifth attempt**: Waits 64 seconds, final retry

### Large File Handling
- **50MB photo**: ~30-60s download @ 1MB/s connection
- **100MB photo**: ~60-120s download @ 1MB/s connection
- **With retries**: Up to 5 attempts × 10min = 50 minutes total for extremely large files

## Troubleshooting

### If you still get timeouts:

1. **Check your network speed**:
   ```bash
   # Download a test file from COS
   curl -o test.jpg "https://media-1309653188.cos.ap-chengdu.myqcloud.com/[your-photo-key]"
   ```

2. **Reduce concurrency further**:
   ```typescript
   downloadConcurrency: 2,  // Even more conservative
   workerCount: 4,          // Fewer workers
   ```

3. **Check COS region**:
   - Make sure `region: 'ap-chengdu'` is geographically close to you
   - Consider using a CDN or custom domain

4. **Monitor download speeds in logs**:
   - Look for messages like: `下载完成：... (5.23MB in 8234ms = 0.65MB/s, attempt 1)`
   - If speed < 0.5MB/s consistently, you have a network issue

### If downloads are too slow:

1. **Increase concurrency** (only if your network is stable):
   ```typescript
   downloadConcurrency: 8,  // More aggressive
   workerConcurrency: 2,    // Process 2 photos per worker
   ```

2. **Check VPN/Proxy settings** - Corporate networks can throttle COS traffic

3. **Use CDN acceleration** - Enable Tencent COS CDN for faster downloads

## Best Practices

1. **Start conservative**: Use low concurrency values and increase gradually
2. **Monitor logs**: Watch for timeout patterns and adjust timeouts accordingly
3. **Test with large files first**: If 100MB photos work, smaller ones will too
4. **Consider file size distribution**: If most photos are < 10MB, you can use shorter timeouts
5. **Network quality matters**: Stable 10Mbps is better than unstable 100Mbps

## Performance Tuning

### For Fast Networks (> 50Mbps stable):
```typescript
downloadConcurrency: 8
workerConcurrency: 2
workerCount: 12
totalTimeoutMs: 300_000  // 5 min
```

### For Slow Networks (< 10Mbps or unstable):
```typescript
downloadConcurrency: 2
workerConcurrency: 1
workerCount: 4
totalTimeoutMs: 900_000  // 15 min
```

### For Corporate Networks (VPN/Firewall):
```typescript
downloadConcurrency: 4   // Current config
workerConcurrency: 1
workerCount: 6
totalTimeoutMs: 600_000  // 10 min
keepAlive: true          // Reuse connections
```

## Testing

Run the build and monitor the output:

```bash
pnpm run build:manifest
```

Look for:
- ✅ `下载完成` messages with reasonable speeds (> 0.5MB/s)
- ⚠️ `下载失败` with `TIMEOUT` - indicates network issues
- ❌ `下载最终失败` - indicates persistent problems

## Additional Notes

- The COS SDK timeout applies to the entire request, not individual socket operations
- Total timeout is a safety net and should be much larger than request timeout
- Worker timeout must be larger than the longest possible photo processing time
- Retries use exponential backoff: 2s, 4s, 8s, 16s, 32s (doubled for timeouts)
