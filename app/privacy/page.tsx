import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { GlassCard } from "@/components/ui/glass-card"
import { getServerTranslations } from "@/lib/i18n/server"

export default async function PrivacyPage() {
  const t = await getServerTranslations("privacy")

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/images/contact-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="relative z-10">
        <SiteHeaderWrapper />
        <main className="container py-8 pt-24 lg:pt-28 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <GlassCard>
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="mb-8 text-center">
                  <h1 className="flex items-center justify-center gap-2 text-2xl sm:text-3xl font-bold text-white">
                    {t("title")}
                    <svg
                      className="h-6 w-6 sm:h-8 sm:w-8"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </h1>
                </div>

                <div className="space-y-6 text-white/80">
                  <p className="text-sm text-white/60">
                    <strong>{t("effectiveDateLabel")}:</strong> {t("effectiveDate")} | <strong>{t("versionLabel")}:</strong> {t("version")}
                  </p>

                  <p>{t("intro")}</p>

                  {/* Section 1 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("s1Title")}</h2>
                    <p className="mb-3">{t("s1Intro")}</p>

                    <div className="ml-4 space-y-3">
                      <div>
                        <p className="font-semibold text-white">{t("s1TourHeading")}</p>
                        <ul className="list-disc ml-5 mt-1 space-y-1">
                          <li>{t("s1TourRequired")}</li>
                          <li>{t("s1TourOptional")}</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("s1InquiryHeading")}</p>
                        <ul className="list-disc ml-5 mt-1 space-y-1">
                          <li>{t("s1InquiryRequired")}</li>
                          <li>{t("s1InquiryOptional")}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("s2Title")}</h2>
                    <p className="mb-2">{t("s2Intro")}</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>{t("s2Item1")}</li>
                      <li>{t("s2Item2")}</li>
                      <li>{t("s2Item3")}</li>
                    </ul>
                    <p className="mt-3 text-sm italic">{t("s2Note")}</p>
                  </div>

                  {/* Section 3 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("s3Title")}</h2>
                    <p className="mb-2">{t("s3Intro")}</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>{t("s3Item1")}</li>
                      <li>{t("s3Item2")}</li>
                      <li>{t("s3Item3")}</li>
                      <li>{t("s3Item4")}</li>
                      <li>{t("s3Item5")}</li>
                      <li>{t("s3Item6")}</li>
                    </ul>
                  </div>

                  {/* Section 4 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("s4Title")}</h2>
                    <p className="mb-3">{t("s4Intro")}</p>

                    <div className="ml-4 space-y-3">
                      <div>
                        <p className="font-semibold text-white">{t("s4ProcedureHeading")}</p>
                        <p>{t("s4ProcedureText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("s4MethodHeading")}</p>
                        <ul className="list-disc ml-5 mt-1 space-y-1">
                          <li>{t("s4MethodItem1")}</li>
                          <li>{t("s4MethodItem2")}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Section 5 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("s5Title")}</h2>
                    <p className="mb-2">{t("s5Intro")}</p>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>{t("s5Item1")}</li>
                      <li>{t("s5Item2")}</li>
                      <li>{t("s5Item3")}</li>
                    </ul>
                  </div>

                  {/* Section 6 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("s6Title")}</h2>
                    <p>{t("s6Text")}</p>
                  </div>

                  {/* Section 7 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("s7Title")}</h2>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>{t("s7Item1")}</li>
                      <li>{t("s7Item2")}</li>
                      <li>{t("s7Item3")}</li>
                      <li>{t("s7Item4")}</li>
                      <li>{t("s7Item5")}</li>
                    </ul>
                  </div>

                  {/* Section 8 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("s8Title")}</h2>
                    <p className="mb-3">{t("s8Intro")}</p>

                    <div className="ml-4 space-y-3">
                      <div>
                        <p className="font-semibold text-white">{t("s8PurposeHeading")}</p>
                        <p>{t("s8PurposeText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("s8RejectHeading")}</p>
                        <p>{t("s8RejectText")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 9 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("s9Title")}</h2>
                    <p className="mb-3">{t("s9Intro")}</p>
                    <p className="mb-2">{t("s9OrgIntro")}</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>{t("s9Org1")}</li>
                      <li>{t("s9Org2")}</li>
                      <li>{t("s9Org3")}</li>
                      <li>{t("s9Org4")}</li>
                    </ul>
                  </div>

                  {/* Section 10 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("s10Title")}</h2>
                    <p className="mb-3">{t("s10Intro")}</p>
                    <ul className="list-disc ml-5 space-y-2">
                      <li><strong>{t("s10Item1Heading")}</strong> {t("s10Item1Text")}</li>
                      <li><strong>{t("s10Item2Heading")}</strong> {t("s10Item2Text")}</li>
                      <li><strong>{t("s10Item3Heading")}</strong> {t("s10Item3Text")}</li>
                      <li><strong>{t("s10Item4Heading")}</strong> {t("s10Item4Text")}</li>
                    </ul>
                  </div>

                  {/* Section 11 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("s11Title")}</h2>
                    <p>{t("s11Text")}</p>
                  </div>

                  {/* Section 12 - SMS / Text Messaging Program */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("s12Title")}</h2>
                    <p className="mb-3">{t("s12Intro")}</p>

                    <div className="ml-4 space-y-4">
                      <div>
                        <p className="font-semibold text-white">{t("s12TypesHeading")}</p>
                        <ul className="list-disc ml-5 mt-1 space-y-1">
                          <li>{t("s12TypesItem1")}</li>
                          <li>{t("s12TypesItem2")}</li>
                          <li>{t("s12TypesItem3")}</li>
                          <li>{t("s12TypesItem4")}</li>
                        </ul>
                        <p className="mt-2 text-sm italic">{t("s12TypesNote")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("s12ConsentHeading")}</p>
                        <p>{t("s12ConsentText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("s12FrequencyHeading")}</p>
                        <p>{t("s12FrequencyText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("s12RatesHeading")}</p>
                        <p>{t("s12RatesText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("s12OptOutHeading")}</p>
                        <p>{t("s12OptOutText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("s12SharingHeading")}</p>
                        <p>{t("s12SharingText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("s12SecurityHeading")}</p>
                        <p>{t("s12SecurityText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("s12ContactHeading")}</p>
                        <p>{t("s12ContactText")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Version Info */}
                  <div className="border-t border-white/20 pt-4 mt-8">
                    <p className="text-sm text-white/60">
                      <strong>{t("versionNumberLabel")}:</strong> {t("version")}<br />
                      <strong>{t("announcementDateLabel")}:</strong> {t("effectiveDate")}<br />
                      <strong>{t("effectiveDateLabel")}:</strong> {t("effectiveDate")}
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </main>
        <SiteFooter />
      </div>
    </div>
  )
}
