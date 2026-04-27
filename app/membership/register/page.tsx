"use client";

import { RegistrationForm } from "@/components/forms/registration_form";

export default function MembershipRegisterPage() {
    return (
        <main className="min-h-screen bg-[#017C7C] bg-gradient-to-br from-[#017C7C] via-[#018c8c] to-[#016c6c]">
            <div className="container relative z-10 mx-auto px-4 py-12 md:py-24 flex flex-col items-center">
                <div className="w-full max-w-4xl">
                    <div className="text-center mb-10 text-white">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
                            Join <span className="text-accent italic">WASPI</span>
                        </h1>
                        <p className="text-lg text-white/80 max-w-2xl mx-auto">
                            Become part of the Women in Architecture, Science and Project Initiatives (WASPI) community. Choose your membership plan and start your journey today.
                        </p>
                    </div>

                    <RegistrationForm
                        onSuccess={() => {
                            // You can redirect or show a different success state here
                            // The form already has a toast
                        }}
                    />
                </div>
            </div>
        </main>
    );
}
