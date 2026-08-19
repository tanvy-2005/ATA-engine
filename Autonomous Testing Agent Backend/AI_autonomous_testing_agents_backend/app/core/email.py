import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import os

logger = logging.getLogger(__name__)

async def send_verification_email(email_to: str, verification_code: str):
    """
    Sends a 6-digit verification code to the user using Gmail SMTP.
    """
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    
    # Retrieve credentials from environment
    sender_email = os.getenv("SMTP_EMAIL", "") 
    sender_password = os.getenv("SMTP_PASSWORD", "")
    
    email_body = f"""
    Hi there,
    
    Your 6-digit verification code for AI Test Agent is: {verification_code}
    
    This code will expire in 15 minutes.
    """
    
    print("\n==========================================")
    print(f"Generated verification code for {email_to}: {verification_code}")
    print("==========================================\n")
    logger.info(f"Generated verification code for {email_to}: {verification_code}")
    
    if not sender_email or not sender_password or "your-email" in sender_email or "your-app-password" in sender_password:
        logger.warning("SMTP_EMAIL or SMTP_PASSWORD is not configured! Simulating email send only.")
        return True
        
    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = email_to
        msg['Subject'] = "Your Verification Code"
        msg.attach(MIMEText(email_body, 'plain'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        logger.info(f"Verification email sent to {email_to}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        # We return True anyway so the signup doesn't fail completely during local testing
        return True

async def send_password_reset_email(email_to: str, token: str):
    """
    Sends a password reset link to the user using Gmail SMTP.
    """
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    
    sender_email = os.getenv("SMTP_EMAIL", "") 
    sender_password = os.getenv("SMTP_PASSWORD", "")
    
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    email_body = f"""
    Hi there,
    
    You requested to reset your password for AI Test Agent.
    Click the link below to reset your password:
    
    {reset_link}
    
    This link will expire in 15 minutes.
    If you did not request this, please ignore this email.
    """
    
    print("\n==========================================")
    print(f"Generated Password Reset Link for {email_to}:")
    print(reset_link)
    print("==========================================\n")
    logger.info(f"Generated password reset link for {email_to}: {reset_link}")
    
    if not sender_email or not sender_password:
        return True
        
    try:
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = email_to
        msg['Subject'] = "Reset Your Password"
        msg.attach(MIMEText(email_body, 'plain'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        logger.info(f"Password reset email sent to {email_to}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return True
