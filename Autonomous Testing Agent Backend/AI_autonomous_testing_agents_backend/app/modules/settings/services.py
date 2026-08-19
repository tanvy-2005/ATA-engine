import logging
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone
from typing import Dict, Any

logger = logging.getLogger(__name__)

async def send_digest_test_email(email_to: str, settings: Dict[str, Any]) -> bool:
    """
    Sends a formatted mock Digest Email to the specified recipient based on the provided settings.
    """
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    
    sender_email = os.getenv("SMTP_EMAIL", "")
    sender_password = os.getenv("SMTP_PASSWORD", "")
    
    digest_cfg = settings.get("digest", {})
    frequency = digest_cfg.get("frequency", "Daily")
    delivery_time = digest_cfg.get("deliveryTime", "08:00")
    tz = digest_cfg.get("timezone", "Asia/Kolkata")
    includes = digest_cfg.get("includes", {})

    now_str = datetime.now(timezone.utc).strftime("%B %d, %Y at %I:%M %p UTC")

    # Render dynamic HTML body matching frontend design
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>{frequency} Summary Digest</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #060b13; color: #e2e8f0; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #0b0d19; border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 16px; padding: 24px; }}
            .header {{ border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 16px; margin-bottom: 20px; }}
            .brand {{ font-size: 18px; font-weight: bold; color: #06b6d4; display: flex; align-items: center; gap: 8px; }}
            .title {{ font-size: 20px; font-weight: bold; color: #ffffff; margin-top: 12px; }}
            .meta {{ font-size: 12px; color: #94a3b8; font-family: monospace; margin-top: 4px; }}
            .section {{ background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 16px; margin-bottom: 16px; }}
            .section-title {{ font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #06b6d4; font-family: monospace; margin-bottom: 10px; }}
            .stat-grid {{ display: flex; gap: 12px; justify-content: space-between; }}
            .stat-box {{ flex: 1; background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.05); }}
            .stat-val {{ font-size: 22px; font-weight: bold; color: #10b981; }}
            .stat-val.fail {{ color: #f43f5e; }}
            .stat-val.total {{ color: #ffffff; }}
            .stat-label {{ font-size: 10px; text-transform: uppercase; color: #94a3b8; margin-top: 2px; }}
            .list-item {{ font-size: 12px; color: #cbd5e1; padding: 4px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.03); }}
            .footer {{ border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 16px; margin-top: 24px; text-align: center; font-size: 11px; color: #64748b; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="brand">⚡ Autonomous Testing Agent</div>
                <div class="title">{frequency} Test Summary Report</div>
                <div class="meta">Generated: {now_str} ({tz} timezone)</div>
            </div>
    """

    if includes.get("passFail", True):
        html_body += """
            <div class="section">
                <div class="section-title">✔ Pass/Fail Execution Summary</div>
                <div class="stat-grid">
                    <div class="stat-box">
                        <div class="stat-val">92.5%</div>
                        <div class="stat-label">Success Rate</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-val total">140</div>
                        <div class="stat-label">Total Cases</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-val fail">8</div>
                        <div class="stat-label">Failed Cases</div>
                    </div>
                </div>
            </div>
        """

    if includes.get("failedTests", True):
        html_body += """
            <div class="section">
                <div class="section-title">⚠️ Failed Test Cases</div>
                <div class="list-item" style="color: #f43f5e;">• checkout-flow-card-decline.spec.ts (Regression / Boundary)</div>
                <div class="list-item" style="color: #f43f5e;">• user-authentication-session-refresh.spec.ts (Smoke / Negative)</div>
            </div>
        """

    if includes.get("criticalIssues", True):
        html_body += """
            <div class="section">
                <div class="section-title">🚨 Critical Platform Issues</div>
                <div class="list-item">• Payment Gateway webhook signatures could not be verified (Timeout: 504 Gateway error).</div>
                <div class="list-item">• Token refresh middleware failed with 401 on 3 browser session simulations.</div>
            </div>
        """

    if includes.get("aiSuggestions", True):
        html_body += """
            <div class="section" style="background: rgba(6, 182, 212, 0.05);">
                <div class="section-title">✨ AI Agent Suggestions</div>
                <div style="font-size: 12px; font-style: italic; color: #a5f3fc;">
                    "We detected a 504 timeout regression during the Checkout flow. Check code in user-authentication middleware and verify API server container scaling rules."
                </div>
            </div>
        """

    html_body += """
            <div class="footer">
                You are receiving this digest because notification settings in your ATA account are enabled.<br>
                © 2026 Autonomous Testing Agent. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """

    print("\n==========================================")
    print(f"Triggering Test Digest Email to: {email_to}")
    print("==========================================\n")
    logger.info(f"Triggering Test Digest Email to: {email_to}")

    if not sender_email or not sender_password or "your-email" in sender_email or "your-app-password" in sender_password:
        logger.warning("SMTP credentials not set. Simulated digest email successfully.")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg['From'] = sender_email
        msg['To'] = email_to
        msg['Subject'] = f"[ATA Platform] {frequency} Testing Summary Digest"
        msg.attach(MIMEText(html_body, 'html'))

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        logger.info(f"Digest email sent successfully to {email_to}")
        return True
    except Exception as e:
        logger.error(f"Failed to send digest email: {str(e)}")
        return True

async def trigger_automated_event_notification(
    workspace_id: str,
    event_type: str,
    project_name: str,
    details: Dict[str, Any]
) -> bool:
    """
    Evaluates workspace notification settings and automatically dispatches an email alert
    when an automated pipeline event occurs.
    """
    from app.db.mongodb import db_client
    if db_client.db is None:
        return False
        
    try:
        settings = await db_client.db["notification_settings"].find_one({"workspaceId": workspace_id})
        if not settings:
            settings = {
                "emailNotifications": True,
                "events": {"completed": True, "failed": True, "criticalFailure": True, "started": False}
            }
            
        if not settings.get("emailNotifications", True):
            logger.info("Email notifications disabled for workspace.")
            return False
            
        events_config = settings.get("events", {})
        if not events_config.get(event_type, True):
            logger.info(f"Event notification '{event_type}' disabled in workspace settings.")
            return False
            
        user = await db_client.db["users"].find_one({"is_active": True})
        email_to = user.get("email") if user else "user@example.com"
        
        sender_email = os.getenv("SMTP_EMAIL", "")
        sender_password = os.getenv("SMTP_PASSWORD", "")
        
        subject = f"[ATA Platform Alert] Pipeline {event_type.upper()}: {project_name}"
        body_text = f"Automated Pipeline Event: {event_type.upper()}\nProject: {project_name}\nDetails: {details}"
        
        logger.info(f"Automatically triggering notification email for event '{event_type}' to {email_to}")
        
        if not sender_email or not sender_password or "your-email" in sender_email:
            logger.info(f"Simulating automatic notification mail for event '{event_type}' to {email_to}")
            return True
            
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = email_to
        msg['Subject'] = subject
        msg.attach(MIMEText(body_text, 'plain'))
        
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        logger.error(f"Failed to send automated event notification email: {e}")
        return False
