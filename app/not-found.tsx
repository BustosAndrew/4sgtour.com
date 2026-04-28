import { redirect } from 'next/navigation'

export default function NotFound() {
  // Redirect any 404 to the site root
  redirect('/')
}
