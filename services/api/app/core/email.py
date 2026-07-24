import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger("email_service")


def send_welcome_email(to_email: str, recipient_name: str) -> bool:
    """
    Send welcome / verification email via Brevo SMTP safely.
    Returns True if sent, False if failed (never raises an unhandled exception).
    """
    try:
        print(f"\n[Brevo SMTP] Initiating welcome email dispatch to: {to_email}...")
        print(f"[Brevo SMTP] Server: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
        print(f"[Brevo SMTP] Sender: {settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>")

        if not settings.SMTP_PASSWORD:
            print("[Brevo SMTP WARNING] SMTP_PASSWORD is not set. Skipping email dispatch.")
            return False

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Welcome to AlfaCareers — Account Verification"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        text_content = (
            f"Hello {recipient_name},\n\n"
            f"Welcome to AlfaCareers — The Hidden Job Market Engine!\n\n"
            f"Your account ({to_email}) has been successfully created and verified.\n\n"
            f"Best regards,\nThe AlfaCareers Team"
        )
        
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #0f172a; background-color: #f8fafc; padding: 24px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
              <div style="display: inline-block; padding: 6px 12px; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: bold; border-radius: 9999px; margin-bottom: 16px;">
                AlfaCareers | The Hidden Job Engine
              </div>
              <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Welcome to AlfaCareers</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                Hi <strong>{recipient_name}</strong>,
              </p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                Thank you for registering with <strong>AlfaCareers</strong>. Your account is ready!
              </p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                You can now discover un-syndicated corporate career page opportunities and use our AI vector matcher co-pilot.
              </p>
              <br/>
              <div style="border-top: 1px solid #e2e8f0; pt: 16px; margin-top: 16px; color: #64748b; font-size: 13px;">
                Best regards,<br/><strong>The AlfaCareers Team</strong>
              </div>
            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        print("[Brevo SMTP] Connecting to SMTP server and initiating STARTTLS...")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
            server.set_debuglevel(1)  # Output exact SMTP exchange to console log
            server.starttls()
            print("[Brevo SMTP] Authenticating credentials...")
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            print("[Brevo SMTP] Sending message...")
            smtp_response = server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
            print(f"[Brevo SMTP SUCCESS] Email successfully dispatched to {to_email}. Response: {smtp_response}")

        logger.info(f"Welcome email successfully dispatched to {to_email}")
        return True
    except Exception as e:
        print(f"[Brevo SMTP ERROR] Safe Email Dispatch Failed for {to_email}: {e}")
        logger.error(f"Safe Email Dispatch Failed for {to_email}: {e}")
        return False
