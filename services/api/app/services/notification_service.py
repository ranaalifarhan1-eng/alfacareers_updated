import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger("notification_service")


class NotificationService:
    """Unified Notification Service for in-app alerts and email dispatches."""

    @staticmethod
    def notify_candidate_applied(candidate_name: str, candidate_email: str, job_title: str, employer_email: str):
        """Notify employer when a candidate submits an application."""
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        print("\n" + "="*70)
        print(f"  [EVENT DISPATCH: candidate_applied] @ {timestamp}")
        print(f"  To Employer: {employer_email}")
        print(f"  Subject: New Application Received for '{job_title}'")
        print(f"  Body: Candidate '{candidate_name}' ({candidate_email}) has applied.")
        print("="*70 + "\n")
        logger.info(f"Notification sent to {employer_email} for candidate application by {candidate_email}")

    @staticmethod
    def notify_stage_updated(candidate_name: str, candidate_email: str, job_title: str, new_stage: str):
        """Notify candidate when employer updates their application stage."""
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        stage_display = new_stage.replace("_", " ").capitalize()
        print("\n" + "="*70)
        print(f"  [EVENT DISPATCH: stage_updated] @ {timestamp}")
        print(f"  To Candidate: {candidate_email}")
        print(f"  Subject: Application Status Update: '{job_title}'")
        print(f"  Body: Hi {candidate_name}, your application for '{job_title}' is now '{stage_display}'.")
        print("="*70 + "\n")
        logger.info(f"Notification sent to {candidate_email} for stage update to '{new_stage}'")

    @staticmethod
    def notify_job_moderated(employer_email: str, job_title: str, status: str):
        """Notify employer when admin approves or rejects their job post."""
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        print("\n" + "="*70)
        print(f"  [EVENT DISPATCH: job_moderated] @ {timestamp}")
        print(f"  To Employer: {employer_email}")
        print(f"  Subject: Job Moderation Result: '{job_title}'")
        print(f"  Body: Your posting '{job_title}' status is now '{status.upper()}'.")
        print("="*70 + "\n")
        logger.info(f"Notification sent to {employer_email} for job moderation status '{status}'")
