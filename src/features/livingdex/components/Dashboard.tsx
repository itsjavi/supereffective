import { useState } from 'react'

import { GameCardList } from '@/features/livingdex/components/GameCard'
import { WelcomeContent } from '@/features/livingdex/components/WelcomeContent'
import { LivingDexResolvedUserLimits } from '@/features/livingdex/services/types'
import { useDexesContext } from '@/features/livingdex/state/LivingDexListContext'
import { useSession } from '@/features/users/auth/hooks/useSession'
import { ButtonInternalLink } from '@/lib/components/Button'
import { LoadingBanner } from '@/lib/components/panels/LoadingBanner'

const WelcomeContentContainer = (): React.JSX.Element => {
  return (
    <div className={'page-container dex-count-0'} style={{ paddingTop: 0 }}>
      <WelcomeContent showDescription />
    </div>
  )
}

const AuthenticatedDashboardContainer = ({
  limits,
}: {
  limits: LivingDexResolvedUserLimits | null
}): React.JSX.Element => {
  const { dexes, dexesLoading } = useDexesContext()
  const [listVariant] = useState<'grid' | 'list'>('list')

  if (dexesLoading) {
    return <LoadingBanner />
  }

  if (dexes === undefined || dexes.length === 0) {
    return (
      <>
        <WelcomeContentContainer />
      </>
    )
  }

  const remainingDexes = limits?.remainingDexes ?? 0
  const canAddMoreDexes = remainingDexes > 0

  return (
    <div className={'page-container dex-count-' + dexes.length} style={{ paddingBlock: 0 }}>
      <div className="inner-blueberry inner-container">
        <h2 className={'main-title-outlined text-center'}>Livingdex Tracker</h2>
        <div className="text-center" style={{ margin: '0 0 2rem 0', opacity: 1 }}>
          <GameCardList variant={listVariant} dexes={dexes} linkable />
        </div>
        <div className="text-center" style={{ opacity: 1, fontSize: '1.5rem' }}>
          {canAddMoreDexes && (
            <ButtonInternalLink href={'/apps/livingdex/new'} inverted={false}>
              + Add Game
            </ButtonInternalLink>
          )}
          <ButtonInternalLink href={'/apps/livingdex/missing'} inverted={true}>
            <i className="icon-pkg-pokeball-outlined" /> View Missing Pokémon
          </ButtonInternalLink>
        </div>
        <WelcomeContent />
      </div>
    </div>
  )
}

export const Dashboard = ({ limits }: { limits: LivingDexResolvedUserLimits | null }) => {
  const session = useSession()

  if (session.isLoading()) {
    return <LoadingBanner />
  }

  if (!session.isAuthenticated()) {
    return <WelcomeContentContainer />
  }

  return <AuthenticatedDashboardContainer limits={limits} />
}
