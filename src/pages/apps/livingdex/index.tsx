import { GetServerSidePropsContext } from 'next'

import { Dashboard } from '@/features/livingdex/components/Dashboard'
import { getLegacyLivingDexRepository } from '@/features/livingdex/services/repository'
import { LivingDexResolvedUserLimits } from '@/features/livingdex/services/types'
import PageMeta from '@/features/prose/components/PageMeta'
import { getPageRepository } from '@/features/prose/services/getPageRepository'
import { PageEntry } from '@/features/prose/services/types'
import { getSession } from '@/features/users/auth/serverside/getSession'
import LivingDexLayout from '@/lib/components/layout/LivingDexLayout'
import { abs_url } from '@/lib/components/Links'
import { NewVersionBanner } from '@/lib/components/NewVersionBanner'
import { LoadingBanner } from '@/lib/components/panels/LoadingBanner'

const Page = ({ entry, limits }: { entry: PageEntry | null; limits: LivingDexResolvedUserLimits }) => {
  if (!entry) {
    return <LoadingBanner />
  }

  return (
    <LivingDexLayout>
      <div className={'page-container '} style={{ maxWidth: 'none' }}>
        <PageMeta
          metaTitle={entry.metaTitle}
          metaDescription={entry.metaDescription}
          robots={entry.robots}
          imageUrl={abs_url('/images/og-image.png')}
          canonicalUrl={abs_url('/apps/livingdex')}
          lang={'en'}
        />
        <>
          <Dashboard limits={limits} />
        </>
      </div>
      <NewVersionBanner href="https://pokepc.net/games" title="Go to the new version" />
    </LivingDexLayout>
  )
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const pageProps = getPageRepository().getStaticProps('livingdex', 60 * 60 * 24) // 24h
  const session = await getSession(ctx.req, ctx.res)

  if (!session?.currentUser?.uid) {
    return {
      props: {
        entry: pageProps.props?.entry ?? null,
        limits: null,
      },
    }
  }

  const resolvedLimits = await getLegacyLivingDexRepository().getResolvedLimitsForUser(
    session.currentUser.uid,
    session.membership,
  )

  return {
    props: {
      entry: pageProps.props?.entry ?? null,
      limits: resolvedLimits,
    },
  }
}

export default Page
