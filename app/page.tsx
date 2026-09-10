import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LandingSection } from '@/components/landing-section'
import MagicBento, { type BentoCardProps } from '@/components/MagicBento'
import GradualBlur from '@/components/GradualBlur'
import ScrollVelocity from '@/components/ScrollVelocity'
import ScrollFloat from '@/components/ScrollFloat'
import MergedShape from '@/components/MergedShape'
import BorderGlow from '@/components/BorderGlow'
import StickyCardNav from '@/components/StickyCardNav'

const MARQUEE_LINE_1 = (
  <span className="inline-flex flex-wrap items-baseline gap-x-0.5">
    <span className="text-[#1E1E1E]">Workplace Advocates on Safety · </span>
    <span className="text-[#00D47E]">Safe work & safe workplaces</span>
    <span className="text-[#1E1E1E]"> · Member network · Prevention culture ·</span>
  </span>
)

const MARQUEE_LINE_2 = (
  <span className="inline-flex flex-wrap items-baseline gap-x-0.5">
    <span className="text-[#1E1E1E]">Protecting Filipino workers · </span>
    <span className="text-[#00D47E]">OSH advocacy nationwide</span>
    <span className="text-[#1E1E1E]"> · Unified safety action · Join WASPI ·</span>
  </span>
)

const MEMBERSHIP_BENTO_CARDS: BentoCardProps[] = [
  {
    color: '#ffffff',
    title: 'Verified digital ID',
    description: 'Official WASPI membership identity for events and coordination.',
    label: 'Identity',
    image: '/card6.png',
  },
  {
    color: '#ffffff',
    title: 'Learning access',
    description: 'Webinars, talks, and practical workplace safety sessions.',
    label: 'Learning',
    image: '/card5.png',
  },
  {
    color: '#ffffff',
    title: 'Policy updates',
    description: 'Curated safety regulation and compliance updates.',
    label: 'Compliance',
    image: '/card4.png',
  },
  {
    color: '#ffffff',
    title: 'Industry network',
    description: 'Connect with advocates and organizations across sectors.',
    label: 'Network',
    image: '/card2.png',
  },
  {
    color: '#ffffff',
    title: 'Event invitations',
    description: 'Priority access to WASPI conferences and chapter meetings.',
    label: 'Events',
    image: '/card3.png',
  },
  {
    color: '#ffffff',
    title: 'Resource kits',
    description: 'Templates and guides to improve safety programs at work.',
    label: 'Resources',
    image: '/card1.png',
  },
]

const palette = {
  green: '#00D47E',
  dark: '#1E1E1E',
  gray: '#8D959D',
  light: '#F2F4F4',
}

const typeStyle = { fontFamily: 'Aeonik, Geist, -apple-system, BlinkMacSystemFont, sans-serif' }

