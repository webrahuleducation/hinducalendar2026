export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-2 font-serif text-3xl font-bold">Terms of Service</h1>
        <p className="mb-8 text-sm text-muted-foreground">Last updated: February 17, 2026</p>

        <div className="space-y-8 text-[15px] leading-relaxed text-foreground/90">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">What This App Is</h2>
            <p>
              Hindu Calendar 2026 is a free web application that provides a calendar of Hindu festivals, vrats, and utsavs for the year 2026. It also lets you create personal events, set reminders, and customize your experience. By using this app, you agree to the terms outlined below. They're straightforward - we've kept the legalese to a minimum.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Using the App</h2>
            <p className="mb-3">You're welcome to use the app as long as you:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Use it for its intended purpose - viewing calendar events and managing personal reminders.</li>
              <li>Don't attempt to disrupt, hack, or interfere with the app or its infrastructure.</li>
              <li>Don't use automated tools to scrape content or overload our servers.</li>
              <li>Keep your Google account credentials secure - we're not responsible for unauthorized access caused by compromised passwords.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Your Account</h2>
            <p>
              You can sign in using your Google account. When you do, we create a profile for you in our system. You're responsible for all activity that happens under your account. If you suspect someone else is using your account, sign out immediately and secure your Google credentials.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Your Content</h2>
            <p>
              Any events, notes, or reminders you create in the app belong to you. We don't claim ownership over your content. We store it only to provide the service to you. You can delete your content at any time from within the app.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Calendar Data Accuracy</h2>
            <p>
              We do our best to provide accurate dates for Hindu festivals, vrats, and utsavs. However, Hindu calendar dates can vary by region, tradition, and local panchangam interpretation. This app is meant to be a helpful reference, not a definitive religious authority. Always confirm important dates with your local pandit or community calendar if precision matters to you.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Availability and Reliability</h2>
            <p>
              We aim to keep the app running smoothly, but we can't guarantee 100% uptime. The app might occasionally be unavailable due to maintenance, updates, or unexpected issues. We won't be liable for any inconvenience caused by temporary downtime. If you rely on reminders for important events, we recommend having a backup method in place.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Limitation of Liability</h2>
            <p>
              This app is provided "as is" without warranties of any kind, whether express or implied. We are not liable for any damages arising from your use of the app, including but not limited to missed reminders, incorrect event dates, data loss, or service interruptions. Your use of the app is at your own discretion and risk.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Intellectual Property</h2>
            <p>
              The app's design, code, and predefined calendar content are owned by the app's creators. You may not copy, redistribute, or create derivative works from the app without permission. Your personal data and custom events remain yours.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Changes to These Terms</h2>
            <p>
              We may update these terms occasionally. When we do, we'll update the date at the top of this page. Continued use of the app after changes means you accept the revised terms. If a change is significant, we'll do our best to let you know.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Termination</h2>
            <p>
              You can stop using the app at any time - simply sign out and don't come back. We reserve the right to suspend or terminate accounts that violate these terms or engage in abusive behavior, though we honestly don't expect that to be necessary.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-foreground">Contact Us</h2>
            <p>
              Questions or concerns about these terms? Drop us a line at{" "}
              <a href="mailto:webdevelopers@rahuleducation.com" className="text-primary underline underline-offset-2">
                webdevelopers@rahuleducation.com
              </a>. We're happy to help.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t pt-6 text-center text-sm text-muted-foreground">
          <a href="/privacy" className="text-primary underline underline-offset-2">Privacy Policy</a>
          <span className="mx-2">·</span>
          <a href="/calendar" className="text-primary underline underline-offset-2">Back to Calendar</a>
        </div>
      </div>
    </div>
  );
}
