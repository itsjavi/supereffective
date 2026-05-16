import { useSession } from '@/features/users/auth/hooks/useSession'
import { useSignOut } from '@/features/users/auth/hooks/useSignOut'
import Button from '@/lib/components/Button'
import { UserRestrictedArea } from '@/lib/components/panels/UserRestrictedArea'

import { SessionMembership } from '../auth/types'
import { PatreonMembership } from './PatreonMembership'

export function ProfileTitle({ membership }: { membership: SessionMembership | null }): React.JSX.Element {
  if (!membership || !membership.patreonUserId) {
    return (
      <h2>
        <i className="icon-user" /> Profile
      </h2>
    )
  }
  // "thumb_url": "https://c8.patreon.com/3/200/95758725",
  // "url": "https://www.patreon.com/user?u=95758725",
  const avatarUrl = membership.avatarUrl || `https://c8.patreon.com/3/200/${membership.patreonUserId}`
  return (
    <div>
      <h2
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '0.5rem',
        }}
      >
        <img
          src={avatarUrl}
          alt="Patreon Avatar"
          style={{
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            border: '1px solid #fff',
          }}
        />
        Profile
      </h2>

      <a
        href={`https://www.patreon.com/user?u=${membership.patreonUserId}`}
        target="_blank"
        rel="noreferrer"
        style={{ fontSize: '13px', lineHeight: '1', paddingTop: '0.2rem' }}
      >
        Visit your Patreon profile &rarr;
      </a>
    </div>
  )
}

export function ProfileView(): React.JSX.Element | null {
  const auth = useSession()
  const signOut = useSignOut()

  const onLogoutClick = async () => {
    await signOut(true, '/login')
  }

  if (auth.membership) {
    auth.membership.avatarUrl = auth.membership.avatarUrl || auth.currentUser?.photoUrl || undefined
  }

  return (
    <UserRestrictedArea>
      <div>
        <ProfileTitle membership={auth.membership} />
        <hr />
        {auth.currentUser?.displayName && (
          <>
            <p>
              <b>Display Name: </b>
              <code style={{ color: 'var(--color-blueberry-accent)' }}>{auth.currentUser?.displayName}</code>
            </p>
          </>
        )}
        <p>
          <b>Email: </b>
          <code style={{ color: 'var(--color-blueberry-accent)' }}>{auth.currentUser?.email}</code>
        </p>
        <PatreonMembership />
        <p>
          <b>Support ID: </b>
          <code style={{ color: 'var(--color-blueberry-accent)' }}>{auth.currentUser?.uid}</code>
          <br />
          <small style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>
            Use this ID whenever you need help with your account, when you contact us privately. Do not share publicly.
          </small>
        </p>
        <hr />
        <div className="text-right">
          <Button onClick={onLogoutClick}>Logout</Button>
        </div>
      </div>
    </UserRestrictedArea>
  )
}
