import { coreApi } from '~/lib/api-client'

import type {
  SuperAdminSettingsResponse,
  UpdateSuperAdminSettingsPayload,
} from './types'

const SUPER_ADMIN_SETTINGS_ENDPOINT = '/super-admin/settings'

export const fetchSuperAdminSettings = async () =>
  await coreApi<SuperAdminSettingsResponse>(
    `${SUPER_ADMIN_SETTINGS_ENDPOINT}`,
    {
      method: 'GET',
    },
  )

export const updateSuperAdminSettings = async (
  payload: UpdateSuperAdminSettingsPayload,
) => {
  const sanitizedEntries = Object.entries(payload).filter(
    ([, value]) => value !== undefined,
  )
  const body = Object.fromEntries(sanitizedEntries)

  return await coreApi<SuperAdminSettingsResponse>(
    `${SUPER_ADMIN_SETTINGS_ENDPOINT}`,
    {
      method: 'PATCH',
      body,
    },
  )
}
