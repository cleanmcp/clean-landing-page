import Link from "next/link";
import Image from "next/image";

const A = "/landing";

export default function PrivacyPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden px-5 pb-24 pt-20">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute inset-0 opacity-40 overflow-hidden">
        <Image src={`${A}/dark-bg.png`} alt="" fill className="object-cover" />
      </div>

      <Link
        href="/"
        className="absolute left-6 top-6 z-20 flex items-center gap-2.5 text-sm text-white/40 transition-colors hover:text-white/80"
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back
      </Link>

      <article className="relative z-10 w-full max-w-2xl" style={{ fontFamily: "var(--font-jakarta)" }}>
        <header className="mb-12 text-center">
          <Link href="/" className="inline-flex items-center gap-0.5 mb-10">
            <Image src={`${A}/clean-icon.svg`} alt="" width={22} height={22} />
            <span className="text-2xl font-bold text-white tracking-tight">lean.ai</span>
          </Link>
          <h1 className="mb-2 text-[32px] sm:text-[40px] font-semibold tracking-tight text-white">
            Privacy <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>Policy</em>
          </h1>
          <p className="text-sm text-white/40">Clean AI Labs, Inc. | tryclean.ai</p>
          <p className="text-sm text-white/40">Effective Date: March 30, 2026</p>
        </header>

        <div className="space-y-8 text-[15px] leading-relaxed text-white/70">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">1. Introduction</h2>
            <p>
              Clean AI Labs, Inc. (&ldquo;Clean,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates tryclean.ai (the &ldquo;Site&rdquo; and &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, store, and protect your information when you use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">2. Information We Collect</h2>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">2.1 Account Information</h3>
            <p>
              When you create an account, we collect your name and email address. If you subscribe to a paid plan, payment information is collected and processed by Stripe. We do not store your full credit card number on our servers.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">2.2 Customer Data</h3>
            <p>
              You may upload code, files, and repository data to the Service. This data is processed solely to provide the Service to you. We do not use your uploaded content for any other purpose.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">2.3 Usage Data</h3>
            <p>
              We may collect information about how you interact with the Service, including features used, search queries, credit consumption, pages visited, timestamps, and device/browser information. This data helps us improve the Service.
            </p>

            <h3 className="mb-2 mt-4 text-base font-semibold text-white/90">2.4 Cookies</h3>
            <p>
              We use cookies and similar technologies for session management and authentication. We do not currently use third-party analytics or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">3. How We Use Your Information</h2>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Provide, maintain, and improve the Service.</li>
              <li>Process payments and manage your subscription.</li>
              <li>Send you account-related communications (billing, security, updates).</li>
              <li>Monitor usage to enforce plan limits.</li>
              <li>Respond to your requests and support inquiries.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">4. Third-Party Services</h2>
            <p className="mb-3">
              We share limited information with the following categories of service providers, solely as needed to operate the Service:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong className="text-white/90">Payment processing:</strong> Stripe processes your payment data under their own privacy policy.</li>
              <li><strong className="text-white/90">Hosting infrastructure:</strong> Our servers may be hosted on third-party cloud providers (currently self-hosted, transitioning to Google Cloud or AWS).</li>
              <li><strong className="text-white/90">AI/ML services:</strong> We may use third-party AI services to power certain features. Data sent to these services is limited to what is necessary to provide the functionality.</li>
            </ul>
            <p className="mt-3">We do not sell, rent, or trade your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">5. Data Ownership and Retention</h2>
            <p>
              You own all Customer Data you upload. We retain your data for as long as your account is active. When you delete your account or specific data, we remove it from our systems within a reasonable timeframe. Some data may be retained in backups for a limited period or as required by law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">6. Data Security</h2>
            <p>
              We take reasonable measures to protect your information, including encryption in transit (TLS/SSL). However, no method of transmission or storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">7. Your Rights</h2>
            <p className="mb-2">Depending on your location, you may have the right to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Access, correct, or delete your personal information.</li>
              <li>Export your data in a portable format.</li>
              <li>Object to or restrict certain processing of your data.</li>
              <li>Withdraw consent where processing is based on consent.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:hello@tryclean.ai" className="text-[#79c0ff] hover:text-[#aed8ff] transition-colors">hello@tryclean.ai</a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">8. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for anyone under 18. We do not knowingly collect information from children. If we learn that we have collected data from a child under 18, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">9. International Users</h2>
            <p>
              The Service is operated from the United States. If you access the Service from outside the US, your information may be transferred to and processed in the US, where data protection laws may differ from those in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the updated policy on this page and update the Effective Date. Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">11. Contact</h2>
            <p>
              For questions about this Privacy Policy, contact us at{" "}
              <a href="mailto:hello@tryclean.ai" className="text-[#79c0ff] hover:text-[#aed8ff] transition-colors">hello@tryclean.ai</a>.
            </p>
          </section>

          <footer className="border-t border-white/10 pt-6 text-center text-sm text-white/40">
            Clean AI Labs, Inc. | Delaware, USA
          </footer>
        </div>
      </article>
    </div>
  );
}
