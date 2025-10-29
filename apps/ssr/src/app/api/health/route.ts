import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        // Azure-optimized health check
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: Math.round(process.uptime()),
            environment: process.env.NODE_ENV || 'unknown',
            version: process.env.npm_package_version || 'unknown',
            platform: {
                node: process.version,
                platform: process.platform,
                arch: process.arch,
                hostname: process.env.HOSTNAME || 'unknown',
                port: process.env.PORT || process.env.WEBSITES_PORT || '8080'
            },
            azure: {
                websiteName: process.env.WEBSITE_SITE_NAME,
                resourceGroup: process.env.WEBSITE_RESOURCE_GROUP,
                subscriptionId: process.env.WEBSITE_OWNER_NAME,
                instanceId: process.env.WEBSITE_INSTANCE_ID,
                region: process.env.REGION_NAME || process.env.WEBSITE_SITE_REGION
            },
            storage: {
                provider: process.env.STORAGE_PROVIDER || 'not configured',
                bucket: process.env.STORAGE_BUCKET_NAME || process.env.COS_BUCKET || 'not configured',
                hasCredentials: !!(
                    process.env.STORAGE_ACCESS_KEY_ID ||
                    process.env.COS_SECRET_ID ||
                    process.env.GITHUB_TOKEN
                )
            },
            database: {
                configured: !!process.env.DATABASE_URL,
                provider: process.env.DATABASE_URL ? 'postgresql' : 'none'
            }
        }

        return NextResponse.json(health, {
            status: 200,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        })
    } catch (error) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                uptime: Math.round(process.uptime())
            },
            { status: 500 }
        )
    }
}