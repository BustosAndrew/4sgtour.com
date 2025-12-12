import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { LoginForm } from "@/components/auth/login-form"
import { Suspense } from "react"

export default async function LoginPage() {
  return (
    <>
      <SiteHeaderWrapper />
      <Suspense
        fallback={
          <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 p-6 pt-28 lg:pt-32">
            <div className="w-full max-w-md">
              <div className="rounded-lg bg-card p-8 shadow-sm">
                <div className="mb-6 text-center">
                  <h1 className="text-2xl font-semibold text-foreground">
                    Loading...
                  </h1>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
      <SiteFooter />
    </>
  )
}
