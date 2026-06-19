import type { Metadata } from 'next'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata: Metadata = {
  title: {
    default: 'rosetta-date',
    template: '%s – rosetta-date',
  },
  description:
    'A translation engine for date-formatting languages. Bidirectionally convert date-format token strings between moment/dayjs and Unicode/LDML (date-fns) dialects.',
  metadataBase: new URL('https://github.com/JoaoPedroAS51/rosetta-date'),
}

const repo = 'https://github.com/JoaoPedroAS51/rosetta-date'

const navbar = (
  <Navbar
    logo={<b>rosetta-date</b>}
    projectLink={repo}
  />
)

const footer = (
  <Footer>
    MIT
    {' '}
    {new Date().getFullYear()}
    {' '}
    © rosetta-date.
  </Footer>
)

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase={`${repo}/tree/main/docs`}
          editLink="Edit this page on GitHub"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
