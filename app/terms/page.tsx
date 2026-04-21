import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { GlassCard } from "@/components/ui/glass-card"
import { getServerTranslations } from "@/lib/i18n/server"

export default async function TermsPage() {
  const t = await getServerTranslations("terms")

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
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </h1>
                </div>

                <div className="space-y-6 text-white/80">
                  {/* Notes on Reservations */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("reservationsTitle")}</h2>
                    <p className="mb-3">{t("reservationsDeposit")}</p>
                    <ul className="list-disc ml-5 space-y-3">
                      <li>{t("reservationsItem1")}
                        <p className="mt-2 text-sm italic">{t("reservationsNote")}</p>
                      </li>
                      <li>{t("vehicleHeading")}
                        <ul className="list-none ml-4 mt-2 space-y-1 text-sm">
                          <li>{t("vehicle1")}</li>
                          <li>{t("vehicle2")}</li>
                          <li>{t("vehicle3")}</li>
                          <li>{t("vehicle4")}</li>
                          <li>{t("vehicle5")}</li>
                          <li>{t("vehicle6")}</li>
                        </ul>
                      </li>
                      <li>{t("reservationsItem3")}</li>
                      <li>{t("reservationsItem4")}</li>
                      <li>{t("reservationsItem5")}</li>
                      <li>{t("reservationsItem6")}</li>
                      <li>{t("reservationsItem7")}</li>
                    </ul>
                  </div>

                  {/* Additional Cost for Single Room */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("singleRoomTitle")}</h2>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>{t("singleRoomItem1")}</li>
                      <li>{t("singleRoomItem2")}</li>
                      <li>{t("singleRoomItem3")}</li>
                    </ul>
                    <p className="mt-3 text-sm italic">{t("singleRoomNote")}</p>
                  </div>

                  {/* Passport/Visa Information */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("passportTitle")}</h2>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>{t("passportItem1")}</li>
                      <li>{t("passportItem2")}</li>
                    </ul>
                  </div>

                  {/* General Guidance */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("generalTitle")}</h2>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>{t("generalItem1")}</li>
                      <li>{t("generalItem2")}</li>
                      <li>{t("generalItem3")}</li>
                      <li>{t("generalItem4")}</li>
                      <li>{t("generalItem5")}</li>
                      <li>{t("generalItem6")}</li>
                      <li>{t("generalItem7")}</li>
                      <li>{t("generalItem8")}</li>
                    </ul>
                    <p className="mt-3 text-sm">{t("generalNote")}</p>
                  </div>

                  {/* Cancellation Policy */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("cancellationTitle")}</h2>
                    <p className="mb-3">{t("cancellationIntro")}</p>

                    <div className="ml-4 space-y-4">
                      <div>
                        <p className="font-semibold text-white">{t("hqTitle")}</p>
                        <p className="text-sm mb-2">{t("hqDepositNote")}</p>

                        <p className="font-medium text-white/90 mt-3">{t("hqSameDayTitle")}</p>
                        <ul className="list-disc ml-5 mt-1 space-y-1 text-sm">
                          <li>{t("hqSameDayItem1")}</li>
                          <li>{t("hqSameDayItem2")}</li>
                          <li>{t("hqSameDayItem3")}</li>
                          <li>{t("hqSameDayItem4")}</li>
                          <li>{t("hqSameDayItem5")}</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("laTitle")}</p>
                        <ul className="list-disc ml-5 mt-1 space-y-1 text-sm">
                          <li>{t("laItem1")}</li>
                          <li>{t("laItem2")}</li>
                          <li>{t("laItem3")}</li>
                          <li>{t("laItem4")}</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-white/5 rounded-lg text-sm space-y-2">
                      <p>• {t("cancellationNote1")}</p>
                      <p>• {t("cancellationNote2")}</p>
                      <p>• {t("cancellationNote3")}</p>
                      <p>• {t("cancellationNote4")}</p>
                      <p>• {t("cancellationNote5")}</p>
                      <p>• {t("cancellationNote6")}</p>
                    </div>
                  </div>

                  {/* Room Information */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("roomTitle")}</h2>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>{t("roomItem1")}</li>
                      <li>{t("roomItem2")}</li>
                      <li>{t("roomItem3")}</li>
                      <li>{t("roomItem4")}</li>
                    </ul>
                  </div>

                  {/* SMS / Text Messaging Terms */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">{t("smsTitle")}</h2>
                    <p className="mb-4">{t("smsIntro")}</p>

                    <div className="ml-4 space-y-4">
                      <div>
                        <p className="font-semibold text-white">{t("smsProgramHeading")}</p>
                        <p>{t("smsProgramText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("smsTypesHeading")}</p>
                        <ul className="list-disc ml-5 mt-1 space-y-1">
                          <li>{t("smsTypesItem1")}</li>
                          <li>{t("smsTypesItem2")}</li>
                          <li>{t("smsTypesItem3")}</li>
                          <li>{t("smsTypesItem4")}</li>
                          <li>{t("smsTypesItem5")}</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("smsFrequencyHeading")}</p>
                        <p>{t("smsFrequencyText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("smsRatesHeading")}</p>
                        <p>{t("smsRatesText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("smsOptOutHeading")}</p>
                        <p>{t("smsOptOutText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("smsHelpHeading")}</p>
                        <p>{t("smsHelpText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("smsCarriersHeading")}</p>
                        <p>{t("smsCarriersText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("smsDeliveryHeading")}</p>
                        <p>{t("smsDeliveryText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("smsPrivacyHeading")}</p>
                        <p>{t("smsPrivacyText")}</p>
                      </div>

                      <div>
                        <p className="font-semibold text-white">{t("smsChangesHeading")}</p>
                        <p>{t("smsChangesText")}</p>
                      </div>
                    </div>
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
