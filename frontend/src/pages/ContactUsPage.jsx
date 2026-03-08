export default function ContactUsPage() {
  return (
    <section className="contact-page reveal-up py-6">
      <div className="contact-card surface-card">
        <p className="section-eyebrow">Tenant Support</p>
        <h1 className="text-3xl font-bold">Contact Admin</h1>
        <p className="contact-copy">
          Need help with your listing, move-in, support ticket, or extension request?
          Reach out directly using any of the channels below.
        </p>

        <div className="contact-grid">
          <a
            className="contact-link"
            href="https://x.com/Its_Aman_Maurya"
            target="_blank"
            rel="noreferrer"
          >
            <span className="contact-label">X</span>
            <span className="contact-value">@Its_Aman_Maurya</span>
          </a>

          <a
            className="contact-link"
            href="https://www.instagram.com/aman_._maurya/"
            target="_blank"
            rel="noreferrer"
          >
            <span className="contact-label">Instagram</span>
            <span className="contact-value">@aman_._maurya</span>
          </a>

          <a className="contact-link" href="mailto:amankashipur1234@gmail.com">
            <span className="contact-label">Email</span>
            <span className="contact-value">amankashipur1234@gmail.com</span>
          </a>
        </div>
      </div>
    </section>
  );
}
