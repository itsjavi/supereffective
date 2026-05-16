import { useRouter } from 'next/compat/router'
import { useState } from 'react'

import { isSignInEnabled } from '@/config/featureFlags'
import { Routes } from '@/config/routes'
import { useSession } from '@/features/users/auth/hooks/useSession'
import EmailSigninView from '@/features/users/components/EmailSigninView'
import TokenSignInView from '@/features/users/components/TokenSignInView'
import Button from '@/lib/components/Button'
import { SiteLink } from '@/lib/components/Links'
import { LoadingBanner } from '@/lib/components/panels/LoadingBanner'
import { LoadingRedirectBanner } from '@/lib/components/panels/LoadingRedirectBanner'
import { PatreonButton } from '../components/PatreonButtons'

export function LoginView({ csrfToken }: { csrfToken: string | null }): React.JSX.Element {
  const router = useRouter()
  const auth = useSession()
  const [tokenMode, setTokenMode] = useState(false)

  if (auth.isLoading()) {
    return <LoadingBanner />
  }

  if (router?.query.error) {
    router.push(Routes.AuthError + '?error=' + router.query.error)
    return <LoadingBanner />
  }

  if (auth.isAuthenticated() && !auth.isVerified()) {
    return (
      <LoadingRedirectBanner
        routeUri={Routes.VerifyEmail + '?email=' + encodeURIComponent(auth.currentUser?.email || '')}
      />
    )
  }

  if (auth.isAuthenticated() && auth.isOperable() && auth.isVerified()) {
    return <LoadingRedirectBanner routeUri={Routes.Profile} />
  }

  if (!isSignInEnabled()) {
    return (
      <div className="text-center">
        <h2>
          <i className={'icon-user'} /> Sign In
        </h2>
        <p className={'inner-container inner-blueberry text-center'} style={{ fontSize: '1.3rem' }}>
          We are currently experiencing issues with our Sign In system. <br />
          Please check back later.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <h2>
        <i className={'icon-user'} /> Sign In
      </h2>
      <p className={'inner-container inner-blueberry text-left'}>
        When you sign in, you'll be able to save your{' '}
        <b>
          <i className={'icon-pkg-box-home'} />
          Livingdex
        </b>{' '}
        progress and use all other upcoming features of the website.
      </p>
      {!tokenMode && (
        <div>
          <EmailSigninView csrfToken={csrfToken} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '1rem 0',
              gap: '1rem',
              padding: '0 1rem',
            }}
          >
            <hr
              style={{
                border: 'none',
                height: '1px',
                flex: '1',
                borderBottom: '1px dotted currentColor',
                opacity: '0.5',
              }}
            />
            or
            <hr
              style={{
                border: 'none',
                height: '1px',
                flex: '1',
                borderBottom: '1px dotted currentColor',
                opacity: '0.5',
              }}
            />
          </div>
          <Button
            title="Sign In with the token you got via email"
            onClick={(e: any) => {
              e.preventDefault()
              setTokenMode(true)
            }}
          >
            Sign In with Token from Email
          </Button>
          <PatreonButton style={{}} className="btn">
            Sign In with Patreon
          </PatreonButton>
        </div>
      )}
      {tokenMode && <TokenSignInView csrfToken={csrfToken} />}
      <p style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
        By signing in, you agree to our{' '}
        <SiteLink href={'/terms-of-service'}>
          <b>Terms of Service</b>
        </SiteLink>
      </p>
    </div>
  )
}
