import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ContactForm } from "@/components/contact-form"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-muted/50">
      <SiteHeader />
      <main className="container py-12 md:py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="rounded-3xl bg-card p-10 shadow-sm md:p-12">
            <div className="space-y-10">
              <div>
                <h3 className="mb-4 text-xl font-medium text-foreground">Representative Email:</h3>
                <a
                  href="mailto:Go@Us4seasongolf.com"
                  className="text-lg text-muted-foreground underline decoration-muted-foreground/30 hover:text-primary"
                >
                  Go@Us4seasongolf.com
                </a>
              </div>

              <div>
                <h3 className="mb-4 text-xl font-medium text-foreground">Customer Service:</h3>
                <a href="tel:1-714-877-5998" className="text-lg text-muted-foreground hover:text-primary">
                  1-714-877-5998
                </a>
              </div>

              <div>
                <h3 className="mb-4 text-xl font-medium text-foreground">Other:</h3>
                <div className="space-y-3 text-lg">
                  <a href="tel:1-213-214-3355" className="block text-muted-foreground hover:text-primary">
                    1-213-214-3355
                  </a>
                  <a href="tel:1-714-486-5463" className="block text-muted-foreground hover:text-primary">
                    1-714-486-5463
                  </a>
                  <a href="tel:070-4517-5998" className="block text-muted-foreground hover:text-primary">
                    070-4517-5998
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-card p-10 shadow-sm md:p-12">
            <h2 className="mb-3 text-3xl font-semibold">Contact Us</h2>
            <p className="mb-10 text-lg leading-relaxed text-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
              dolore magna aliqua.
            </p>
            <ContactForm />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
