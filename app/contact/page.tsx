import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { ContactForm } from "@/components/contact-form"

export default async function ContactPage() {
  return (
    <div className="min-h-screen relative">
      {/* Background image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/contact-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content wrapper with relative positioning */}
      <div className="relative z-10">
        <SiteHeaderWrapper />
        <main className="py-12 md:py-16 lg:py-20 pt-28 lg:pt-32 px-4 sm:px-6 md:px-10 lg:px-20">
          <div className="flex flex-col lg:flex-row gap-6 justify-center items-center lg:items-stretch lg:gap-70 w-full">
            <div className="max-w-3xl h-fit bg-white">
              <div className="flex flex-col">
                <div className="p-8 py-6 lg:pb-0">
                  <h2 className="mb-2 sm:mb-3 text-2xl sm:text-3xl font-semibold text-foreground">
                    Contact Us
                  </h2>
                  <p className="mb-3 text-base sm:text-lg leading-relaxed text-muted-foreground font-bold">
                    We&apos;d love to hear from you! Whether you have questions,
                    feedback, or need assistance, our team is here to help.
                    Please fill out the form below or reach us through the
                    provided contact details.
                  </p>
                  <ContactForm />
                </div>
                <div className="p-6 lg:pb-8 space-y-8 h-fit flex flex-col lg:flex-row justify-center items-center lg:items-start lg:space-x-8">
                  <div className="flex flex-col items-center">
                    <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-medium text-foreground">
                      Representative Email:
                    </h3>
                    <a
                      href="mailto:info@4sgtour.com"
                      className="text-base sm:text-lg text-foreground underline decoration-muted-foreground/30 hover:text-foreground font-bold"
                    >
                      info@4sgtour.com
                    </a>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-medium text-foreground">
                      Customer Service:
                    </h3>
                    <a
                      href="tel:1-714-877-5998"
                      className="text-base sm:text-lg text-foreground hover:text-foreground font-bold"
                    >
                      1-714-877-5998
                    </a>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-medium text-foreground">
                      Other:
                    </h3>
                    <div className="space-y-2 sm:space-y-3 text-base sm:text-lg">
                      <a
                        href="tel:1-213-214-3355"
                        className="block text-foreground hover:text-foreground font-bold"
                      >
                        1-213-214-3355
                      </a>
                      <a
                        href="tel:1-714-486-5463"
                        className="block text-foreground hover:text-foreground font-bold"
                      >
                        1-714-486-5463
                      </a>
                      <a
                        href="tel:070-4517-5998"
                        className="block text-foreground hover:text-foreground font-bold"
                      >
                        070-4517-5998
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    </div>
  )
}
