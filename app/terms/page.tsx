import { SiteHeaderWrapper } from "@/components/site-header-wrapper"
import { SiteFooter } from "@/components/site-footer"
import { GlassCard } from "@/components/ui/glass-card"

export default async function TermsPage() {
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
                    Terms of Service
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
                    <h2 className="text-lg font-bold text-white mb-3">Notes on Reservations</h2>
                    <p className="mb-3">When making a tour reservation, you must pay a deposit of 40% of the total tour price.</p>
                    <ul className="list-disc ml-5 space-y-3">
                      <li>If the minimum number of participants (2-4 people) is not met, the tour will be canceled. The exact departure date will be confirmed approximately 2-7 days in advance. Our travel agency will contact you first to confirm the departure date. All reservations must be confirmed by the manager.
                        <p className="mt-2 text-sm italic">Note: Same-day tours cannot be booked on the same day. Reservations for the day before the tour can only be made by phone (not online). Reservations must be made by 6:00 PM closing time for each branch.</p>
                      </li>
                      <li>The vehicle may change depending on the number of passengers:
                        <ul className="list-none ml-4 mt-2 space-y-1 text-sm">
                          <li>2-4 passengers → SUV</li>
                          <li>5 passengers → 7-seater van</li>
                          <li>8 passengers → 12-seater van</li>
                          <li>11+ passengers → 15-seater van</li>
                          <li>13+ passengers → Mid-size bus</li>
                          <li>20+ passengers → Large bus</li>
                        </ul>
                      </li>
                      <li>Travel expenses must be paid by credit card or cash. Personal checks must be paid at least five days prior to departure.</li>
                      <li>The hotel listed on the schedule may be changed to a hotel of the same class depending on local circumstances.</li>
                      <li>The entire schedule and optional tours listed on the schedule may be adjusted depending on local conditions, weather on the day, and the guide&apos;s discretion.</li>
                      <li>The United States has a culture of tipping. The basic per-person guide and driver service fee is $20 per day, and the basic tip for hotel/restaurant tips and other courtesy tips is $2.</li>
                      <li>Please make sure to check the documents (passport, ID, etc.) that you must bring with you when entering or exiting Canada and other border crossing areas before departure.</li>
                    </ul>
                  </div>

                  {/* Additional Cost for Single Room */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">Additional Cost for Single Room</h2>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>The product you have reserved is based on 2 people per room, regardless of adult or child. If 3 or 4 people use a room, a discount of $20 per night will be applied to the third and fourth guests. (Up to 4 people per room)</li>
                      <li>If you are staying alone in a room, a single room charge of $80 per night will be applied. (This may change due to hotel price fluctuations.)</li>
                      <li>If you make a reservation for 2 adults/children and use 1 room, the child rate does not apply.</li>
                    </ul>
                    <p className="mt-3 text-sm italic">Note: When traveling on a premium basis, the single room charge may vary depending on the travel date and country. Please inquire for details.</p>
                  </div>

                  {/* Passport/Visa Information */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">Passport/Visa Information</h2>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>You must carry your passport with you when you depart for your trip, and your passport must be valid for at least 6 months.</li>
                      <li>The country you wish to travel to may require a visa. When traveling to a country that requires a visa, please obtain a visa through the proper procedures.</li>
                    </ul>
                  </div>

                  {/* General Guidance */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">General Guidance</h2>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>The above schedule may be subject to change depending on weather and traffic conditions.</li>
                      <li>Please refrain from deviating from group activities. Neither the headquarters nor the guides are responsible for any accidents resulting from individual deviations. In unavoidable circumstances, please consult with your guide and follow his or her instructions.</li>
                      <li>Toothpaste, toothbrushes, and slippers are not provided at hotels in the United States. Just like personal medications, you must prepare these yourself.</li>
                      <li>Most American buses don&apos;t have curtains or seat belts. You can&apos;t walk around on the bus while it&apos;s in motion. Bringing food, drinking, or smoking is also prohibited. Water (in bottles or cups with lids) is permitted.</li>
                      <li>When temperatures exceed 85°F (30°C) in the summer, it can be difficult to initially expect comfortable conditions upon boarding the bus. All diesel vehicles are subject to strict regulations, and idling for more than three minutes carries a high penalty, with an initial fine starting at $800.</li>
                      <li>Most hotels have swimming pools, so it is recommended to bring a swimsuit.</li>
                      <li>Please take extra care of your personal belongings in airport waiting areas or hotel lobbies.</li>
                      <li>Travel agencies share services with multiple companies and connect travelers with services such as hotel accommodations, transportation, and sightseeing activities. All services operate under contractual terms.</li>
                    </ul>
                    <p className="mt-3 text-sm">The travel agency and its employees, agents, representatives and appointed persons are not responsible for any injury, loss, damage, accident or any other cause whatsoever, including negligence of duty, defects, fault of other companies or wrongful acts of others. Individuals planning a trip can purchase travel insurance, which will cover expenses, loss, and personal losses related to the trip.</p>
                  </div>

                  {/* Cancellation Policy */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">Cancellation Policy</h2>
                    <p className="mb-3">Travelers may cancel their own trips before departure. Cancellation fees are as follows:</p>
                    
                    <div className="ml-4 space-y-4">
                      <div>
                        <p className="font-semibold text-white">Headquarters/Los Angeles Branch Regulations</p>
                        <p className="text-sm mb-2">When making a tour reservation, you must pay a deposit of 40% of the total tour price.</p>
                        
                        <p className="font-medium text-white/90 mt-3">Same-Day Tours & Tours 1 Night or More:</p>
                        <ul className="list-disc ml-5 mt-1 space-y-1 text-sm">
                          <li>50% cancellation fee - up to 7 days prior to departure</li>
                          <li>60% cancellation fee - up to 5 days prior to departure</li>
                          <li>80% cancellation fee - 2-4 days prior to departure</li>
                          <li>100% cancellation fee - 1 day prior to departure</li>
                          <li>No refund for cancellation on the day of departure (including no-show)</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-semibold text-white">LA Branch Regulations - Western US Tour</p>
                        <ul className="list-disc ml-5 mt-1 space-y-1 text-sm">
                          <li>20% cancellation fee - up to one week prior to departure</li>
                          <li>50% cancellation fee - up to 3 days prior to departure</li>
                          <li>80% cancellation fee - 1 day prior to departure</li>
                          <li>No refund for cancellation on the day of departure</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-white/5 rounded-lg text-sm space-y-2">
                      <p>• The company is not responsible for any injuries, illnesses, deaths, loss, or cancellations/changes to schedules due to personal negligence, pre-existing conditions, or natural disasters.</p>
                      <p>• Western US and other tours: Full payment is required up to 2 weeks prior to departure.</p>
                      <p>• For reservations made the day before: Full amount must be paid. No refunds will be given in case of cancellation.</p>
                      <p>• Cancellation due to insufficient participants: Notification will be given at least 2 days prior, and full travel expenses and deposit will be refunded.</p>
                      <p>• If refund is made by company check for credit card payment, a 4% credit card fee will be added.</p>
                      <p>• If you refund a credit card payment after the payment date (after 12:00 AM Eastern Time), an 8% credit card fee will be charged. No fee on the day of payment (US time).</p>
                    </div>
                  </div>

                  {/* Room Information */}
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">Room Information</h2>
                    <ul className="list-disc ml-5 space-y-2">
                      <li>Hotels in the Americas have two double-sized beds as standard, and extra beds cannot be added in accordance with fire safety laws.</li>
                      <li>If the hotel listed on the itinerary cannot be reserved due to hotel circumstances, the hotel may be replaced with a hotel of the same class.</li>
                      <li>Occasionally, if the hotel room is not available, a king bed and an extra bed may be provided.</li>
                      <li>The hotel does not provide disposable items. Please bring your own slippers and toiletries.</li>
                    </ul>
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
