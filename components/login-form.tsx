"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/events"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ Check existing session
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session && redirectTo && redirectTo !== "/login") {
        router.replace(redirectTo)
      } else {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [router, redirectTo])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (data?.user) {
      router.push(redirectTo || "/events")
    }
  }

  // 🕒 Prevent flicker while checking session
  if (checkingSession) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Checking session...</p>
      </main>
    )
  }

  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md">
        <Card
          className="shadow-2xl border-none rounded-2xl overflow-hidden"
          style={{ backgroundColor: "#ffffff", backdropFilter: "blur(10px)" }}
        >
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img
                src="https://waspi.ph/wp-content/uploads/2024/09/cropped-WASPI-Logo-Header-2024-515x84.png"
                alt="WASPI Logo"
                className="w-80 h-auto object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              WASPI Event Management System
            </CardTitle>
            <CardDescription className="text-gray-500 mt-1">
              Login to your account to manage events and attendees
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            <form onSubmit={handleLogin} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                  />
                </Field>

                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <a
                      href="#"
                      className="text-sm text-blue-700 hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rounded-lg border-gray-300 pr-10 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                {error && (
                  <p className="text-red-600 text-sm mt-2 text-center">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-2 text-white font-semibold rounded-lg transition-all duration-200"
                  style={{
                    background: "linear-gradient(to right, #16a34a, #2563eb)",
                  }}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>

                <FieldDescription className="text-center text-gray-600 mt-3">
                  Don&apos;t have an account?{" "}
                  <a href="/signup" className="text-blue-600 hover:underline">
                    Sign up
                  </a>
                </FieldDescription>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-600 mt-6 text-sm">
          © {new Date().getFullYear()} WASPI Event Management System
        </p>
      </div>
    </main>
  )
}
