import config from '@/config'

export default function DocumentHeadContent(): React.JSX.Element {
  const bgColor = '#08101B'

  return (
    <>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="apple-touch-icon" sizes="180x180" href="/images/pwa/apple-icon-180.png" />
      <link rel="icon" type="image/png" sizes="196x196" href="/images/pwa/favicon-196.png" />
      <link rel="manifest" href="/manifest.webmanifest" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-touch-fullscreen" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={config.texts.standaloneTitle} />
      <meta name="application-name" content={config.texts.standaloneTitle} />
      <meta name="theme-color" content={bgColor} />
    </>
  )
}
