import { Suspense } from "react"
import EventRegisterPage from "@/components/register-page"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EventRegisterPage />
    </Suspense>
  )
}
