import asyncio
import logging
import os
import smtplib
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from dotenv import dotenv_values, load_dotenv
from app.core.config import settings

logger = logging.getLogger(__name__)

def _get_smtp_credentials():
    # Force reload environment from .env files so modifications apply immediately without server restart
    load_dotenv(override=True)

    current_dir = os.path.dirname(os.path.abspath(__file__))
    candidate_paths = [
        os.path.join(current_dir, "..", "..", ".env"),
        os.path.join(current_dir, "..", "..", "..", ".env"),
        os.path.join(os.getcwd(), ".env"),
    ]
    env_vals = {}
    for p in candidate_paths:
        if os.path.isfile(p):
            env_vals.update({k: v for k, v in dotenv_values(p).items() if v})

    sender_email = (
        env_vals.get("SMTP_EMAIL")
        or os.getenv("SMTP_EMAIL")
        or getattr(settings, "SMTP_EMAIL", "")
        or ""
    ).strip().strip('"\'')

    sender_password = (
        env_vals.get("SMTP_PASSWORD")
        or os.getenv("SMTP_PASSWORD")
        or getattr(settings, "SMTP_PASSWORD", "")
        or ""
    ).strip().strip('"\'').replace(" ", "")

    smtp_server = (
        env_vals.get("SMTP_SERVER")
        or os.getenv("SMTP_SERVER")
        or getattr(settings, "SMTP_SERVER", "smtp.gmail.com")
        or "smtp.gmail.com"
    ).strip().strip('"\'')

    try:
        smtp_port = int(
            env_vals.get("SMTP_PORT")
            or os.getenv("SMTP_PORT")
            or getattr(settings, "SMTP_PORT", 587)
        )
    except (ValueError, TypeError):
        smtp_port = 587

    return sender_email, sender_password, smtp_server, smtp_port


def _send_email_sync(email_to: str, subject: str, text_body: str, html_body: Optional[str] = None) -> bool:
    """
    Synchronous SMTP dispatch designed to be executed inside asyncio.to_thread.
    Attempts STARTTLS on configured port (e.g. 587), and falls back to SSL (port 465) if blocked.
    """
    sender_email, sender_password, smtp_server, smtp_port = _get_smtp_credentials()

    # Check if credentials are unconfigured or placeholder
    if (
        not sender_email
        or not sender_password
        or "your-email" in sender_email
        or "your-app-password" in sender_password
    ):
        print(f"\n[EMAIL] ⚠️ SMTP_EMAIL or SMTP_PASSWORD is placeholder/empty. Simulating email dispatch for {email_to}.\n")
        logger.warning(
            "[EMAIL] SMTP_EMAIL or SMTP_PASSWORD is not configured in .env! "
            "Simulating email dispatch for development."
        )
        return True

    # Build MIME message
    if html_body:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"AI Test Agent <{sender_email}>"
        msg["To"] = email_to
        msg["Subject"] = subject
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))
    else:
        msg = MIMEText(text_body, "plain", "utf-8")
        msg["From"] = f"AI Test Agent <{sender_email}>"
        msg["To"] = email_to
        msg["Subject"] = subject

    print(f"\n[EMAIL] 🚀 Sending verification email to {email_to} from {sender_email} (via {smtp_server}:{smtp_port})...")

    # Attempt 1: Connect via configured port (STARTTLS for 587)
    primary_error = None
    try:
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_server, 465, timeout=12) as server:
                server.login(sender_email, sender_password)
                server.send_message(msg)
                print(f"[EMAIL] ✅ SUCCESS: Verification email sent to {email_to} via SSL (port 465)!\n")
                logger.info(f"Verification email successfully sent to {email_to} via SSL (port 465).")
                return True
        else:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=12) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(sender_email, sender_password)
                server.send_message(msg)
                print(f"[EMAIL] ✅ SUCCESS: Verification email sent to {email_to} via STARTTLS (port {smtp_port})!\n")
                logger.info(f"Verification email successfully sent to {email_to} via STARTTLS (port {smtp_port}).")
                return True
    except Exception as err:
        primary_error = err
        print(f"[EMAIL] ⚠️ Port {smtp_port} attempt failed ({err}). Trying port 465 SSL fallback...")
        logger.warning(f"[EMAIL] Primary SMTP connection to {smtp_server}:{smtp_port} failed: {err}. Trying fallback to SSL port 465...")

    # Attempt 2: Fallback to SSL (port 465) if port 587 was blocked or timed out
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=12) as server:
            server.login(sender_email, sender_password)
            server.send_message(msg)
            print(f"[EMAIL] ✅ SUCCESS: Verification email sent to {email_to} via fallback SSL (port 465)!\n")
            logger.info(f"Verification email successfully sent to {email_to} via fallback SSL (port 465).")
            return True
    except Exception as fallback_error:
        print(f"[EMAIL] ❌ FAILED: Both primary and fallback connections failed!\n  - Primary: {primary_error}\n  - Fallback: {fallback_error}\n")
        logger.error(
            f"[EMAIL] Both primary and fallback SMTP connections failed! "
            f"Error: {fallback_error}. Please check your SMTP_EMAIL and SMTP_PASSWORD."
        )
        return False


