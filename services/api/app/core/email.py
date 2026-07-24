import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger("email_service")


def send_welcome_email(to_email: str, recipient_name: str, otp_code: str = "") -> bool:
    """
    Send welcome / verification email with 6-Digit OTP Code via Brevo SMTP safely.
    Returns True if sent, False if failed (never raises an unhandled exception).
    """
    try:
        print(f"\n[Brevo SMTP] Initiating welcome & OTP email dispatch to: {to_email}...")
        print(f"[Brevo SMTP] Server: {settings.SMTP_HOST}:{settings.SMTP_PORT}")
        print(f"[Brevo SMTP] Sender: {settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>")
        print(f"[Brevo SMTP] 6-Digit OTP Code: {otp_code}")

        if not settings.SMTP_PASSWORD:
            print("[Brevo SMTP WARNING] SMTP_PASSWORD is not set. Skipping email dispatch.")
            return False

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{otp_code} is your AlfaCareers Verification Code"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email

        text_content = (
            f"Hello {recipient_name},\n\n"
            f"Welcome to AlfaCareers — The Hidden Job Market Engine!\n\n"
            f"Your 6-digit email verification code is: {otp_code}\n\n"
            f"This code will expire in 10 minutes. Please enter it on the verification screen to activate your account.\n\n"
            f"Best regards,\nThe AlfaCareers Team"
        )
        
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #0f172a; background-color: #f8fafc; padding: 24px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
              <div style="display: inline-block; padding: 6px 12px; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: bold; border-radius: 9999px; margin-bottom: 16px;">
                AlfaCareers | Account Verification
              </div>
              <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Verify Your Email Address</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                Hi <strong>{recipient_name}</strong>,
              </p>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                Thank you for signing up for <strong>AlfaCareers</strong>. Please use the 6-digit code below to complete your registration:
              </p>
              
              <div style="text-align: center; margin: 28px 0;">
                <div style="display: inline-block; background: #f1f5f9; border: 2px dashed #cbd5e1; padding: 16px 32px; border-radius: 12px; font-size: 32px; font-weight: 900; tracking: 8px; color: #1e40af; letter-spacing: 6px;">
                  {otp_code}
                </div>
                <p style="color: #64748b; font-size: 12px; margin-top: 8px;">Valid for 10 minutes</p>
              </div>

              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                If you did not request this code, you can safely ignore this email.
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
            server.set_debuglevel(1)
            server.starttls()
            print("[Brevo SMTP] Authenticating credentials...")
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            print("[Brevo SMTP] Sending message...")
            smtp_response = server.sendmail(settings.SMTP_FROM_EMAIL, [to_email], msg.as_string())
            print(f"[Brevo SMTP SUCCESS] Welcome & OTP email dispatched to {to_email}. Response: {smtp_response}")

        logger.info(f"Welcome & OTP email successfully dispatched to {to_email}")
        return True
    except Exception as e:
        print(f"[Brevo SMTP ERROR] Safe Email Dispatch Failed for {to_email}: {e}")
        logger.error(f"Safe Email Dispatch Failed for {to_email}: {e}")
        return False
