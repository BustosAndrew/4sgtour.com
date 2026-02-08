import { SiteFooter } from "@/components/site-footer"
import { LoginForm } from "@/components/auth/login-form"
import { Suspense } from "react"

export default async function LoginPage() {
  return (
    <>
      <Suspense
        fallback={
          <div className="flex min-h-screen w-full items-center justify-center bg-[#ffffff]">
            <div className="w-full max-w-md px-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-[#22333b]">
                  Loading...
                </h1>
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
