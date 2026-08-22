import { LegalDocLayout, Placeholder } from "./LegalDocLayout";

/**
 * Drafted from an audit of this app's actual data practices
 * (2026-08-21): auth flow, roles, Cloudinary/Paystack/Geoapify
 * integrations, and storage. Bracketed items still need a business
 * decision or legal sign-off. Not legal advice until reviewed by a
 * qualified lawyer or data-protection professional.
 */
export function PrivacyScreen() {
  return (
    <LegalDocLayout title="Privacy Policy" effectiveDate={<Placeholder>[EFFECTIVE DATE]</Placeholder>}>
      <p>
        <strong>Locoomo Ltd</strong> (&ldquo;Locoomo,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;)
        operates the Locoomo App and acts as the data controller for the personal information
        described below, under the Nigeria Data Protection Act, 2023 (&ldquo;NDPA&rdquo;). Our
        registered address is <Placeholder>[REGISTERED ADDRESS]</Placeholder>.
      </p>

      <h2>1. Scope</h2>
      <p>
        This Policy applies to everyone who uses the App &mdash; Consumers, Riders, Node
        Operators, and Admins &mdash; and to the personal data of receivers that Consumers
        provide to us when booking a delivery.
      </p>

      <h2>2. Information We Collect</h2>
      <p><strong>Information you provide directly:</strong></p>
      <ul>
        <li><strong>Account information</strong> &mdash; first name, last name, email, phone number, password.</li>
        <li><strong>Rider verification</strong> &mdash; current employer, license number, and an uploaded identity/rating-screenshot document.</li>
        <li><strong>Node Operator onboarding</strong> &mdash; business name, address, city, state, country, GPS coordinates, capacity, and operating hours.</li>
        <li><strong>Delivery details</strong> &mdash; parcel description and size, and the receiver&rsquo;s full name, email, and phone number (provided by the Consumer).</li>
        <li><strong>Team member information</strong>, for Admin-invited staff &mdash; name, email, phone.</li>
      </ul>
      <p><strong>Information collected automatically:</strong></p>
      <ul>
        <li>A session cookie and a locally cached copy of your session, used only to keep you signed in.</li>
        <li>Your device&rsquo;s location, only if you actively search for nearby Nodes &mdash; never collected in the background.</li>
        <li>We do <strong>not</strong> use analytics, advertising, or tracking cookies of any kind.</li>
      </ul>
      <p>
        <strong>From third parties:</strong> we do not currently receive personal data about
        you from any third party, including social login providers &mdash; Google sign-in is
        present in the App&rsquo;s code but is not active and collects nothing today.
      </p>

      <h2>3. How We Use Information</h2>
      <ul>
        <li>To create and secure your account, and authenticate you when you sign in.</li>
        <li>To operate the delivery lifecycle: matching Riders to jobs, coordinating Node handoffs, notifying receivers, and tracking an order&rsquo;s status.</li>
        <li>To verify Rider and Node Operator eligibility before approving them to operate on the network.</li>
        <li>To process payments through Paystack.</li>
        <li>To detect fraud, confirm correct parcel recipients, and maintain a safe platform.</li>
        <li>To respond to support requests and, where applicable, resolve disputes.</li>
      </ul>

      <h2>4. Legal Bases for Processing</h2>
      <p>
        Under the NDPA, we rely on: your <strong>consent</strong> (given at registration);
        the <strong>necessity of processing to perform our contract</strong> with you
        (booking and fulfilling deliveries); our <strong>legitimate interests</strong> in
        preventing fraud and keeping the platform secure; and, where applicable,{" "}
        <strong>legal obligations</strong> we must comply with.
      </p>

      <h2>5. How Information Is Shared</h2>
      <p>We limit what each role can see of another user&rsquo;s data by design:</p>
      <ul>
        <li>Riders never see a receiver&rsquo;s name, email, or phone.</li>
        <li>Node Operators never see a Rider&rsquo;s personal identity &mdash; only the handoff code exchange.</li>
        <li>A receiver&rsquo;s collection code is emailed only to the receiver.</li>
        <li>A Node Operator does record the receiver&rsquo;s name at the point of physical collection, as an identity/fraud check.</li>
        <li>Admins have platform-wide visibility for approvals, support, and dispute resolution.</li>
      </ul>
      <p>We do not sell personal data, and we do not share it with third parties for their own marketing purposes.</p>

      <h2>6. Service Providers We Use</h2>
      <ul>
        <li><strong>Cloudinary</strong> &mdash; securely stores Rider verification document images, uploaded directly from your browser using a time-limited signed link.</li>
        <li><strong>Paystack</strong> &mdash; processes payments; we never receive or store your card details.</li>
        <li><strong>Geoapify</strong> &mdash; provides maps and converts addresses you search into coordinates.</li>
        <li><strong>Railway</strong> &mdash; hosts our backend infrastructure.</li>
      </ul>

      <h2>7. International Data Transfers</h2>
      <p>
        <Placeholder>
          [Needs confirmation: whether our service providers store or process data outside
          Nigeria, and under what safeguard]
        </Placeholder>
        . Where personal data is transferred outside Nigeria, we take steps consistent with
        NDPA cross-border transfer requirements to keep it protected.
      </p>

      <h2>8. Cookies &amp; Similar Technologies</h2>
      <p>
        We use one essential session cookie to keep you signed in, and browser storage to
        cache your session and, briefly, a pending payment reference. We do not use cookies
        for advertising, analytics, or cross-site tracking.
      </p>

      <h2>9. Data Retention</h2>
      <p>
        <Placeholder>
          [Needs confirmation: specific retention periods for account data, KYC documents,
          order records, and payment records]
        </Placeholder>
        . As a general principle, we retain personal data for as long as your account is
        active and as necessary to fulfil the purposes above, resolve disputes, and meet legal
        obligations, after which it is deleted or anonymized.
      </p>

      <h2>10. Data Security</h2>
      <p>
        We use signed, time-limited links for uploaded documents, encrypted transport for all
        App traffic, and cookie-based authentication. No method of storage or transmission is
        completely secure, and we cannot guarantee absolute security.
      </p>

      <h2>11. Your Rights</h2>
      <p>
        Under the NDPA, you have the right to access, correct, or request deletion of your
        personal data; object to or restrict certain processing; request a portable copy of
        your data; and withdraw consent at any time.
      </p>

      <h2>12. Access, Correction &amp; Deletion Requests</h2>
      <p>
        You can update most of your own profile information directly within the App. For
        anything you cannot change yourself, or to request a copy or deletion of your data,
        email <a href="mailto:info@locoomo.com">info@locoomo.com</a>. We will respond within a
        reasonable time and consistent with NDPA requirements.
      </p>

      <h2>13. Account Deletion</h2>
      <p>
        The App does not currently offer a self-service &ldquo;delete my account&rdquo;
        option. To request that your account and associated personal data be deleted, email{" "}
        <a href="mailto:info@locoomo.com">info@locoomo.com</a>. We will confirm the request and
        let you know what, if anything, we are required to retain and for how long.
      </p>

      <h2>14. Marketing Communications</h2>
      <p>
        We only send transactional messages required to operate the App &mdash; account
        verification, password resets, and delivery/collection notifications.{" "}
        <Placeholder>[Needs confirmation: whether marketing emails are sent today]</Placeholder>
        . If we introduce marketing communications in future, we will provide a clear way to
        opt out.
      </p>

      <h2>15. Children&rsquo;s Privacy</h2>
      <p>
        The App is intended for users 18 and older. We do not knowingly collect personal data
        from children below that age. The App does not currently verify age at registration;
        if you believe a child has provided us with personal data, contact{" "}
        <a href="mailto:info@locoomo.com">info@locoomo.com</a> so we can remove it.
      </p>

      <h2>16. User-Generated Content</h2>
      <p>
        Parcel descriptions and uploaded verification documents are visible only to the users
        and Admins who need them to complete a specific function.
      </p>

      <h2>17. Automated Decision-Making</h2>
      <p>
        The App calculates delivery fares automatically based on route and delivery method,
        but this is a pricing calculation, not a decision that produces a legal or similarly
        significant effect about you, and it does not involve profiling. We do not currently
        use AI features that make decisions about your account or eligibility.
      </p>

      <h2>18. Data Breach Notification</h2>
      <p>
        If a security incident affecting your personal data occurs, we will assess it and,
        where required under the NDPA, notify the Nigeria Data Protection Commission and
        affected users within the applicable timeframe.
      </p>

      <h2>19. Changes to This Policy</h2>
      <p>
        We may update this Policy from time to time. Material changes will be communicated
        through the App or by email before they take effect.
      </p>

      <h2>20. Data Protection Officer</h2>
      <p>
        <Placeholder>
          [Needs confirmation: whether a DPO has been designated, as may be required under the
          NDPA depending on processing scale]
        </Placeholder>
      </p>

      <h2>21. Contact</h2>
      <p>
        General questions and privacy/data-protection requests:{" "}
        <a href="mailto:info@locoomo.com">info@locoomo.com</a>. Postal address:{" "}
        <Placeholder>[REGISTERED ADDRESS]</Placeholder>.
      </p>
    </LegalDocLayout>
  );
}
