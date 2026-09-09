'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RegistrationForm } from '@/components/forms/registration-form'

const typeStyle = { fontFamily: 'Aeonik, Geist, -apple-system, BlinkMacSystemFont, sans-serif' }

export default function RegisterPage() {
  return (
    <main className="dot-grid-bg min-h-screen bg-white" style={typeStyle}>
      <div className="mx-auto w-[min(96vw,1180px)] px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E8EAEB] bg-white px-4 py-2 text-sm font-medium text-[#1E1E1E] shadow-sm transition-colors hover:bg-[#F2F4F4]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mb-6 mt-8 text-center">
          <img
            src="/logo.png"
            alt="WASPI logo"
            className="mx-auto mb-4 h-12 w-12 rounded-xl object-contain"
          />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#00D47E]">
            Membership
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1E1E1E] sm:text-4xl">
            Join WASPI
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8D959D]">
            Complete the steps below to register. Fields stay compact so the form is easier to scan.
          </p>
        </div>

        <RegistrationForm />
      </div>
    </main>
  )
}
