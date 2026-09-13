"""
email_utils.py
---------------
Sends verification emails via plain SMTP (stdlib only — no extra
dependency). If email_verification_enabled is False, or SMTP settings are
missing/wrong, this fails SILENTLY (logs a warning, doesn't raise) so a
misconfigured or untested email setup never breaks registration itself.

Tested providers: Gmail (requires a 16-character "App Password", not your
regular password — set one up at myaccount.google.com/apppasswords, which
requires 2FA enabled first), and most transactional email APIs that also
expose a plain SMTP endpoint (Resend, SendGrid, Mailgun, etc).
"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings

log = logging.getLogger("email_utils")


def send_verification_email(to_email: str, full_name: str, token: str) -> bool:
    if not settings.email_verification_enabled:
        return False
    if not (settings.smtp_host and settings.smtp_username and settings.smtp_password and settings.smtp_from_email):
        log.warning("Email verification is enabled but SMTP settings are incomplete — skipping send.")
        return False

    verify_link = f"{settings.frontend_base_url}/verify-email?token={token}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verify your Pellet Monitor account"
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    msg["To"] = to_email

    text_body = (
        f"Hi {full_name},\n\n"
        f"Please verify your email to finish creating your account:\n{verify_link}\n\n"
        f"If you didn't request this, you can ignore this email."
    )
    html_body = f"""
    <p>Hi {full_name},</p>
    <p>Please verify your email to finish creating your account:</p>
    <p><a href="{verify_link}">{verify_link}</a></p>
    <p>If you didn't request this, you can ignore this email.</p>
    """
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.starttls()
            server.login(settings.smtp_username, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, [to_email], msg.as_string())
        return True
    except Exception as e:
        log.error("Failed to send verification email to %s: %s", to_email, e)
        return False
