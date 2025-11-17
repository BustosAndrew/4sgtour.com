import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LoginForm } from "@/components/auth/login-form"
import { Suspense } from "react"

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={
        <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-muted/30 p-6">
          <div className="w-full max-w-md">
            <div className="rounded-lg bg-card p-8 shadow-sm">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold text-foreground">Loading...</h1>
              </div>
            </div>
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
      <SiteFooter />
    </>
  )
}
