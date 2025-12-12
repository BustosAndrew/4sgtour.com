import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { SignUpForm } from "@/components/auth/sign-up-form"

export default async function SignUpPage() {
  return (
    <>
      <SiteHeaderWrapper />
      <SignUpForm />
      <SiteFooter />
    </>
  )
}
