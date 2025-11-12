import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SignUpForm } from "@/components/auth/sign-up-form"

export default function SignUpPage() {
  return (
    <>
      <SiteHeader />
      <SignUpForm />
      <SiteFooter />
    </>
  )
}
