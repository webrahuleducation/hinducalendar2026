export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-2 font-serif text-3xl font-bold">Privacy Policy</h1>
        <p className="mb-8 text-sm text-muted-foreground">Last updated: February 17, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-foreground/90">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Welcome</h2>
            <p>
              Hindu Calendar 2026 ("we", "our", or "the app") is a free calendar application that helps you keep track of Hindu festivals, vrats, utsavs, and personal events. We built this app because we genuinely care about making it easy for people to stay connected with their traditions. This privacy policy explains, in plain language, what information we collect, why we collect it, and how we keep it safe.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">What Information We Collect</h2>
            <p className="mb-3">We only collect what we need to make the app work for you:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Account information:</strong> When you sign in with Google, we receive your name, email address, and profile picture from your Google account. We use this solely to identify you within the app and personalize your experience.
              </li>
              <li>
                <strong>Events and reminders:</strong> Any custom events or reminders you create are stored securely in our database so they sync across your devices and are available when you return.
              </li>
              <li>
                <strong>Preferences:</strong> Your language choice (English or Hindi), theme preference (light or dark mode), and similar settings are saved locally on your device and in your profile so you don't have to set them up every time.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">How We Use Your Information</h2>
            <p>Your data is used for one purpose: making the app useful to you. Specifically, we use it to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Display your calendar with personalized events and reminders</li>
              <li>Remember your settings and preferences</li>
              <li>Send you event reminders you've opted into</li>
              <li>Improve the app based on general usage patterns (we never sell your personal data)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Cookies and Local Storage</h2>
            <p>
              We use your browser's local storage to remember things like your login session, language preference, and theme choice. These are small pieces of data stored on your own device — they never leave your browser. We do not use tracking cookies or any advertising cookies. There are no pop-ups asking you to "accept cookies" because we simply don't use them for tracking.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Third-Party Services</h2>
            <p className="mb-3">We rely on a small number of trusted services to run the app:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Google Sign-In:</strong> We use Google's OAuth service to let you sign in securely. When you choose to sign in with Google, Google shares your basic profile information with us according to their own privacy policy. We never see or store your Google password.
              </li>
              <li>
                <strong>Cloud Database:</strong> Your events, reminders, and profile data are stored in a secure, hosted database. Data is encrypted in transit and at rest.
              </li>
              <li>
                <strong>Hosting:</strong> The app is hosted on Lovable's infrastructure. Pages are served over HTTPS to keep your connection secure.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Data Security</h2>
            <p>
              We take reasonable steps to protect your information. All data is transmitted over encrypted connections (HTTPS). Database access is restricted and protected by row-level security policies, which means users can only access their own data. That said, no system is perfectly secure, and we encourage you to use a strong Google account password as your first line of defense.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Your Choices</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>You can delete any custom event or reminder at any time from within the app.</li>
              <li>You can change your language and theme preferences at any time from the Profile page.</li>
              <li>You can sign out at any time, which clears your local session.</li>
              <li>If you want your account data removed entirely, please reach out to us and we'll take care of it.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Children's Privacy</h2>
            <p>
              This app is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with their data, please let us know so we can remove it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. If we make significant changes, we'll note the new date at the top of this page. We encourage you to review this page occasionally to stay informed.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or how we handle your data, feel free to reach out to us at{" "}
              <a href="mailto:support@hinducalendar2026.lovable.app" className="text-primary underline underline-offset-2">
                support@hinducalendar2026.lovable.app
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t pt-6 text-center text-sm text-muted-foreground">
          <a href="/terms" className="text-primary underline underline-offset-2">Terms of Service</a>
          <span className="mx-2">·</span>
          <a href="/calendar" className="text-primary underline underline-offset-2">Back to Calendar</a>
        </div>
      </div>
    </div>
  );
}
