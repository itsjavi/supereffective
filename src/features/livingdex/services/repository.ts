import { PATREON_NO_TIER } from '@/config/patreon'
import { SessionMembership } from '@/features/users/auth/types'
import createMemoizedCallback from '@/lib/utils/caching/createMemoizedCallback'
import { PrismaTypes, getPrismaClient } from '@/prisma/getPrismaClient'

import { dexToLoadedDex, loadedDexToDex, sanitizeDate } from './parser/support'
import {
  LivingDexRepository,
  LivingDexResolvedUserLimits,
  LivingDexUserLimits,
  LoadedDex,
  LoadedDexList,
} from './types'

const DEFAULT_DEX_LIST_LIMIT = 50

export const getLegacyLivingDexRepository = createMemoizedCallback((): LivingDexRepository => {
  const prismaDb = getPrismaClient().livingDex

  const getById = async (id: string) => {
    return prismaDb
      .findFirst({ where: { id } })
      .catch((error) => {
        console.error('Error getting dex', error)
        throw error
      })
      .then((dex) => {
        if (!dex) {
          return null
        }
        if (typeof dex.data !== 'string') {
          throw new Error(`Invalid dex data for dex ${id}`)
        }

        return dexToLoadedDex(dex)
      })
  }

  const repoApi: LivingDexRepository = {
    getById,
    getLimitsForUser: async (membership: SessionMembership | null): Promise<LivingDexUserLimits> => {
      if (membership) {
        return {
          maxDexes: membership.rewardMaxDexes,
        }
      }

      return {
        maxDexes: PATREON_NO_TIER.perks.dexLimit,
      }
    },
    getResolvedLimitsForUser: async (
      userId: string,
      membership: SessionMembership | null,
    ): Promise<LivingDexResolvedUserLimits> => {
      const dexes = await repoApi.getManyByUser(userId)
      const limits = await repoApi.getLimitsForUser(membership)
      return repoApi.calculateResolvedLimits(dexes, limits)
    },
    calculateResolvedLimits: (dexes: LoadedDexList, limits: LivingDexUserLimits) => {
      return {
        ...limits,
        remainingDexes: limits.maxDexes - dexes.length,
      }
    },
    getManyByUser: async (userUid: string) => {
      return prismaDb
        .findMany({
          where: { userId: userUid },
          orderBy: {
            lastUpdateTime: 'desc',
          },
          take: DEFAULT_DEX_LIST_LIMIT,
        })
        .catch((error) => {
          console.error('Error getting many dexes', error)
          throw error
        })
        .then((dexes) => dexes.map((dex) => dexToLoadedDex(dex)))
    },
    import: async (dexes: LoadedDex[], userId: string) => {
      const createManyArgs: {
        data: Array<PrismaTypes.LivingDexCreateManyInput>
      } = {
        data: [],
      }
      for (const dex of dexes) {
        dex.userId = userId

        if (!dex.id) {
          throw new Error('Cannot import a dex that has no ID')
        }

        const existingDex = await getById(dex.id)

        if (existingDex) {
          throw new Error(`Dex ${dex.id} already exists`)
        }

        const dexToSave = loadedDexToDex(userId, dex)

        createManyArgs.data.push({
          id: dex.id,
          specVer: dexToSave.specVer,
          userId,
          data: dexToSave.data,
          gameId: dexToSave.gameId,
          title: dexToSave.title,
          creationTime: sanitizeDate(dexToSave.creationTime),
          lastUpdateTime: sanitizeDate(dexToSave.lastUpdateTime),
        })
      }

      return prismaDb.createMany(createManyArgs).then((result) => result.count)
    },
    save: async (dex: LoadedDex, userId: string) => {
      dex.updatedAt = new Date()
      dex.userId = userId

      const dexToSave = loadedDexToDex(userId, dex)

      if (!dex.id) {
        return prismaDb
          .create({
            data: {
              specVer: dexToSave.specVer,
              userId,
              data: dexToSave.data,
              gameId: dexToSave.gameId,
              title: dexToSave.title,
              creationTime: new Date(),
              lastUpdateTime: sanitizeDate(dexToSave.lastUpdateTime),
            },
          })
          .then((result) => ({ ...dex, id: result.id }))
      }

      return prismaDb
        .update({
          where: { id: dex.id as string },
          data: {
            title: dexToSave.title,
            specVer: dexToSave.specVer,
            data: dexToSave.data,
            lastUpdateTime: sanitizeDate(dexToSave.lastUpdateTime),
            userId,
          },
        })
        .catch((error) => {
          console.error('Error saving dex', error)
          throw error
        })
        .then((result) => ({ ...dex, id: result.id }))
    },
    remove: async (id: string) => {
      return prismaDb
        .delete({ where: { id } })
        .catch((error) => {
          console.error('Error removing dex', error)
          throw error
        })
        .then(/* void */)
    },
  }

  return repoApi
})
