import { NextApiRequest, NextApiResponse } from 'next'

import { getLegacyLivingDexRepository } from '@/features/livingdex/services/repository'
import { apiBearerTokenGuard } from '@/features/users/auth/serverside/apiBearerTokenGuard'
import { apiErrors } from '@/lib/utils/types'
import { isValidIdSchema } from '@/lib/validation/schemas'

const getLivingDexHandler = async (req: NextApiRequest) => {
  const { dexId } = req.query

  // Validate dexId parameter
  if (!isValidIdSchema(dexId)) {
    return apiErrors.invalidRequest
  }

  // Use existing repository method to fetch the complete LoadedDex
  const dex = await getLegacyLivingDexRepository().getById(String(dexId))

  if (!dex) {
    return apiErrors.notFound
  }

  return {
    statusCode: 200,
    data: dex,
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const httpMethod = req.method || 'GET'

  // Only allow GET requests
  if (httpMethod !== 'GET') {
    res.status(apiErrors.notAllowed.statusCode).json(apiErrors.notAllowed.data)
    return
  }

  // Validate bearer token
  const authGuard = apiBearerTokenGuard(req)
  if (!authGuard.allowed) {
    res.status(authGuard.statusCode).json(authGuard.data)
    return
  }

  // Handle GET request
  const result = await getLivingDexHandler(req)
  res.status(result.statusCode).json(result.data)
}

export default handler
