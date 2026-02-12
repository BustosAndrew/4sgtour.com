import { SiteHeaderWrapper } from '@/components/site-header-wrapper'
import { SiteFooter } from '@/components/site-footer'
import { ContactForm } from '@/components/contact-form'
import Image from 'next/image'
import { Mail, Globe, Phone } from 'lucide-react'

export default async function ContactPage() {
  return (
    <div className="min-h-screen bg-[#ffffff]">
      <SiteHeaderWrapper />

      {/* Hero Banner */}
      <section className="relative h-[340px] sm:h-[500px] sm:pt-20 flex items-center justify-center">
        <Image
          src="/images/contact-bg.jpg"
          alt="Golf course"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 text-center px-4">
          <h1
            className="text-4xl sm:text-5xl text-[#ffffff] mb-4"
            style={{
              fontFamily: "'loretta', serif",
              fontWeight: 400,
            }}
          >
            Contact Us
          </h1>
          <p className="max-w-xl mx-auto text-[#ffffff] text-sm sm:text-[20px] leading-relaxed">
            We'd love to hear from you! Whether you have questions, feedback, or
            need assistance, our team is here to help. Please fill out the form
            below or reach us through the provided contact details.
          </p>
          <div className="mt-6 w-12 h-[2px] bg-[#ffffff] mx-auto" />
        </div>
      </section>

      {/* Contact Content */}
      <main className="py-10 sm:py-16 lg:py-20 px-5 sm:px-6 lg:px-20 xl:px-28">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 xl:gap-28">
            {/* Left: Form */}
            <div>
              <ContactForm />
            </div>

            {/* Right: Get In Touch */}
            <div>
              <h2
                className="text-2xl sm:text-3xl lg:text-4xl text-[#735c38] mb-4 font-semibold"
                style={{
                  fontFamily: "'loretta', serif",
                  fontWeight: 400,
                }}
              >
                Get In Touch
              </h2>
              <p className="text-[#735c38]/70 text-base sm:text-lg lg:text-[20px] leading-relaxed mb-6 sm:mb-8 font-semibold">
                We are a Korean travel agency specializing in overseas golf
                travel, offering exceptional service and a variety of
                destinations, offering the best golf tours. Feel free to contact
                us. We'd love to hear from you!
              </p>

              <div className="w-10 h-[2px] bg-[#735c38] mb-6 sm:mb-8" />

              <div className="space-y-5 sm:space-y-6">
                {/* Email */}
                <div className="flex items-start gap-4 sm:gap-8">
                  <div className="mt-1 sm:mt-4 flex-shrink-0">
                    <Mail className="h-5 w-5 sm:h-7 sm:w-7 text-[#22333b]" />
                  </div>
                  <div>
                    <h3
                      className="font-semibold uppercase text-[#22333b] text-base sm:text-lg lg:text-[20px] tracking-wide"
                      style={{ fontFamily: "'sweet-sans-pro', sans-serif" }}
                    >
                      Representative Email
                    </h3>
                    <a
                      href="mailto:info@4sgtour.com"
                      className="text-[#735c38]/70 hover:text-[#735c38] text-sm sm:text-base lg:text-[20px] transition-colors font-semibold"
                    >
                      info@4sgtour.com
                    </a>
                  </div>
                </div>

                {/* Website */}
                <div className="flex items-start gap-4 sm:gap-8">
                  <div className="mt-1 sm:mt-4 flex-shrink-0">
                    <Globe className="h-5 w-5 sm:h-7 sm:w-7 text-[#22333b]" />
                  </div>
                  <div>
                    <h3
                      className="font-semibold uppercase text-[#22333b] text-base sm:text-lg lg:text-[20px] tracking-wide"
                      style={{ fontFamily: "'sweet-sans-pro', sans-serif" }}
                    >
                      Website
                    </h3>
                    <a
                      href="https://www.4sgtour.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#735c38]/70 hover:text-[#735c38] text-sm sm:text-base lg:text-[20px] transition-colors font-semibold"
                    >
                      4sgtour.com
                    </a>
                  </div>
                </div>

                {/* Customer Service */}
                <div className="flex items-start gap-4 sm:gap-8">
                  <div className="mt-1 sm:mt-4 flex-shrink-0">
                    <Phone className="h-5 w-5 sm:h-7 sm:w-7 text-[#22333b]" />
                  </div>
                  <div>
                    <h3
                      className="font-semibold uppercase text-[#22333b] text-base sm:text-lg lg:text-[20px] tracking-wide"
                      style={{ fontFamily: "'sweet-sans-pro', sans-serif" }}
                    >
                      Customer Service
                    </h3>
                    <a
                      href="tel:1-714-877-5998"
                      className="text-[#735c38]/70 hover:text-[#735c38] text-sm sm:text-base lg:text-[20px] transition-colors font-semibold"
                    >
                      1-714-485-5463
                    </a>
                  </div>
                </div>

                {/* Other Numbers */}
                <div className="pl-9 sm:pl-15">
                  <h3
                    className="font-semibold uppercase text-[#22333b] text-base sm:text-lg lg:text-[20px] tracking-wide mb-1"
                    style={{ fontFamily: "'sweet-sans-pro', sans-serif" }}
                  >
                    Other Numbers
                  </h3>
                  <div className="space-y-0.5">
                    <a
                      href="tel:1-213-214-3355"
                      className="block text-[#735c38]/70 hover:text-[#735c38] text-sm sm:text-base lg:text-[20px] transition-colors font-semibold"
                    >
                      1-213-214-3355
                    </a>
                    <a
                      href="tel:070-4517-5998"
                      className="block text-[#735c38]/70 hover:text-[#735c38] text-sm sm:text-base lg:text-[20px] transition-colors font-semibold"
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
  )
}
