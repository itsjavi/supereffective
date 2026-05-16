import { GetServerSidePropsContext } from 'next'

import { cacheConfig } from '@/config/cache'
import LivingDexApp from '@/features/livingdex/components/LivingDexApp'
import { getLegacyLivingDexRepository } from '@/features/livingdex/services/repository'
import { getPresets } from '@/features/livingdex/services/presets'
import { PresetDexMap } from '@/features/livingdex/services/presets/types'
import { LoadedDex } from '@/features/livingdex/services/types'
import PageMeta from '@/features/prose/components/PageMeta'
import LivingDexLayout from '@/lib/components/layout/LivingDexLayout'
import { abs_url } from '@/lib/components/Links'
import { getGameSetByGameId } from '@/lib/data-client/game-sets'
import { deserializeObject, serializeObject } from '@/lib/utils/serialization/jsonSerializable'

const Page = ({ dexData, presets }: { dexData: any; presets: PresetDexMap }) => {
  const dex = deserializeObject<LoadedDex>(dexData)
  const metaTitle = `${dex.title} | PokéPC Classic Pokédex Tracker`
  const metaDescription = `${dex.title}, a Pokémon Livingex created with Supereffective's Livingdex Tracker app. Caught ${dex.caughtRegular} / ${dex.totalRegular}.`
  const gameSet = getGameSetByGameId(dex.gameId)
  const gameSetId = gameSet.id

  const containerClasses =
    `page-container full-main-height dex-game bg-ball-pattern10 ` +
    `dex-gameset-${gameSetId} dex-game-${dex.gameId} dex-preset-${dex.presetId} ` +
    `dex-boxsize-${gameSet.storage?.boxCapacity}`

  return (
    <LivingDexLayout>
      <div style={{ maxWidth: 'none' }} className={containerClasses}>
        <PageMeta
          metaTitle={metaTitle}
          metaDescription={metaDescription}
          imageUrl={abs_url('/images/og-image.png')}
          robots={'noindex, nofollow'}
          canonicalUrl={abs_url('/apps/livingdex/' + dex.id)}
          lang={'en'}
        />
        <LivingDexApp loadedDex={dex} presets={presets} />
      </div>
    </LivingDexLayout>
  )
}

// This value is considered fresh for N seconds eg (s-maxage=10).
// If a request is repeated within the next N seconds, the previously
// cached value will still be fresh. If the request is repeated before 59 seconds,
// the cached value will be stale but still render (stale-while-revalidate=59).
//
// In the background, a revalidation request will be made to populate the cache
// with a fresh value. If you refresh the page, you will see the new value.
// https://nextjs.org/docs/basic-features/data-fetching/overview#getserversideprops-server-side-rendering
export async function getServerSideProps(context: GetServerSidePropsContext) {
  // context.res.setHeader('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=59')
  const swrSecs = cacheConfig.apiResponseCacheSeconds * 2
  context.res.setHeader(
    'Cache-Control',
    'public, s-maxage=' + cacheConfig.apiResponseCacheSeconds + ', stale-while-revalidate=' + swrSecs,
  )
  const dexid = context.params?.dexid

  const dexRepo = getLegacyLivingDexRepository()

  if (typeof dexid !== 'string' || !dexid.match(/^[a-zA-Z0-9-_]+$/)) {
    return {
      notFound: true,
    }
  }

  try {
    const dex = await dexRepo.getById(dexid)
    if (!dex) {
      return {
        notFound: true,
      }
    }
    return {
      props: {
        dexData: serializeObject(dex),
        presets: getPresets(),
      },
    }
  } catch (e) {
    console.error('Error loading dex', { dexid, error: String(e) })
    console.error(e)
    return {
      notFound: true,
    }
  }
}

export default Page
