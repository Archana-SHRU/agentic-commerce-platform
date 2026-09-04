"""
SMTP email service.

All credentials come from environment variables via `settings`; nothing is
hardcoded and no SMTP value is ever returned to the frontend.

Honesty rule: if SMTP is not configured, or the send fails, this module raises.
It never returns a success value for an email that was not actually handed to
an SMTP server.
"""
from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("app.email")


class EmailNotConfiguredError(RuntimeError):
    """SMTP settings are missing - no email can be sent."""


class EmailSendError(RuntimeError):
    """SMTP was configured but the message could not be delivered."""


def _from_header() -> str:
    name = settings.SMTP_FROM_NAME.strip()
    address = settings.SMTP_FROM_EMAIL.strip()
    return f"{name} <{address}>" if name else address


def send_email(
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str | None = None,
) -> None:
    """
    Send an email over SMTP.

    Raises:
        EmailNotConfiguredError: SMTP_HOST / SMTP_FROM_EMAIL are not set.
        EmailSendError: the SMTP conversation failed.
    """
    if not settings.smtp_configured:
        raise EmailNotConfiguredError(
            "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, "
            "SMTP_PASSWORD and SMTP_FROM_EMAIL in the backend environment."
        )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = _from_header()
    message["To"] = to_email
    message.set_content(text_body)

    if html_body:
        message.add_alternative(html_body, subtype="html")

    host = settings.SMTP_HOST.strip()
    port = int(settings.SMTP_PORT)
    user = settings.SMTP_USER.strip()
    password = settings.SMTP_PASSWORD

    try:
        if port == 465:
            # Implicit TLS
            with smtplib.SMTP_SSL(host, port, timeout=20) as server:
                if user:
                    server.login(user, password)
                server.send_message(message)
        else:
            with smtplib.SMTP(host, port, timeout=20) as server:
                server.ehlo()
                if settings.SMTP_USE_TLS:
                    server.starttls()
                    server.ehlo()
                if user:
                    server.login(user, password)
                server.send_message(message)
    except Exception as exc:
        logger.error("SMTP send to %s failed: %s", to_email, exc)
        raise EmailSendError("Unable to send the email via SMTP.") from exc

    logger.info("Email sent to %s (subject=%r)", to_email, subject)


def send_password_reset_email(to_email: str, reset_url: str, user_name: str) -> None:
    """Send the password reset email containing the reset link."""
    expiry_minutes = settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES

    subject = f"Reset your {settings.APP_NAME} password"

    text_body = (
        f"Hi {user_name},\n\n"
        f"We received a request to reset your {settings.APP_NAME} password.\n\n"
        f"Reset your password using this link:\n{reset_url}\n\n"
        f"This link expires in {expiry_minutes} minutes and can only be used "
        f"once.\n\n"
        "If you did not request a password reset, you can safely ignore this "
        "email - your password will stay the same.\n"
    )

    html_body = f"""\
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
    <p>Hi {user_name},</p>
    <p>We received a request to reset your <strong>{settings.APP_NAME}</strong>
       password.</p>
    <p>
      <a href="{reset_url}"
         style="display:inline-block;padding:12px 22px;border-radius:12px;
                background:#2563eb;color:#ffffff;text-decoration:none;
                font-weight:600;">
        Reset my password
      </a>
    </p>
    <p style="font-size:13px;color:#475569;">
      Or paste this link into your browser:<br>
      <a href="{reset_url}">{reset_url}</a>
    </p>
    <p style="font-size:13px;color:#475569;">
      This link expires in {expiry_minutes} minutes and can only be used once.
    </p>
    <p style="font-size:13px;color:#475569;">
      If you did not request a password reset, you can safely ignore this
      email &mdash; your password will stay the same.
    </p>
  </body>
</html>
"""

    send_email(
        to_email=to_email,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
    )
