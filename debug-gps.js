#!/usr/bin/env node

// Debug script to check GPS data in photos
import { photoLoader } from './packages/data/src/index.js'

console.log('🔍 Debugging GPS Data in Photos...\n')

try {
    const photos = photoLoader.getPhotos()

    console.log(`📊 Total photos loaded: ${photos.length}\n`)

    let photosWithGPS = 0
    let photosWithLocationTags = 0

    photos.forEach((photo, index) => {
        const hasGPS = photo.exif?.GPSLatitude && photo.exif?.GPSLongitude
        const hasLocationTags = photo.tags?.some(tag =>
            // Check for various location indicators
            tag.toLowerCase().includes('city') ||
            tag.toLowerCase().includes('park') ||
            tag.toLowerCase().includes('street') ||
            tag.includes('市') ||
            tag.includes('省') ||
            tag.includes('区')
        )

        if (hasGPS) {
            photosWithGPS++
            console.log(`📍 Photo ${index + 1}: ${photo.id}`)
            console.log(`   GPS: ${photo.exif.GPSLatitude}, ${photo.exif.GPSLongitude}`)
            console.log(`   Refs: ${photo.exif.GPSLatitudeRef}, ${photo.exif.GPSLongitudeRef}`)
            if (photo.exif.GPSAltitude) {
                console.log(`   Altitude: ${photo.exif.GPSAltitude}m (${photo.exif.GPSAltitudeRef})`)
            }
            console.log(`   Tags: [${photo.tags?.join(', ') || 'none'}]\n`)
        }

        if (hasLocationTags) {
            photosWithLocationTags++
            if (!hasGPS) {
                console.log(`🏷️  Photo ${index + 1}: ${photo.id} (tags only)`)
                console.log(`   Location tags: [${photo.tags?.filter(tag =>
                    tag.toLowerCase().includes('city') ||
                    tag.toLowerCase().includes('park') ||
                    tag.toLowerCase().includes('street') ||
                    tag.includes('市') ||
                    tag.includes('省') ||
                    tag.includes('区')
                ).join(', ')}]\n`)
            }
        }
    })

    console.log('📈 Summary:')
    console.log(`   Photos with GPS data: ${photosWithGPS}`)
    console.log(`   Photos with location tags: ${photosWithLocationTags}`)
    console.log(`   Photos without location data: ${photos.length - Math.max(photosWithGPS, photosWithLocationTags)}`)

    if (photosWithGPS === 0 && photosWithLocationTags === 0) {
        console.log('\n❌ No location data found!')
        console.log('\n💡 To fix this:')
        console.log('   1. Use photos taken with GPS enabled on your phone/camera')
        console.log('   2. Organize photos in folders with location names')
        console.log('   3. Add GPS data manually using exiftool:')
        console.log('      exiftool -GPSLatitude=40.7128 -GPSLongitude=-74.0060 -GPSLatitudeRef=N -GPSLongitudeRef=W photo.jpg')
    }

} catch (error) {
    console.error('❌ Error loading photos:', error.message)
    console.log('\n💡 Make sure to run "pnpm run build:manifest" first')
}