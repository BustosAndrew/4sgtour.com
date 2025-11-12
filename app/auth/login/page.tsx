import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <LoginForm />
      <SiteFooter />
    </>
  )
}