export default function Home() {
  return (
    <main className="dot-grid-bg mx-auto min-h-screen w-[98vw] bg-white p-0 sm:w-[90vw]" style={typeStyle}>
      <StickyCardNav />
      <div className="dot-grid-bg mx-auto w-full max-w-none overflow-hidden bg-white shadow-none">

        <section className="relative min-h-[560px] px-1 pt-22 pb-10 sm:px-10 sm:pt-24 sm:pb-16 lg:px-14">
          <BorderGlow
            className="rounded-[24px] shadow-[0_6px_18px_rgba(0,0,0,0.14)] sm:rounded-[32px]"
            glowColor="145 70 58"
            borderRadius={32}
            backgroundColor="transparent"
            fillOpacity={0.25}
            colors={['#22c55e', '#14b8a6', '#38bdf8']}
          >
            <MergedShape className="relative min-h-[460px] md:min-h-[500px]" cutoutClassName="hidden xl:block">
              <Image
                src="/waspi-event.png"
                alt="WASPI conference event"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 98vw, (max-width: 1280px) 90vw, 1120px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
              <GradualBlur
                target="parent"
                position="bottom"
                height="7rem"
                strength={2}
                divCount={5}
                curve="bezier"
                exponential
                opacity={1}
                zIndex={8}
              />
              <div className="relative z-10">
                <div className="px-4 pb-6 pt-10 sm:px-10 sm:pb-8 sm:pt-16 lg:px-14 xl:pb-16">
                  <div className="w-full max-w-none space-y-5 sm:max-w-3xl">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/85">Workplace safety membership</p>
                    <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                      Protecting Filipino Workers Through Unified Safety Action
                    </h1>
                    <p className="w-full max-w-none text-sm leading-relaxed text-white/80 sm:max-w-xl sm:text-base">
                      A non-stock, non-profit, non-government occupational safety and health advocacy group of
                      professionals and entrepreneurs passionate about Safe Work and Safe Workplaces.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-6 sm:pt-8">
                      <Link href="/register">
                        <Button
                          className="rounded-full px-7 py-5 text-sm font-semibold text-black shadow-none hover:brightness-95"
                          style={{ backgroundColor: palette.green }}
                        >
                          Become a Member
                        </Button>
                      </Link>
                      <Link href="/membership/portal">
                        <Button
                          variant="outline"
                          className="rounded-full border-white/40 bg-white/15 px-7 py-5 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-xl backdrop-saturate-150 hover:bg-white/25 hover:text-white"
                        >
                          Member Login
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-20 px-3 pb-4 sm:px-8 sm:pb-6 xl:pointer-events-none xl:absolute xl:inset-x-auto xl:bottom-0 xl:right-0 xl:w-[min(52%,520px)] xl:px-0 xl:pb-0">
                <div className="dot-grid-bg pointer-events-auto grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-3 sm:gap-5 sm:p-5 xl:rounded-none xl:rounded-tl-[28px] xl:shadow-none">
                  {[
                    ['1.2K+', 'Active members'],
                    ['30+', 'Partner organizations'],
                    ['120+', 'Safety sessions delivered'],
                  ].map(([value, label]) => (
                    <div key={label} className="min-w-0">
                      <p className="text-2xl font-semibold sm:text-3xl" style={{ color: palette.dark }}>{value}</p>
                      <p className="text-sm leading-5" style={{ color: palette.gray }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </MergedShape>
          </BorderGlow>

        </section>

        <div
          role="region"
          aria-label="WASPI advocacy highlights"
          data-marquee-scroll-slow
          className="relative bg-transparent pt-6 pb-4 md:pt-8 md:pb-5"
          style={typeStyle}
        >
          <div className="flex w-full justify-center px-0">
            <ScrollFloat
              animationDuration={1}
              ease="back.inOut(2)"
              scrollStart="center bottom+=50%"
              scrollEnd="bottom bottom-=40%"
              stagger={0.03}
              containerClassName="my-0 mb-3 w-[min(98vw,_100%)] max-w-none overflow-visible px-0 text-center md:mb-6 md:w-[min(92vw,_100%)]"
              textClassName="font-black tracking-[-0.07em]"
              charClassName="waspi-grain-char"
              textStyle={{
                fontSize: 'clamp(3rem, 18vw, min(28vh, 12rem))',
                lineHeight: 1,
              }}
            >
              WASPI
            </ScrollFloat>
          </div>

          {/* Side fade applies only to the marquee, not the title */}
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent)]">
          <ScrollVelocity
            texts={[MARQUEE_LINE_1, MARQUEE_LINE_2]}
            velocity={72}
            numCopies={4}
            damping={50}
            stiffness={400}
            parallaxClassName="py-0.5"
            scrollerClassName="!font-sans !font-semibold !tracking-normal !drop-shadow-none !text-md !leading-snug md:!text-lg md:!leading-normal"
          />
          </div>
        </div>

        <LandingSection
          id="about"
          className="scroll-mt-6 grid gap-7 px-2 pb-14 pt-8 sm:px-10 sm:pt-10 lg:grid-cols-2 lg:px-14"
        >
          <div>
            <p className="text-sm font-medium" style={{ color: palette.green }}>About WASPI</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight" style={{ color: palette.dark }}>
              Building trusted communities around workplace safety.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 sm:text-base" style={{ color: palette.gray }}>
              Workplace Advocates on Safety in the Philippines Inc. (WASPI) was conceptualized on September 12,
              2013 and was granted its Certificate of Incorporation by the Securities and Exchange Commission
              (SEC) on February 21, 2014.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 sm:text-base" style={{ color: palette.gray }}>
              WASPI conducts safety and health awareness forums and OSHE national conventions as avenues for
              exchanging information, current trends, and technological innovations to enhance the safety culture
              in the Philippines.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                'National safety advocacy',
                'Member knowledge sharing',
                'Digital-first membership tools',
                'Community-led initiatives',
              ].map((item) => (
                <div key={item} className="dot-grid-bg rounded-xl border border-[#E8EAEB] px-4 py-3 text-sm" style={{ color: palette.dark }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] md:rounded-3xl">
            <Image
              src="/waspi-team.png"
              alt="WASPI officers and members"
              width={900}
              height={600}
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full object-cover"
            />
          </div>
        </LandingSection>

        <LandingSection
          id="mission"
          className="scroll-mt-6 bg-white px-2 py-14 sm:px-10 lg:px-14"
        >
          <div className="grid gap-5 lg:grid-cols-3">
            <article className="dot-grid-bg rounded-2xl border border-[#E8EAEB] p-6">
              <p className="text-sm font-medium" style={{ color: palette.green }}>Mission</p>
              <p className="mt-3 text-sm leading-7 sm:text-base" style={{ color: palette.gray }}>
                Promote preventative safety and health culture through collaboration and networking with private
                business enterprises and with the government to achieve accident-free, injury-free and
                disease-free workplaces.
              </p>
            </article>

            <article className="dot-grid-bg rounded-2xl border border-[#E8EAEB] p-6">
              <p className="text-sm font-medium" style={{ color: palette.green }}>Vision</p>
              <p className="mt-3 text-sm leading-7 sm:text-base" style={{ color: palette.gray }}>
                To be the trusted strategic partner of government and private enterprises in workplace safety and
                health advocacy.
              </p>
            </article>

            <article className="dot-grid-bg rounded-2xl border border-[#E8EAEB] p-6">
              <p className="text-sm font-medium" style={{ color: palette.green }}>Objectives</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 sm:text-base" style={{ color: palette.gray }}>
                <li>Assist the government in implementing and monitoring OSH standards.</li>
                <li>
                  Promote international cooperation to strengthen prevention culture, knowledge sharing, and best
                  safety practices.
                </li>
              </ul>
            </article>
          </div>
        </LandingSection>

        <LandingSection id="benefits" className="scroll-mt-6 bg-transparent px-2 py-14 sm:px-10 lg:px-14">
          <div className="max-w-3xl">
            <p className="text-sm font-medium" style={{ color: palette.green }}>Membership Benefits</p>
            <h3 className="mt-4 text-3xl font-semibold leading-tight" style={{ color: palette.dark }}>
              Everything members need to lead safer workplaces.
            </h3>
          </div>

          <div className="mt-8 flex w-full justify-center">
            <MagicBento
              cards={MEMBERSHIP_BENTO_CARDS}
              className="w-full max-w-none"
              textAutoHide
              enableStars
              enableSpotlight
              enableBorderGlow
              enableTilt={false}
              enableMagnetism
              clickEffect
              spotlightRadius={250}
              particleCount={8}
              glowColor="22, 163, 92"
              disableAnimations={false}
            />
          </div>
        </LandingSection>

        <LandingSection className="bg-white px-2 py-14 sm:px-10 lg:px-14">
          <div className="max-w-3xl">
            <p className="text-sm font-medium" style={{ color: palette.green }}>Core Values</p>
            <h4 className="mt-3 text-3xl font-semibold leading-tight" style={{ color: palette.dark }}>
              W-A-S-P-I values that guide our advocacy.
            </h4>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              [
                'W - Workplace and Worker Focused',
                'We focus our advocacy on safe work and safe workplaces to strengthen a culture of safety in the country.',
              ],
              [
                'A - Action Oriented',
                'We continuously coordinate and collaborate with other safety organizations to promote preventative safety and health culture.',
              ],
              [
                'S - Shared Care and Concern',
                'We provide technical assistance for workers and entrepreneurs in micro, small, and medium enterprises.',
              ],
              [
                'P - Proactive Professional Development',
                'We believe in continuous advancement of safety, health, and accident prevention technology.',
              ],
              [
                'I - Involved and Informed',
                'We promote international cooperation to share and gain knowledge on accident prevention culture for a safe and happy life.',
              ],
            ].map(([title, desc]) => (
              <article key={title} className="dot-grid-bg rounded-2xl border border-[#E8EAEB] bg-[#F2F4F4] p-5">
                <p className="text-sm font-semibold leading-6" style={{ color: palette.dark }}>{title}</p>
                <p className="mt-3 text-sm leading-6" style={{ color: palette.gray }}>{desc}</p>
              </article>
            ))}
          </div>
        </LandingSection>

        <LandingSection id="contact" className="scroll-mt-6 bg-[#1E1E1E] rounded-t-3xl px-2 py-14 text-white sm:px-10 lg:px-14">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-medium" style={{ color: palette.green }}>Ready to join?</p>
              <h4 className="mt-3 text-3xl font-semibold leading-tight">
                Support zero harm and stronger safety culture with WASPI.
              </h4>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                Become part of a national network committed to practical workplace safety. Start with online
                registration and access your member portal right away.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register">
                  <Button
                    className="rounded-full px-7 py-5 font-semibold text-black shadow-none hover:brightness-95"
                    style={{ backgroundColor: palette.green }}
                  >
                    Register now
                  </Button>
                </Link>
                <Link href="/login?app=ems">
                  <Button
                    variant="outline"
                    className="rounded-full border-white/40 bg-transparent px-7 py-5 text-white hover:bg-white/10"
                  >
                    Admin portal
                  </Button>
                </Link>
              </div>
            </div>

            <div className="dot-grid-bg rounded-3xl border border-white/15 bg-white/5 p-6">
              <Image
                src="/waspi-event.png"
                alt="WASPI community event"
                width={700}
                height={460}
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="h-56 w-full rounded-2xl object-cover"
              />
              <p className="mt-4 text-sm text-white/75">
                WASPI continues to empower safety champions through real-world collaboration and continuous learning.
              </p>
            </div>
          </div>

          <footer className="mt-12 border-t border-white/15 pt-6 text-sm text-white/65">
            © {new Date().getFullYear()} WASPI — Workplace Advocates on Safety in the Philippines Inc.
          </footer>
        </LandingSection>
      </div>
    </main>
  )
}
