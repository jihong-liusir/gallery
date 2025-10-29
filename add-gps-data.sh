#!/bin/bash

# Add GPS coordinates to test photos for development
# This script adds GPS data to photos in the photos/ directory

echo "🔧 Adding GPS coordinates to test photos..."

# Check if exiftool is available
if ! command -v exiftool &> /dev/null; then
    echo "❌ exiftool is not installed. Please install it first:"
    echo "   Windows: Download from https://exiftool.org/"
    echo "   macOS: brew install exiftool"
    echo "   Linux: apt-get install exiftool"
    exit 1
fi

# Sample GPS coordinates for different cities
declare -A locations=(
    ["newyork"]="40.7128,-74.0060,N,W"      # New York City
    ["london"]="51.5074,-0.1278,N,W"         # London
    ["tokyo"]="35.6762,139.6503,N,E"        # Tokyo
    ["paris"]="48.8566,2.3522,N,E"          # Paris
    ["beijing"]="39.9042,116.4074,N,E"      # Beijing
    ["sydney"]="33.8688,151.2093,S,E"       # Sydney
)

# Find photo files
photo_dir="photos"
if [ ! -d "$photo_dir" ]; then
    echo "❌ Photos directory not found. Please create '$photo_dir' directory with some test photos."
    exit 1
fi

# Find image files
photos=($(find "$photo_dir" -type f -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.avif"))

if [ ${#photos[@]} -eq 0 ]; then
    echo "❌ No photos found in '$photo_dir' directory."
    exit 1
fi

echo "📍 Found ${#photos[@]} photos to process..."

# Add GPS data to photos
count=0
for photo in "${photos[@]}"; do
    # Select a random location
    location_keys=(${!locations[@]})
    random_key=${location_keys[$RANDOM % ${#location_keys[@]}]}
    coords=${locations[$random_key]}
    
    IFS=',' read -r lat lon latref lonref <<< "$coords"
    
    echo "   Adding GPS data to: $(basename "$photo")"
    echo "   Location: $random_key ($lat, $lon)"
    
    # Add GPS data
    exiftool -overwrite_original \
        -GPSLatitude="$lat" \
        -GPSLongitude="$lon" \
        -GPSLatitudeRef="$latref" \
        -GPSLongitudeRef="$lonref" \
        -GPSAltitude=100 \
        -GPSAltitudeRef="Above Sea Level" \
        "$photo"
    
    ((count++))
    if [ $count -ge 10 ]; then
        break  # Limit to 10 photos for testing
    fi
done

echo "✅ GPS data added to $count photos!"
echo ""
echo "🔄 Next steps:"
echo "   1. Run: pnpm run build:manifest"
echo "   2. Start the dev server: pnpm dev"
echo "   3. Check the map at: http://localhost:5173/explory"
echo "   4. Run debug script: node debug-gps.js"