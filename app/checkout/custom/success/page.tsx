import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getServerTranslations } from '@/lib/i18n/server'
import { getSupportEmail } from '@/lib/site-email'

// Where Stripe's hosted checkout returns customers after paying by SMS link
// or from a custom-package page. Public on purpose: most of these customers
// are guests, and /bookings sends anyone signed out to the login page.

export const metadata: Metadata = {
  title: 'Payment Successful | 4 Seasons Golf Tour',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string }>
}) {
  const { package: packageId } = await searchParams
  const t = await getServerTranslations('paymentSuccess')
  const supportEmail = getSupportEmail()
  const packageHref =
    packageId && UUID.test(packageId) ? `/package/${packageId}` : null

  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderWrapper />
      <main className="container flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-emerald-100 p-4">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
          </div>

          <h1 className="mb-4 text-3xl font-bold text-foreground">{t('title')}</h1>

          <p className="mb-8 text-lg text-muted-foreground">{t('message')}</p>

          <div className="space-y-3">
            {packageHref && (
              <Button asChild className="w-full bg-[#274C77] hover:bg-[#274C77]/90">
                <Link href={packageHref}>{t('viewPackage')}</Link>
              </Button>
            )}
            <Button
              asChild
              variant={packageHref ? 'outline' : 'default'}
              className={packageHref ? 'w-full' : 'w-full bg-[#274C77] hover:bg-[#274C77]/90'}
            >
              <Link href="/">{t('returnHome')}</Link>
            </Button>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            {t('questions')}{' '}
            <a href={`mailto:${supportEmail}`} className="text-[#274C77] underline">
              {supportEmail}
            </a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
