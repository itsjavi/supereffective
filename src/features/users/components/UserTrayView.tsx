import { Routes } from '@/config/routes'
import { useSession } from '@/features/users/auth/hooks/useSession'
import { SiteLink } from '@/lib/components/Links'
import { LogInIcon, UserIcon } from 'lucide-react'

type UserTrayViewProps = {
  activeClass?: string
  returnUrl?: string
} & React.HTMLAttributes<HTMLAnchorElement>

export function UserTrayView({ activeClass, returnUrl, ...rest }: UserTrayViewProps): React.JSX.Element {
  // TODO: PATREON_MEMBERSHIP
  const auth = useSession()
  const isPaidMember = auth.membership?.isSubscriptionTier

  if (auth.isLoading()) {
    return (
      <a
        href="#"
        style={{
          background: 'none !important',
          visibility: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          minWidth: '114px',
        }}
      >
        <UserIcon width={24} height={24} style={{ marginRight: '0.5rem' }} /> Profile
      </a>
    )
  }

  if (auth.isUnauthenticated()) {
    return (
      <SiteLink
        {...rest}
        activeClass={activeClass}
        href={Routes.Login + (returnUrl ? '?s=' + returnUrl : '')}
        tabIndex={0}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          minWidth: '114px',
        }}
      >
        <LogInIcon width={24} height={24} />
        Sign In
      </SiteLink>
    )
  }

  if (!auth.isVerified()) {
    return (
      <SiteLink
        {...rest}
        activeClass={activeClass}
        href={Routes.VerifyEmail + ('?email=' + encodeURIComponent(auth.currentUser?.email || ''))}
        tabIndex={0}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          minWidth: '114px',
        }}
      >
        <i className="icon-email" style={{ marginRight: '0.5rem' }} /> Verify Email
      </SiteLink>
    )
  }

  return (
    <SiteLink
      {...rest}
      href={Routes.Profile}
      activeClass={activeClass}
      tabIndex={0}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        minWidth: '114px',
      }}
    >
      <i>
        <i className="icon-user" />
        {isPaidMember && (
          <i
            className="icon-pkg-shiny"
            style={{
              color: 'orange',
              fontSize: '1rem',
              position: 'absolute',
              top: '-0.2rem',
              left: '0.9rem',
            }}
          />
        )}
      </i>
      Profile
    </SiteLink>
  )
}
