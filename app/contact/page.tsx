import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { ContactForm } from "@/components/contact-form"
import { GlassCard } from "@/components/ui/glass-card"

export default async function ContactPage() {
  return (
    <div className="min-h-screen relative">
      {/* Background image */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/contact-bg.png')",
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
            <GlassCard className="max-w-fit h-fit shrink-0">
              <div className="p-6 sm:p-8 space-y-8 sm:space-y-10 h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center">
                  <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-medium text-white">
                    Representative Email:
                  </h3>
                  <a
                    href="mailto:info@4sgtour.com"
                    className="text-base sm:text-lg text-white/80 underline decoration-white/30 hover:text-white"
                  >
                    info@4sgtour.com
                  </a>
                </div>

                <div className="flex flex-col items-center text-center">
                  <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-medium text-white">
                    Customer Service:
                  </h3>
                  <a
                    href="tel:1-714-877-5998"
                    className="text-base sm:text-lg text-white/80 hover:text-white"
                  >
                    1-714-877-5998
                  </a>
                </div>

                <div className="flex flex-col items-center text-center">
                  <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-medium text-white">
                    Other:
                  </h3>
                  <div className="space-y-2 sm:space-y-3 text-base sm:text-lg">
                    <a
                      href="tel:1-213-214-3355"
                      className="block text-white/80 hover:text-white"
                    >
                      1-213-214-3355
                    </a>
                    <a
                      href="tel:1-714-486-5463"
                      className="block text-white/80 hover:text-white"
                    >
                      1-714-486-5463
                    </a>
                    <a
                      href="tel:070-4517-5998"
                      className="block text-white/80 hover:text-white"
                    >
                      070-4517-5998
                    </a>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="flex-1 lg:max-w-xl">
              <div className="p-6 sm:p-8 lg:p-10 py-6 sm:py-7">
                <h2 className="mb-2 sm:mb-3 text-2xl sm:text-3xl font-semibold text-white">
                  Contact Us
                </h2>
                <p className="mb-6 sm:mb-10 text-base sm:text-lg leading-relaxed text-white/80">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
                <ContactForm />
              </div>
            </GlassCard>
          </div>
        </main>
        <SiteFooter />
      </div>
    </div>
  )
}
