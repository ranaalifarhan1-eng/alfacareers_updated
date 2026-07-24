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
        if not settings.SMTP_PASSWORD:
            logger.warning("SMTP password not configured. Skipping email dispatch.")
            return False

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Welcome to AlfaCareers — Verify Your Account"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        text_content = f"Hello {recipient_name},\n\nWelcome to AlfaCareers — The Hidden Job Market Engine!\n\nYour account has been successfully registered.\n\nBest regards,\nThe AlfaCareers Team"
        
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #0f172a; background-color: #f8fafc; padding: 24px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0;">
              <h2 style="color: #2563eb; margin-top: 0;">Welcome to AlfaCareers</h2>
              <p>Hi <strong>{recipient_name}</strong>,</p>
              <p>Thank you for registering with <strong>AlfaCareers — The Hidden Job Market Engine</strong>.</p>
              <p>Your account is ready. You can now access hidden job listings discovered directly from corporate career pages and use our AI vector matcher co-pilot.</p>
              <br/>
              <p style="color: #64748b; font-size: 13px;">Best regards,<br/><strong>The AlfaCareers Team</strong></p>
            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
            
        logger.info(f"Welcome email successfully dispatched to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Safe Email Dispatch Failed for {to_email}: {e}")
        # Never raise 500 error on registration
        return False
