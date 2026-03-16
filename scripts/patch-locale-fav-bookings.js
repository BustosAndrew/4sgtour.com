import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const messagesDir = join(__dirname, '..', 'messages')

const newKeys = {
  en: {
    favorites: {
      title: "My Favorites",
      empty: "You haven't added any favorites yet.",
      browseTrips: "Browse Trips"
    },
    bookings: {
      title: "My Inquiries",
      inquirySubmitted: "Inquiry Submitted!",
      inquirySubmittedMessage: "Your booking inquiry has been successfully submitted. We'll contact you shortly to confirm the details.",
      empty: "You haven't submitted any booking inquiries yet.",
      browseDestinations: "Browse Destinations",
      start: "Start:",
      end: "End:",
      duration: "Duration:",
      days: "days",
      rounds: "Rounds:",
      submitted: "Submitted:",
      notes: "Notes:",
      status: {
        confirmed: "Confirmed",
        inProgress: "In Progress",
        cancelled: "Cancelled",
        pending: "Pending"
      }
    }
  },
  ko: {
    favorites: {
      title: "즐겨찾기",
      empty: "아직 즐겨찾기에 추가한 여행이 없습니다.",
      browseTrips: "여행 둘러보기"
    },
    bookings: {
      title: "나의 문의",
      inquirySubmitted: "문의가 접수되었습니다!",
      inquirySubmittedMessage: "예약 문의가 성공적으로 접수되었습니다. 곧 세부 사항을 확인하기 위해 연락드리겠습니다.",
      empty: "아직 예약 문의를 제출하지 않았습니다.",
      browseDestinations: "여행지 둘러보기",
      start: "출발:",
      end: "도착:",
      duration: "기간:",
      days: "일",
      rounds: "라운드:",
      submitted: "접수일:",
      notes: "메모:",
      status: {
        confirmed: "확정",
        inProgress: "진행 중",
        cancelled: "취소됨",
        pending: "대기 중"
      }
    }
  },
  de: {
    favorites: {
      title: "Meine Favoriten",
      empty: "Sie haben noch keine Favoriten hinzugefügt.",
      browseTrips: "Reisen durchsuchen"
    },
    bookings: {
      title: "Meine Anfragen",
      inquirySubmitted: "Anfrage eingereicht!",
      inquirySubmittedMessage: "Ihre Buchungsanfrage wurde erfolgreich eingereicht. Wir werden uns in Kürze mit Ihnen in Verbindung setzen, um die Details zu bestätigen.",
      empty: "Sie haben noch keine Buchungsanfragen eingereicht.",
      browseDestinations: "Reiseziele durchsuchen",
      start: "Beginn:",
      end: "Ende:",
      duration: "Dauer:",
      days: "Tage",
      rounds: "Runden:",
      submitted: "Eingereicht:",
      notes: "Notizen:",
      status: {
        confirmed: "Bestätigt",
        inProgress: "In Bearbeitung",
        cancelled: "Storniert",
        pending: "Ausstehend"
      }
    }
  }
}

for (const [locale, keys] of Object.entries(newKeys)) {
  const filePath = join(messagesDir, `${locale}.json`)
  const data = JSON.parse(readFileSync(filePath, 'utf-8'))

  for (const [section, values] of Object.entries(keys)) {
    if (!data[section]) {
      data[section] = values
      console.log(`[${locale}] Added section: ${section}`)
    } else {
      console.log(`[${locale}] Section already exists, skipping: ${section}`)
    }
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2))
  console.log(`[${locale}] Saved.`)
}

console.log('Done patching locale files.')
