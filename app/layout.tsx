import '@/app/globals.css'
import { Providers } from '@/components/providers'

import { Toaster } from '@/components/ui/sonner'
import { ClerkProvider } from '@clerk/nextjs'
import { Lato } from 'next/font/google'
import { Metadata } from 'next'
import { esMX } from '@clerk/localizations'

const lato = Lato({
  weight: ['100', '300', '400', '700', '900'],
  subsets: ['latin']
})

export const metadata: Metadata = {
  metadataBase: process.env.VERCEL_URL
    ? new URL("https://pesito-a-pesito.vercel.app/")
    : undefined,
  title: {
    default: 'Pesito a Pesito',
    template: `%s - Pesito a Pesito`
  },
  description:
    'Chatbot de inteligencia artificial ultrarrápido que responde con gráficos bursátiles interactivos en vivo, información financiera, noticias, filtros y mucho más.',
  icons: {
    icon: '/favicon.ico'
  },
  openGraph: {
    images: ["https://pesito-a-pesito.vercel.app/og.png"],
    siteName: 'Pesito a Pesito',
    url: "https://pesito-a-pesito.vercel.app", 
    title: "Pesito a Pesito"
  }
}

export const viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: 'white' }]
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ClerkProvider localization={esMX}>
      <html lang="es" suppressHydrationWarning>
        <body className={lato.className}>
          <Toaster position="top-center" />
          <Providers
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <main className="flex flex-col flex-1 bg-muted/50">
                {children}
              </main>
            </div>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
