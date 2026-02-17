from django.core.management.base import BaseCommand
from django.utils.timezone import now
from datetime import timedelta

from main.models import User, ChatMessage, Notification
from agent.notification import generate_inactivity_notification
from django.core.mail import send_mail

class Command(BaseCommand):
    help = "Send inactivity notifications"

    def handle(self, *args, **options):
        today = now()

        for user in User.objects.all():
            last_msg = (
                ChatMessage.objects
                .filter(user=user)
                .order_by("-created_at")
                .first()
            )

            if not last_msg:
                continue

            inactivity_days = (today - last_msg.created_at).days

            if 7 <= inactivity_days <= 16 and (inactivity_days - 7) % 3 == 0:
                # Prevent duplicates
                already_sent = Notification.objects.filter(
                    user=user,
                    content__icontains=f"{inactivity_days} days"
                ).exists()

                if not already_sent:
                    message = generate_inactivity_notification(user, inactivity_days)
                    Notification.objects.create(
                        user=user,
                        content= message,
                        source="future_self"
                    )
                    send_mail(
                        subject="Your future self is waiting",
                        message=message,
                        from_email="ali.hussein-ug@aau.edu.et",
                        recipient_list=[user.email],
                    )


                    self.stdout.write(
                        f"Sent inactivity notification to {user.username}"
                    )
