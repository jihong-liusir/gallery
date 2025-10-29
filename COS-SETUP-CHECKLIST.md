# COS Setup Checklist

## Steps to Complete COS Configuration:

### 1. ✅ Install COS SDK (You're doing this now)
```bash
sudo pnpm install cos-nodejs-sdk-v5
```

### 2. 📝 Update Bucket Name
In `.env` file, replace `your-bucket-name` with your actual COS bucket name:
```env
COS_BUCKET=your-actual-bucket-name-1234567890
```

### 3. 🌍 Verify Region
Confirm your COS bucket region and update if needed:
```env
COS_REGION=ap-beijing  # Change to your bucket's region
```

### 4. 📁 Upload Test Photos
Upload some photos directly to your COS bucket root (no subfolder needed).

### 5. 🚀 Build and Test
After installation completes, run:
```bash
# Build the manifest from COS
pnpm run build:manifest

# Start the development server
pnpm dev
```

## Common COS Regions:
- `ap-beijing` - Beijing (North China)
- `ap-shanghai` - Shanghai (East China)
- `ap-guangzhou` - Guangzhou (South China)
- `ap-chengdu` - Chengdu (Southwest China)
- `ap-singapore` - Singapore
- `ap-tokyo` - Tokyo

## Bucket Name Format:
Your bucket name should be in the format: `BucketName-APPID`
Example: `my-gallery-1234567890`

## Next Steps After SDK Installation:
1. Update the bucket name in `.env`
2. Upload some test photos to your COS bucket
3. Run `pnpm run build:manifest` to generate the photo manifest
4. Start the dev server with `pnpm dev`

## Troubleshooting:
- Ensure your COS bucket allows read access
- Verify the SecretId and SecretKey have proper permissions
- Check that photos are uploaded to the correct prefix path