import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { GlassCard } from "@/components/ui/glass-card"

export default async function PrivacyPage() {
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
                    Privacy Policy
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
                    <strong>Effective Date:</strong> February 25, 2026 | <strong>Version:</strong> v2.0
                  </p>

                  <p>
                    4 Seasons Golf Tour (hereinafter &quot;the Company&quot;) considers the protection of customers&apos; personal information very important and complies with privacy regulations under the Act on Promotion of Information and Communications Network Utilization and Information Protection and the Privacy Guidelines established by the Ministry of Information and Communication.
                  </p>

                  {/* Section 1 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">1. Items of Personal Information Collected and Collection Method</h2>
                    <p className="mb-3">The Company collects the following personal information for membership registration and consultation:</p>
                    
                    <div className="ml-4 space-y-3">
                      <div>
                        <p className="font-semibold text-white">For Golf Tour Inquiries:</p>
                        <ul className="list-disc ml-5 mt-1 space-y-1">
                          <li><strong>Required items:</strong> Travel itinerary, expected number of people, desired region, desired country, name, contact information, email address, tour type, type of golf course, hotel/golf course level, meal level, room level, whether to use a single room</li>
                          <li><strong>Optional:</strong> Affiliation/Organization Name, Other Requests</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-semibold text-white">When Inquiring About Golf Tours:</p>
                        <ul className="list-disc ml-5 mt-1 space-y-1">
                          <li><strong>Required fields:</strong> Author, Email, Password</li>
                          <li><strong>Optional:</strong> None</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">2. Purpose of Collection and Use of Personal Information</h2>
                    <p className="mb-2">The Company uses the collected personal information for the following purposes:</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Performance of contracts for service provision and settlement of fees for service provision</li>
                      <li>Content provision, purchase and payment, financial transaction identity verification, and financial services</li>
                      <li>Identity verification, personal identification, prevention of fraudulent use by bad members and unauthorized use, confirmation of intent to join, age verification, complaint handling, delivery of notices in accordance with the use of membership services</li>
                    </ul>
                    <p className="mt-3 text-sm italic">Note: When traveling on a premium basis, the single room charge may vary depending on the travel date and country. Please inquire for details.</p>
                  </div>

                  {/* Section 3 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">3. Retention and Use Period of Personal Information</h2>
                    <p className="mb-2">In principle, once the purpose of collecting and using personal information has been achieved, the information is destroyed without delay. However, in accordance with the Commercial Act and related laws such as the Act on Consumer Protection in E-commerce, the information will be retained for a certain period of time:</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Records of consumer complaints or dispute resolution: 3 years</li>
                      <li>Records of collection/processing and use of credit information: 3 years</li>
                      <li>Records of payment and supply of goods: 5 years</li>
                      <li>Records of contracts or subscription cancellations: 5 years</li>
                      <li>Records regarding display/advertising: 6 months</li>
                      <li>If collected for temporary purposes such as surveys or events: At the end of the survey or event</li>
                    </ul>
                  </div>

                  {/* Section 4 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">4. Personal Information Destruction Procedures and Methods</h2>
                    <p className="mb-3">In principle, the Company destroys personal information without delay after the purpose of collection and use of the information has been achieved. The destruction procedures and methods are as follows:</p>
                    
                    <div className="ml-4 space-y-3">
                      <div>
                        <p className="font-semibold text-white">Destruction Procedure:</p>
                        <p>The information you enter to use the service will be transferred to a separate database (or, in the case of paper, stored in a separate filing cabinet) after the purpose has been achieved. It will be stored for a specified period of time in accordance with internal policies and other relevant laws and regulations for information protection purposes before being destroyed. Personal information transferred to a separate database will not be used for any purpose other than its retention, except as required by law.</p>
                      </div>
                      
                      <div>
                        <p className="font-semibold text-white">Destruction Method:</p>
                        <ul className="list-disc ml-5 mt-1 space-y-1">
                          <li>Personal information printed on paper: Shred or incinerate</li>
                          <li>Personal information stored in electronic file format: Deleted using a technical method that renders the records unrecoverable</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Section 5 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">5. Provision of Personal Information to Third Parties</h2>
                    <p className="mb-2">In principle, users&apos; personal information will not be provided to external parties. However, exceptions may be made in the following cases:</p>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>In cases where users have given prior consent: Before collecting or providing information, we will inform you of who the business partner is, what information is needed and why, and how and until when it will be protected/managed, and obtain your consent.</li>
                      <li>Personal information will be provided to domestic/international airlines, cruise lines, rental companies, and hotels for boarding planes, ship boarding, car rentals, and hotel check-in.</li>
                      <li>In cases where there is a request from an investigative agency in accordance with the provisions of the law or in accordance with the procedures and methods stipulated by the law for investigative purposes.</li>
                    </ul>
                  </div>

                  {/* Section 6 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">6. Entrustment of Handling of Personal Information</h2>
                    <p>To ensure smooth business operations, if we entrust the processing of a user&apos;s personal information, we will notify the recipient (hereinafter referred to as the &quot;trustee&quot;) and the details of the entrusted work in advance.</p>
                  </div>

                  {/* Section 7 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">7. Rights of Users and Legal Representatives and Methods of Exercising Them</h2>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>The Company does not allow membership registration or collect personal information from children under the age of 14.</li>
                      <li>Users can view or modify their registered personal information at any time and may also request withdrawal of consent (cancellation of membership).</li>
                      <li>To view or edit your personal information, log in and go to My Page and select &quot;Change Personal Information.&quot; To cancel your subscription (withdraw consent), go to My Page or contact us via email. We will take action without delay after verifying your identity.</li>
                      <li>If you request correction of errors in your personal information, we will not use or provide the personal information until the correction is complete.</li>
                      <li>The Company processes personal information that has been terminated or deleted at the request of the user in accordance with the provisions of &quot;Retention and Use Period of Personal Information Collected by the Company.&quot;</li>
                    </ul>
                  </div>

                  {/* Section 8 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">8. Matters Concerning the Installation/Operation and Refusal of Automatic Personal Information Collection Devices</h2>
                    <p className="mb-3">The Company uses &quot;cookies&quot; to periodically store and retrieve user information. Cookies are very small text files that the server used to operate the website sends to your browser and are stored on your computer&apos;s hard drive.</p>
                    
                    <div className="ml-4 space-y-3">
                      <div>
                        <p className="font-semibold text-white">Purpose of Use of Cookies:</p>
                        <p>Target marketing and personalized services provided through analysis of access frequency and visit time of members and non-members, identification of user preferences and areas of interest, tracking of user activity, and identification of participation in various events and number of visits.</p>
                      </div>
                      
                      <div>
                        <p className="font-semibold text-white">How to Reject Cookie Settings:</p>
                        <p>You can configure your web browser to accept all cookies, notify you when a cookie is set, or reject all cookies. However, if you refuse to install cookies, you may experience difficulties in receiving services.</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 9 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">9. Contact Information for the Personal Information Manager</h2>
                    <p className="mb-3">You may report any privacy-related complaints arising while using the Company&apos;s services to the personal information manager or the relevant department. The Company will provide a prompt and sufficient response to users&apos; reports.</p>
                    <p className="mb-2">For other inquiries or reports regarding personal information infringements, please contact the following organizations:</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Personal Information Infringement Report Center (www.118.or.kr / 118)</li>
                      <li>Information Protection Mark Certification Committee (www.eprivacy.or.kr / 02-580-0533~4)</li>
                      <li>Supreme Prosecutors&apos; Office, High-Tech Crime Investigation Division (www.spo.go.kr / 02-3480-2000)</li>
                      <li>National Police Agency Cyber Terror Response Center (www.ctrc.go.kr / 02-392-0330)</li>
                    </ul>
                  </div>

                  {/* Section 10 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">10. Technical/Administrative Protection Measures for Personal Information</h2>
                    <p className="mb-3">When handling users&apos; personal information, the Company implements the following technical/administrative measures to ensure the security of personal information and prevent it from being lost, stolen, leaked, altered, or damaged:</p>
                    <ul className="list-disc ml-5 space-y-2">
                      <li><strong>Password encryption:</strong> Member ID passwords are encrypted, stored, and managed, and only the member knows them. Confirmation and modification of personal information can only be done by the member who knows the password.</li>
                      <li><strong>Measures against hacking:</strong> The Company is doing its best to prevent personal information from being leaked or damaged by hacking or computer viruses. Data is regularly backed up, and the latest anti-virus programs are used. Encrypted communication (SSL) is used to ensure the safe transmission of personal information over the network.</li>
                      <li><strong>Minimization and training of handling staff:</strong> The Company limits the handling of personal information to only those in charge, who are given separate passwords that are regularly updated. Regular training emphasizes compliance with the Company&apos;s privacy policy.</li>
                      <li><strong>Dedicated personal information protection organization:</strong> We hold in-house personal information protection meetings to ensure compliance with the Company&apos;s privacy policy and promptly address any issues identified.</li>
                    </ul>
                  </div>

                  {/* Section 11 */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">11. Duty to Notify</h2>
                    <p>If there are any additions, deletions, or modifications to the current privacy policy, we will notify you through the &quot;Notices&quot; section of the website at least 7 days in advance. However, if there are any significant changes to user rights, such as the collection and use of personal information or provision to third parties, we will notify you at least 30 days in advance.</p>
                  </div>

                  {/* Version Info */}
                  <div className="border-t border-white/20 pt-4 mt-8">
                    <p className="text-sm text-white/60">
                      <strong>Privacy Policy Version Number:</strong> v2.0<br />
                      <strong>Announcement Date:</strong> February 25, 2026<br />
                      <strong>Effective Date:</strong> February 25, 2026
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
