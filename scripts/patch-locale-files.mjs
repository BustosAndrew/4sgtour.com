import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const BASE = resolve(process.cwd(), 'messages')

const newBookingKeys = {
  proceedToPayment: { en: "Proceed to Payment", ko: "결제 진행", de: "Zur Zahlung" },
  depositDue: { en: "30% deposit due at booking:", ko: "예약 시 30% 보증금:", de: "30% Anzahlung bei Buchung:" },
  bookingConfirmed: { en: "Booking Confirmed!", ko: "예약 확정!", de: "Buchung bestätigt!" },
  bookingConfirmedMessage: {
    en: "Thank you for your booking! We've sent a confirmation email with all the details.",
    ko: "예약해 주셔서 감사합니다! 모든 세부 정보가 담긴 확인 이메일을 보내드렸습니다.",
    de: "Vielen Dank für Ihre Buchung! Wir haben Ihnen eine Bestätigungs-E-Mail mit allen Details gesendet."
  },
  createAccountPrompt: {
    en: "Create an account to manage your booking",
    ko: "계정을 만들어 예약을 관리하세요",
    de: "Erstellen Sie ein Konto, um Ihre Buchung zu verwalten"
  },
  createAccountDescription: {
    en: "Sign up to track your trip details, communicate with our team, and access exclusive member benefits.",
    ko: "회원가입하여 여행 상세 정보를 확인하고, 저희 팀과 소통하며 독점 회원 혜택을 누리세요.",
    de: "Registrieren Sie sich, um Ihre Reisedetails zu verfolgen, mit unserem Team zu kommunizieren und exklusive Mitgliedervorteile zu genießen."
  },
  createAccount: { en: "Create Account", ko: "계정 만들기", de: "Konto erstellen" },
  returnToTrip: { en: "Return to Trip Details", ko: "여행 상세로 돌아가기", de: "Zurück zu Reisedetails" },
}

const checkoutSection = {
  en: {
    contactInformation: "Contact Information",
    guestContactPrompt: "Please provide your contact details for booking confirmation.",
    memberContactPrompt: "Confirm your contact details for this booking.",
    fullName: "Full Name",
    emailAddress: "Email Address",
    phoneNumber: "Phone Number",
    paymentMethod: "Payment Method",
    depositRequired: "A 30% deposit ({amount}) is required to confirm your booking.",
    bankTransfer: "Bank Transfer (ACH)",
    noProcessingFee: "No processing fee",
    creditDebitCard: "Credit/Debit Card",
    processingFee: "+4% processing fee ({fee})",
    paymentSummary: "Payment Summary",
    deposit: "30% Deposit",
    cardProcessingFee: "Card Processing Fee (4%)",
    total: "Total",
    continueToPayment: "Continue to Payment",
    backToBookingDetails: "Back to booking details",
    backToPaymentOptions: "Back to payment options",
    noAccountPrompt: "Don't have an account?",
    signUp: "Sign up",
    manageBookings: "to manage your bookings and communicate with our team.",
    trip: "Trip",
    package: "Package",
    travelDates: "Travel Dates",
    roomType: "Room Type",
    packageTotal: "Package Total",
    depositDue: "Deposit Due (30%)",
  },
  ko: {
    contactInformation: "연락처 정보",
    guestContactPrompt: "예약 확인을 위해 연락처 정보를 입력해 주세요.",
    memberContactPrompt: "이 예약에 대한 연락처 정보를 확인해 주세요.",
    fullName: "성명",
    emailAddress: "이메일 주소",
    phoneNumber: "전화번호",
    paymentMethod: "결제 방법",
    depositRequired: "예약 확정을 위해 30% 보증금({amount})이 필요합니다.",
    bankTransfer: "계좌이체 (ACH)",
    noProcessingFee: "수수료 없음",
    creditDebitCard: "신용/체크카드",
    processingFee: "+4% 결제 수수료 ({fee})",
    paymentSummary: "결제 요약",
    deposit: "30% 보증금",
    cardProcessingFee: "카드 결제 수수료 (4%)",
    total: "합계",
    continueToPayment: "결제 계속",
    backToBookingDetails: "예약 상세로 돌아가기",
    backToPaymentOptions: "결제 방법 선택으로 돌아가기",
    noAccountPrompt: "계정이 없으신가요?",
    signUp: "회원가입",
    manageBookings: "하여 예약을 관리하고 저희 팀과 소통하세요.",
    trip: "여행",
    package: "패키지",
    travelDates: "여행 날짜",
    roomType: "객실 유형",
    packageTotal: "패키지 합계",
    depositDue: "보증금 (30%)",
  },
  de: {
    contactInformation: "Kontaktinformationen",
    guestContactPrompt: "Bitte geben Sie Ihre Kontaktdaten für die Buchungsbestätigung an.",
    memberContactPrompt: "Bestätigen Sie Ihre Kontaktdaten für diese Buchung.",
    fullName: "Vollständiger Name",
    emailAddress: "E-Mail-Adresse",
    phoneNumber: "Telefonnummer",
    paymentMethod: "Zahlungsmethode",
    depositRequired: "Eine 30% Anzahlung ({amount}) ist erforderlich, um Ihre Buchung zu bestätigen.",
    bankTransfer: "Banküberweisung (ACH)",
    noProcessingFee: "Keine Bearbeitungsgebühr",
    creditDebitCard: "Kredit-/Debitkarte",
    processingFee: "+4% Bearbeitungsgebühr ({fee})",
    paymentSummary: "Zahlungsübersicht",
    deposit: "30% Anzahlung",
    cardProcessingFee: "Kartenbearbeitungsgebühr (4%)",
    total: "Gesamt",
    continueToPayment: "Weiter zur Zahlung",
    backToBookingDetails: "Zurück zu Buchungsdetails",
    backToPaymentOptions: "Zurück zu Zahlungsoptionen",
    noAccountPrompt: "Noch kein Konto?",
    signUp: "Registrieren",
    manageBookings: "um Ihre Buchungen zu verwalten und mit unserem Team zu kommunizieren.",
    trip: "Reise",
    package: "Paket",
    travelDates: "Reisedaten",
    roomType: "Zimmertyp",
    packageTotal: "Paketpreis gesamt",
    depositDue: "Anzahlung fällig (30%)",
  },
}

for (const locale of ['en', 'ko', 'de']) {
  const filePath = resolve(BASE, `${locale}.json`)
  const data = JSON.parse(readFileSync(filePath, 'utf8'))

  // Add new booking keys
  for (const [key, vals] of Object.entries(newBookingKeys)) {
    if (!data.booking[key]) {
      data.booking[key] = vals[locale]
    }
  }

  // Add checkout section
  if (!data.checkout) {
    data.checkout = checkoutSection[locale]
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`[v0] Patched ${locale}.json`)
}