async def send_verification_email(email_to: str, verification_code: str) -> bool:
    """
    Sends a 6-digit verification code to the user using Gmail SMTP asynchronously.
    """
    print("\n" + "=" * 55)
    print(f"  🔐 VERIFICATION CODE FOR: {email_to}")
    print(f"  👉 CODE: {verification_code}")
    print("=" * 55 + "\n")
    logger.info(f"Generated verification code for {email_to}: {verification_code}")

    text_body = f"""Hi there,

Your 6-digit verification code for AI Test Agent is: {verification_code}

This code will expire in 15 minutes.
If you did not request this, you can safely ignore this email.

Best regards,
AI Test Agent Team
"""

    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #090d16;
      color: #f8fafc;
      margin: 0;
      padding: 32px 16px;
    }}
    .container {{
      max-width: 480px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 36px 28px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }}
    .badge {{
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #06b6d4;
      background: rgba(6, 182, 212, 0.12);
      border: 1px solid rgba(6, 182, 212, 0.25);
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 20px;
    }}
    h1 {{
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 12px;
    }}
    p {{
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 24px;
    }}
    .otp-card {{
      background: #0b1120;
      border: 1.5px dashed rgba(6, 182, 212, 0.4);
      border-radius: 14px;
      padding: 20px;
      text-align: center;
      margin-bottom: 24px;
    }}
    .otp-code {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #22d3ee;
      margin: 0;
    }}
    .note {{
      font-size: 12px;
      color: #64748b;
      margin: 8px 0 0;
    }}
    .footer {{
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">AI Autonomous Testing Agent</div>
    <h1>Verify Your Account</h1>
    <p>Welcome! Please enter the 6-digit verification code below to verify your email and finish setting up your account:</p>
    <div class="otp-card">
      <div class="otp-code">{verification_code}</div>
      <div class="note">Valid for the next 15 minutes</div>
    </div>
    <p>If you didn't create an account with AI Test Agent, please disregard this email.</p>
    <div class="footer">
      &copy; AI Autonomous Testing Agent. All rights reserved.
    </div>
  </div>
</body>
</html>"""

    return await asyncio.to_thread(_send_email_sync, email_to, "Your Verification Code - AI Test Agent", text_body, html_body)


async def send_password_reset_email(email_to: str, token: str) -> bool:
    """
    Sends a password reset link to the user using Gmail SMTP asynchronously.
    """
    reset_link = f"http://localhost:5173/reset-password?token={token}"

    print("\n" + "=" * 55)
    print(f"  🔑 PASSWORD RESET LINK FOR: {email_to}")
    print(f"  👉 URL: {reset_link}")
    print("=" * 55 + "\n")
    logger.info(f"Generated password reset link for {email_to}: {reset_link}")

    text_body = f"""Hi there,

You requested to reset your password for AI Test Agent.
Click the link below to reset your password:

{reset_link}

This link will expire in 15 minutes.
If you did not request this, please ignore this email.

Best regards,
AI Test Agent Team
"""

    html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #090d16;
      color: #f8fafc;
      margin: 0;
      padding: 32px 16px;
    }}
    .container {{
      max-width: 480px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 36px 28px;
    }}
    .btn {{
      display: inline-block;
      background: #06b6d4;
      color: #020617 !important;
      font-weight: 700;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 12px;
      margin: 20px 0;
    }}
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Password</h2>
    <p>We received a request to reset your password. Click the button below to choose a new password:</p>
    <a class="btn" href="{reset_link}" target="_blank">Reset Password</a>
    <p style="font-size:12px; color:#64748b;">This link will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
  </div>
</body>
</html>"""

    return await asyncio.to_thread(_send_email_sync, email_to, "Reset Your Password - AI Test Agent", text_body, html_body)


def _check_smtp_auth_on_startup():
    """Performs an async non-blocking verification of SMTP credentials in the background."""
    try:
        sender_email, sender_password, smtp_server, smtp_port = _get_smtp_credentials()
        if not sender_email or "your-email" in sender_email or not sender_password or "your-app-password" in sender_password:
            return
        with smtplib.SMTP(smtp_server, smtp_port, timeout=8) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(sender_email, sender_password)
            print(f"[EMAIL-TEST] 🎉 Gmail SMTP authenticated successfully as {sender_email}! Emails are ready to send.\n")
    except Exception as e:
        print(f"[EMAIL-TEST] ⚠️ Note: Gmail SMTP check reported: {e}\n")

# Run non-blocking check on import so logs immediately show authentication status
threading.Thread(target=_check_smtp_auth_on_startup, daemon=True).start()
