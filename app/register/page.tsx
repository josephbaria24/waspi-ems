'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RegistrationForm } from '@/components/forms/registration-form'

const typeStyle = { fontFamily: 'Aeonik, Geist, -apple-system, BlinkMacSystemFont, sans-serif' }

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#F7FBF8]" style={typeStyle}>
      <div className="mx-auto w-[min(96vw,1180px)] px-4 py-6 sm:px-6 sm:py-10">
        <div className="relative mb-6 overflow-hidden rounded-3xl bg-[#0B1F14] px-5 py-6 text-white sm:px-7">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#00D47E]/25" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-40 rounded-full bg-[#017C7C]/40" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <img
                src="/logo.png"
                alt="WASPI logo"
                className="h-12 w-12 rounded-2xl bg-[#00D47E] object-contain p-1"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00D47E]">
                  Membership
                </p>
                <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Join WASPI</h1>
                <p className="mt-1 max-w-md text-sm text-white/70">
                  Complete the steps below to register.
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>

        <RegistrationForm />
      </div>
    </main>
  )
}
