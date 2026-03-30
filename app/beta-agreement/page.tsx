import Link from "next/link";
import Image from "next/image";

const A = "/landing";

export default function BetaAgreementPage() {
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
            Beta Service <em className="not-italic" style={{ fontFamily: "var(--font-display)" }}>Agreement</em>
          </h1>
          <p className="text-sm text-white/40">Clean AI Labs, Inc. | tryclean.ai</p>
          <p className="text-sm text-white/40">Effective Date: March 30, 2026</p>
        </header>

        <div className="space-y-8 text-[15px] leading-relaxed text-white/70">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">1. Beta Status</h2>
            <p>
              The Clean platform (the &ldquo;Service&rdquo;) is currently offered as a beta release by Clean AI Labs, Inc. (&ldquo;Clean,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By using the Service, you acknowledge and agree that the Service is in active development and is not a final commercial product.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">2. No Warranty</h2>
            <p className="uppercase">
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, whether express, implied, or statutory, including warranties of merchantability, fitness for a particular purpose, and non-infringement. The Service may contain bugs, errors, and other problems. Clean does not guarantee uptime, accuracy, or reliability of the Service during the beta period.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">3. Service Modifications</h2>
            <p>
              During the beta period, we may modify, suspend, or discontinue any part of the Service at any time without notice. Features, pricing, credit allocations, and plan limits are subject to change. We will make reasonable efforts to notify users of significant changes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">4. Data Risk</h2>
            <p>
              While we take reasonable precautions to protect your data, you acknowledge that data loss or corruption may occur during the beta period. You are responsible for maintaining independent backups of any data you upload to the Service. Clean is not liable for any data loss.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">5. Feedback</h2>
            <p>
              We welcome feedback, suggestions, and bug reports. By providing feedback, you grant Clean a non-exclusive, royalty-free, perpetual, and irrevocable license to use, modify, and incorporate your feedback into the Service without any obligation to you.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">6. Limitation of Liability</h2>
            <p className="uppercase">
              To the maximum extent permitted by law, Clean shall not be liable for any damages arising from your use of the beta Service, including but not limited to direct, indirect, incidental, special, or consequential damages, loss of data, revenue, or profits. Your sole remedy for dissatisfaction with the Service is to stop using it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">7. Confidentiality</h2>
            <p>
              Certain features or aspects of the Service may be designated as confidential. You agree not to disclose confidential beta features, performance data, or non-public information about the Service to third parties without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">8. Termination</h2>
            <p>
              This Beta Service Agreement is effective until the Service exits beta or until terminated by either party. Clean may terminate your beta access at any time for any reason. Upon termination, your right to access the Service under beta terms ends immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">9. Relationship to Terms of Service</h2>
            <p>
              This Beta Service Agreement supplements our{" "}
              <Link href="/terms" className="text-[#79c0ff] hover:text-[#aed8ff] transition-colors">Terms of Service</Link>.
              {" "}In the event of a conflict between this agreement and the Terms of Service, this agreement controls for matters relating to the beta nature of the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">10. Contact</h2>
            <p>
              For questions about this agreement, contact us at{" "}
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
