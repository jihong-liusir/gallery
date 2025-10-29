import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { PhotoManifest } from '~/types/photo'

interface DateRange {
  startDate: Date | null
  endDate: Date | null
  formattedRange: string
  location?: string
}

interface VisibleRange {
  start: number
  end: number
}

/**
 * Hook to calculate the date range of currently visible photos in the viewport
 * Works with masonry onRender callback
 */
export const useVisiblePhotosDateRange = (_photos: PhotoManifest[]) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
    formattedRange: '',
    location: undefined,
  })

  const currentRange = useRef<VisibleRange>({ start: 0, end: 0 })

  const getPhotoDate = useCallback((photo: PhotoManifest): Date => {
    // 优先使用 EXIF 中的拍摄时间
    if (photo.exif?.DateTimeOriginal) {
      const dateStr = photo.exif.DateTimeOriginal as unknown as string
      // EXIF 日期格式通常是 "YYYY:MM:DD HH:mm:ss"
      const formattedDateStr = dateStr.replace(
        /^(\d{4}):(\d{2}):(\d{2})/,
        '$1-$2-$3',
      )
      const date = new Date(formattedDateStr)
      if (!Number.isNaN(date.getTime())) {
        return date
      }
    }

    // 回退到 lastModified
    return new Date(photo.lastModified)
  }, [])
  const { i18n } = useTranslation()

  const formatDateRange = useCallback(
    (startDate: Date, endDate: Date): string => {
      const startYear = startDate.getFullYear()
      const endYear = endDate.getFullYear()
      const startMonth = startDate.getMonth()
      const endMonth = endDate.getMonth()

      // 如果是同一天
      if (startDate.toDateString() === endDate.toDateString()) {
        return startDate.toLocaleDateString(i18n.language, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      }

      // 如果是同一年
      if (startYear === endYear) {
        // 如果是同一个月
        if (startMonth === endMonth) {
          return `${startYear}年${startDate.getMonth() + 1}月${startDate.getDate()}日 - ${endDate.getDate()}日`
        } else {
          return `${startYear}年${startDate.getMonth() + 1}月 - ${endDate.getMonth() + 1}月`
        }
      }

      // 不同年份
      return `${startYear}年${startDate.getMonth() + 1}月 - ${endYear}年${endDate.getMonth() + 1}月`
    },
    [i18n.language],
  )

  const extractLocation = useCallback(
    (photos: PhotoManifest[]): string | undefined => {
      // 尝试从照片标签中提取位置信息
      for (const photo of photos) {
        // 如果照片有位置标签，优先使用
        if (photo.tags) {
          const locationTag = photo.tags.find(
            (tag) => {
              // Chinese location keywords
              const chineseLocations = [
                '省', '市', '区', '县', '镇', '村', '街道', '路',
                '北京', '上海', '广州', '深圳', '杭州', '南京', '成都'
              ]

              // International location keywords (case-insensitive)
              const internationalLocations = [
                'city', 'town', 'village', 'street', 'avenue', 'road', 'park',
                'new york', 'london', 'paris', 'tokyo', 'berlin', 'sydney',
                'los angeles', 'chicago', 'boston', 'seattle', 'san francisco',
                'washington', 'miami', 'las vegas', 'toronto', 'vancouver'
              ]

              // Check Chinese locations
              if (chineseLocations.some(loc => tag.includes(loc))) {
                return true
              }

              // Check international locations (case-insensitive)
              const tagLower = tag.toLowerCase()
              if (internationalLocations.some(loc => tagLower.includes(loc.toLowerCase()))) {
                return true
              }

              // Check for common location patterns
              const locationPatterns = [
                /\b\w+\s+(city|town|village|park|center|square|station)\b/i,
                /\b(mount|mt|lake|river|beach|island)\s+\w+/i,
                /\b\w+\s+(county|state|province|district)\b/i
              ]

              return locationPatterns.some(pattern => pattern.test(tag))
            }
          )
          if (locationTag) {
            return locationTag
          }
        }
      }

      return undefined
    },
    [],
  )

  // 计算当前可视范围内照片的日期范围
  const calculateDateRange = useCallback(
    (startIndex: number, endIndex: number, items: any[]) => {
      if (!items || items.length === 0) {
        setDateRange({
          startDate: null,
          endDate: null,
          formattedRange: '',
          location: undefined,
        })
        return
      }

      // 过滤出照片类型的items (排除header等)
      const visiblePhotos = items
        .slice(startIndex, endIndex + 1)
        .filter(
          (item): item is PhotoManifest =>
            item && typeof item === 'object' && 'id' in item,
        )

      if (visiblePhotos.length === 0) {
        setDateRange({
          startDate: null,
          endDate: null,
          formattedRange: '',
          location: undefined,
        })
        return
      }

      // 计算日期范围
      const dates = visiblePhotos
        .map((photo) => getPhotoDate(photo))
        .sort((a, b) => a.getTime() - b.getTime())

      const startDate = dates[0]
      const endDate = dates.at(-1)

      if (!startDate || !endDate) {
        setDateRange({
          startDate: null,
          endDate: null,
          formattedRange: '',
          location: undefined,
        })
        return
      }

      const formattedRange = formatDateRange(startDate, endDate)
      const location = extractLocation(visiblePhotos)

      setDateRange({
        startDate,
        endDate,
        formattedRange,
        location,
      })

      // 更新当前范围
      currentRange.current = { start: startIndex, end: endIndex }
    },
    [getPhotoDate, formatDateRange],
  )

  // 用于传递给 masonry 的 onRender 回调
  const handleRender = useCallback(
    (startIndex: number, stopIndex: number, items: any[]) => {
      calculateDateRange(startIndex, stopIndex, items)
    },
    [calculateDateRange],
  )

  return {
    dateRange,
    handleRender,
    currentRange: currentRange.current,
  }
}
