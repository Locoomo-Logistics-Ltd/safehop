import { LegalDocLayout, Placeholder } from "./LegalDocLayout";

/**
 * Drafted from an audit of this app's actual auth flow, roles, and
 * data handling (2026-08-21) — not a generic template. Bracketed
 * items still need a business decision or legal sign-off; see the
 * matching audit conversation for the full reasoning behind each
 * clause. Not legal advice until reviewed by a qualified lawyer.
 */
export function TermsScreen() {
  return (
    <LegalDocLayout title="Terms of Service" effectiveDate={<Placeholder>[EFFECTIVE DATE]</Placeholder>}>
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the
        Locoomo application, website, and related services (together, the &ldquo;App&rdquo;),
        operated by <strong>Locoomo Ltd</strong> (&ldquo;Locoomo,&rdquo; &ldquo;we,&rdquo;
        &ldquo;us&rdquo;), a company registered in Nigeria under CAC number{" "}
        <Placeholder>[CAC REGISTRATION NUMBER]</Placeholder>, with its registered address at{" "}
        <Placeholder>[REGISTERED ADDRESS]</Placeholder>. By creating an account or otherwise
        using the App, you agree to these Terms. If you do not agree, do not use the App.
      </p>

      <h2>1. Definitions</h2>
      <ul>
        <li><strong>Consumer</strong> — a user who books deliveries through the App.</li>
        <li><strong>Rider</strong> — a user who, after verification, transports parcels between Nodes.</li>
        <li><strong>Node Operator</strong> — a user who operates a physical Node on the network.</li>
        <li><strong>Node</strong> — a physical drop-off/collection location run by a Node Operator.</li>
        <li><strong>Order</strong> — a single booked delivery, from creation through collection or cancellation.</li>
        <li><strong>Handoff Code</strong> — the one-time numeric code used to verify each physical custody transfer of a parcel.</li>
        <li><strong>Content</strong> — any information, images, or documents you submit through the App, including verification documents and parcel descriptions.</li>
      </ul>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old and capable of forming a binding contract under
        Nigerian law to use the App. By registering, you represent that the information you
        provide is accurate and that you meet these requirements. We do not currently verify
        age at registration.
      </p>

      <h2>3. Account Registration</h2>
      <p>
        Each role (Consumer, Rider, Node Operator) is self-registered using your name, email,
        phone number, and a password. Rider and Node Operator accounts additionally require a
        verification step &mdash; Rider identity/license information and a supporting document;
        Node Operator business details &mdash; which we review before granting full access.
        Admin accounts are provisioned only by invitation from an existing Admin. You may not
        register using another person&rsquo;s identity or on behalf of a business you are not
        authorized to represent.
      </p>

      <h2>4. Account Responsibilities</h2>
      <p>
        You are responsible for maintaining the confidentiality of your login credentials and
        for all activity that occurs under your account. Notify us immediately at{" "}
        <a href="mailto:info@locoomo.com">info@locoomo.com</a> if you suspect unauthorized
        access. We are not liable for losses caused by your failure to safeguard your
        credentials.
      </p>

      <h2>5. User Roles &amp; Permissions</h2>
      <ul>
        <li>
          <strong>Consumers</strong> can create and track their own deliveries, and see the
          status and route of their own orders only.
        </li>
        <li>
          <strong>Riders</strong> can view and accept available jobs, and see the information
          needed to complete a job &mdash; but never the receiver&rsquo;s name, email, or
          phone.
        </li>
        <li>
          <strong>Node Operators</strong> can process handoffs and collections at their own
          Node, but never see a Rider&rsquo;s personal identity &mdash; only the handoff code
          exchange.
        </li>
        <li>
          <strong>Admins</strong> have platform-wide visibility for approvals, disputes,
          pricing, and support, and must use that access only for legitimate operational
          reasons.
        </li>
      </ul>

      <h2>6. Acceptable Use</h2>
      <p>
        You agree to use the App only for its intended purpose &mdash; booking, fulfilling, or
        facilitating legitimate parcel deliveries &mdash; and in compliance with applicable
        Nigerian law.
      </p>

      <h2>7. Prohibited Activities</h2>
      <p>You must not:</p>
      <ul>
        <li>
          Ship or attempt to ship illegal, hazardous, prohibited, or dangerous items,
          including firearms, explosives, illicit drugs, and items prohibited under Nigerian
          customs or postal law;
        </li>
        <li>Misrepresent the contents, value, or size of a parcel;</li>
        <li>Share, sell, or misuse a handoff or collection code outside its intended purpose;</li>
        <li>Attempt to circumvent the App&rsquo;s verification, payment, or approval processes;</li>
        <li>Use another user&rsquo;s account or impersonate any person or business;</li>
        <li>Reverse-engineer, scrape, or interfere with the App&rsquo;s normal operation; or</li>
        <li>Upload false, fraudulent, or misleading verification documents.</li>
      </ul>

      <h2>8. User Content</h2>
      <p>
        You retain ownership of Content you submit. By submitting it, you grant Locoomo a
        limited license to use, store, and share that Content strictly as needed to operate
        the App &mdash; for example, showing a parcel description to the Rider and Node
        Operators handling that specific order, or a verification document to the Admin
        reviewing your application. You are responsible for ensuring you have the right to
        submit any Content you upload.
      </p>

      <h2>9. Intellectual Property</h2>
      <p>
        The App, including its name, logo, design, and underlying software, is the property
        of Locoomo or its licensors. Nothing in these Terms grants you rights to Locoomo&rsquo;s
        trademarks or branding beyond what is necessary to use the App as intended.
      </p>

      <h2>10. Third-Party Services</h2>
      <p>
        The App relies on <strong>Paystack</strong> for payment processing,{" "}
        <strong>Cloudinary</strong> for secure document storage, and{" "}
        <strong>Geoapify</strong> for maps and address lookup. Your use of features backed by
        these services is also subject to those providers&rsquo; own terms. We are not
        responsible for the availability or performance of third-party services outside our
        control.
      </p>

      <h2>11. Payments &amp; Fees</h2>
      <p>
        Delivery fees are calculated at checkout and payable in full before a delivery is
        dispatched. Payment is processed by Paystack; Locoomo does not receive or store your
        card details.{" "}
        <Placeholder>
          [Refund/cancellation policy &mdash; needs a confirmed business decision]
        </Placeholder>
      </p>

      <h2>12. Transactions Between Parties</h2>
      <p>
        Locoomo operates the platform connecting Consumers, Riders, and Node Operators; Riders
        and Node Operators act as{" "}
        <Placeholder>[independent operators &mdash; confirm classification]</Placeholder>{" "}
        facilitating delivery on their own account, not as Locoomo employees, unless
        separately agreed.
      </p>

      <h2>13. Service Availability</h2>
      <p>
        The App is provided on an ongoing basis but is not guaranteed to be available at all
        times. We may suspend access for maintenance, updates, or issues beyond our reasonable
        control.
      </p>

      <h2>14. Security</h2>
      <p>
        We use reasonable technical and organizational measures to protect your account and
        data, including signed, time-limited access to uploaded documents and encrypted
        transport for App traffic. No system is perfectly secure, and you are responsible for
        keeping your own device and credentials secure.
      </p>

      <h2>15. Account Suspension &amp; Termination</h2>
      <p>
        We may suspend or terminate your account if you violate these Terms, provide false
        information during verification, or engage in fraudulent or unsafe conduct. You may
        stop using the App at any time &mdash; see our{" "}
        <a href="/privacy">Privacy Policy</a> for how to request account and data deletion.
      </p>

      <h2>16. Data and Privacy</h2>
      <p>
        Our collection and use of your personal data is described in our{" "}
        <a href="/privacy">Privacy Policy</a>, which forms part of these Terms.
      </p>

      <h2>17. Disclaimers</h2>
      <p>
        The App is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; We are not
        responsible for the accuracy of information provided by other users (for example, a
        parcel&rsquo;s declared contents or a receiver&rsquo;s details) or for the acts or
        omissions of independent Riders and Node Operators.
      </p>

      <h2>18. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by Nigerian law, Locoomo&rsquo;s total liability
        arising from your use of the App is limited to{" "}
        <Placeholder>
          [liability cap, e.g. the fees paid for the specific order giving rise to the claim]
        </Placeholder>
        . We are not liable for indirect, incidental, or consequential losses. Nothing here
        limits liability that cannot lawfully be limited.
      </p>

      <h2>19. Indemnification</h2>
      <p>
        You agree to indemnify and hold Locoomo harmless from claims, losses, or damages
        arising from your violation of these Terms, misuse of the App, or the contents of a
        parcel you shipped or received.
      </p>

      <h2>20. Dispute Resolution &amp; Governing Law</h2>
      <p>
        If a dispute arises, contact us first at{" "}
        <a href="mailto:info@locoomo.com">info@locoomo.com</a> to seek an informal resolution.
        These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes not
        resolved informally are subject to the exclusive jurisdiction of the courts of{" "}
        <Placeholder>[STATE / COURT VENUE]</Placeholder>.
      </p>

      <h2>21. Handoff &amp; Collection Codes</h2>
      <p>
        The App verifies custody of a parcel using one-time numeric codes rather than identity
        documents. You are responsible for keeping any code shown to you confidential until
        the moment of a legitimate handoff &mdash; sharing a code prematurely is treated the
        same as physically handing over the parcel.
      </p>

      <h2>22. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be communicated
        through the App or by email before they take effect.
      </p>

      <h2>23. Contact</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:info@locoomo.com">info@locoomo.com</a>.
      </p>
    </LegalDocLayout>
  );
}
