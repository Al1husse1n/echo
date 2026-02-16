from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username
    
    
class FutureProfile(models.Model):
    TONE_CHOICES = [
        ("gentle", "Gentle & reassuring"),
        ("honest", "Honest & firm"),
        ("minimal", "Minimal & reflective"),
        ("motivational", "Motivational but calm"),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="future_profile"
    )

    target_year = models.PositiveIntegerField()

    identity_description = models.TextField()
    core_values = models.JSONField()

    long_term_goals = models.TextField()
    anticipated_regrets = models.TextField()
    current_limitations = models.TextField()

    preferred_tone = models.CharField(
        max_length=20,
        choices=TONE_CHOICES,
        default="gentle"
    )

    commitment_reason = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} → {self.target_year}"
    

class Goal(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("paused", "Paused"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="goals"
    )

    future_profile = models.ForeignKey(
        FutureProfile,
        on_delete=models.CASCADE,
        related_name="goals"
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title


class Roadmap(models.Model):
    CREATED_BY_CHOICES = [
        ("user", "User"),
        ("ai", "AI"),
    ]

    goal = models.OneToOneField(
        Goal,
        on_delete=models.CASCADE,
        related_name="roadmap"
    )

    created_by = models.CharField(
        max_length=10,
        choices=CREATED_BY_CHOICES,
        default="ai"
    )

    summary = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Roadmap for {self.goal.title}"


class RoadmapPhase(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    roadmap = models.ForeignKey(
        Roadmap,
        on_delete=models.CASCADE,
        related_name="phases"
    )

    phase_order = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["phase_order"]
        unique_together = ("roadmap", "phase_order")

    def __str__(self):
        return f"Phase {self.phase_order}: {self.title}"


class ChatMessage(models.Model):
    SENDER_CHOICES = [
        ("user", "User"),
        ("echo", "Echo"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="messages"
    )

    sender = models.CharField(
        max_length=10,
        choices=SENDER_CHOICES
    )

    content = models.TextField()

    related_goal = models.ForeignKey(
        Goal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} @ {self.created_at}"


class Notification(models.Model):
    SOURCE_CHOICES = [
        ("future_self", "Future Self"),
        ("system", "System"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    content = models.TextField()

    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="future_self"
    )

    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification → {self.user.username}"


