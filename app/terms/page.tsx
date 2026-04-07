import Link from "next/link";
import Image from "next/image";

const A = "/landing";

export default function TermsPage() {
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
            Terms of <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>Service</em>
          </h1>
          <p className="text-sm text-white/40">Clean AI Labs, Inc. | tryclean.ai</p>
          <p className="text-sm text-white/40">Effective Date: March 30, 2026</p>
        </header>

        <div className="space-y-8 text-[15px] leading-relaxed text-white/70">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">1. Agreement to Terms</h2>
            <p>
              By accessing or using the Clean platform at tryclean.ai (the &ldquo;Service&rdquo;), operated by Clean AI Labs, Inc. (&ldquo;Clean,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a Delaware corporation, you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, do not use the Service. You must be at least 18 years old to use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">2. Description of Service</h2>
            <p>
              Clean is a context operating system for AI engineering teams. The Service allows users to search, index, and manage context across code repositories. Clean is currently in beta and the Service may change, have bugs, or be temporarily unavailable.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">3. Accounts</h2>
            <p>
              To use the Service, you must create an account with accurate information. You are responsible for maintaining the security of your account credentials and for all activity under your account. Notify us immediately at{" "}
              <a href="mailto:hello@tryclean.ai" className="text-[#79c0ff] hover:text-[#aed8ff] transition-colors">hello@tryclean.ai</a>{" "}
              if you suspect unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">4. Plans and Pricing</h2>
            <p className="mb-3">The Service is offered under the following plans:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong className="text-white/90">Free:</strong> $0/month. 10 searches/month, 2 repos, 1 user, cloud hosting, community support.</li>
              <li><strong className="text-white/90">Pro:</strong> $20/month. 500 searches/month, 15 repos, 5 users, cloud hosting, priority indexing, usage dashboard.</li>
              <li><strong className="text-white/90">Max:</strong> $100/month. 5,000 searches/month, unlimited repos, 10 users, cloud + self-host, private cloud, SLA, priority support.</li>
            </ul>
            <p className="mt-3">Clean reserves the right to modify pricing or plan features with 30 days notice. Each search costs 1–5 credits depending on depth.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">5. Payments and Billing</h2>
            <p>
              Paid plans are billed monthly through Stripe. By subscribing, you authorize us to charge your payment method on a recurring basis. You can cancel anytime, and your access will continue through the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">6. Refunds</h2>
            <p>
              If you need a refund, contact us at{" "}
              <a href="mailto:hello@tryclean.ai" className="text-[#79c0ff] hover:text-[#aed8ff] transition-colors">hello@tryclean.ai</a>{" "}
              with the reason for your request. Refund requests are reviewed on a case-by-case basis. We are not obligated to issue refunds but will make reasonable efforts to resolve billing concerns.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">7. Your Data</h2>
            <p>
              You retain full ownership of all code, files, and content you upload to the Service (&ldquo;Customer Data&rdquo;). Clean does not claim any ownership rights over Customer Data. We access and process Customer Data solely to provide the Service to you. When you delete your account or remove data, we will delete it from our systems within a reasonable timeframe, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">8. Acceptable Use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to reverse engineer, decompile, or disassemble the Service.</li>
              <li>Interfere with or disrupt the Service or its infrastructure.</li>
              <li>Upload malicious code or content that infringes third-party rights.</li>
              <li>Resell, sublicense, or redistribute access to the Service.</li>
              <li>Exceed your plan limits through automated means or circumvention.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">9. Intellectual Property</h2>
            <p>
              The Service, including its code, design, trademarks, and documentation, is owned by Clean AI Labs, Inc. and protected by intellectual property laws. These Terms do not grant you any rights to our intellectual property except the limited right to use the Service as described here.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">10. Beta Disclaimer</h2>
            <p>
              The Service is currently in beta. It is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, whether express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or that any defects will be corrected. Use of the beta Service is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Clean AI Labs, Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or revenue, whether incurred directly or indirectly. Our total liability for any claim arising from these Terms or the Service shall not exceed the amount you paid us in the 12 months before the claim arose, or $100, whichever is greater.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">12. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Clean AI Labs, Inc., its officers, directors, and employees from any claims, damages, or expenses arising from your use of the Service, your violation of these Terms, or your violation of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">13. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without cause, with or without notice. You may terminate your account at any time by canceling your subscription and deleting your account. Upon termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">14. Dispute Resolution</h2>
            <p>
              These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You agree to waive any right to a jury trial or to participate in a class action.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">15. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. If we make material changes, we will notify you by posting the updated Terms on the Site and updating the &ldquo;Effective Date&rdquo; above. Continued use of the Service after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">16. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
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
