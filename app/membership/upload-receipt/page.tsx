import { Suspense } from "react"
import UploadReceiptPage from "./upload-receipt-client"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <UploadReceiptPage />
    </Suspense>
  )
}
