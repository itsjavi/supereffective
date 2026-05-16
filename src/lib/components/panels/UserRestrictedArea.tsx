import { Routes } from '@/config/routes'
import { useSession } from '@/features/users/auth/hooks/useSession'

import { LoadingBanner } from './LoadingBanner'
import { LoadingRedirectBanner } from './LoadingRedirectBanner'

export type UserRestrictedAreaProps = {
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  unauthenticatedComponent?: React.ReactNode
  unverifiedComponent?: React.ReactNode
}

export function UserRestrictedArea({
  children,
  loadingComponent,
  unauthenticatedComponent,
  unverifiedComponent,
}: UserRestrictedAreaProps): React.JSX.Element {
  const auth = useSession()

  if (auth.isLoading()) {
    return <>{loadingComponent ? loadingComponent : <LoadingBanner />}</>
  }

  if (auth.isAuthenticated() && !auth.isVerified()) {
    const redirectUri = Routes.VerifyEmail + '?email=' + encodeURIComponent(auth.currentUser?.email || '')
    return <>{unverifiedComponent ? unverifiedComponent : <LoadingRedirectBanner routeUri={redirectUri} />}</>
  }

  if (auth.isUnauthenticated() || !auth.isOperable()) {
    const redirectUri = Routes.Login
    return (
      <>
        {unauthenticatedComponent ? (
          unauthenticatedComponent
        ) : (
          <LoadingRedirectBanner routeUri={redirectUri}>
            <LoadingBanner />
          </LoadingRedirectBanner>
        )}
      </>
    )
  }

  return <>{children}</>
}
