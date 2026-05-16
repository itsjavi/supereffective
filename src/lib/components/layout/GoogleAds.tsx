import Head from 'next/head'

import { useSession } from '@/features/users/auth/hooks/useSession'

export default function GoogleAds(): React.JSX.Element | null {
  const auth = useSession()
  if (auth.isLoading() || auth.isAuthenticated()) {
    return null
  }
  // TODO: detect Patreon membership and only show ads if not a member (e.g. useMembership()? )
  return (
    <Head>
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2388004982925022"
        crossOrigin="anonymous"
      ></script>
    </Head>
  )
}
