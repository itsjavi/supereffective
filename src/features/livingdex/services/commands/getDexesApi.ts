import { ApiResponse, apiErrors } from '@/lib/utils/types'
import { isValidIdSchema } from '@/lib/validation/schemas'

import { getLegacyLivingDexRepository } from '../repository'

export const getDexesApi = async (userId: string): Promise<ApiResponse> => {
  if (!isValidIdSchema(userId)) {
    return apiErrors.invalidRequest
  }

  const dexes = await getLegacyLivingDexRepository().getManyByUser(userId)

  return {
    statusCode: 200,
    data: dexes,
  }
}
