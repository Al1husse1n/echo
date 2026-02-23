from dotenv import load_dotenv
from dataclasses import dataclass
from django.utils import timezone
from main.models import User, FutureProfile, Goal,Roadmap, ChatMessage

load_dotenv()

NOTIFICATION_SYSTEM_PROMPT = """
You are Echo — a reflective message generator representing the user's future self.

You generate short, meaningful notification messages when the user has been inactive.

You do NOT ask questions.
You do NOT start conversations.
You do NOT give tutorials.

Your purpose is to:
- Remind the user of who they said they wanted to become
- Reflect on patterns of delay or silence
- Gently reconnect present actions with future identity

Context you may receive:
- FutureProfile (identity, values, regrets, tone)
- Active goal and roadmap progress (if exists)
- Time since last activity (in days)
- Last known roadmap phase (if exists)

Rules:
1. Always respect the user's preferred_tone.
2. Keep messages under 3 sentences.
3. Avoid generic motivational phrases.
4. Reference identity, values, or regret — not deadlines.
5. Never shame the user.
6. Never mention "AI", "system", or "notification".

You are writing a quiet message the user will read later.
"""

@dataclass
class NotificationContext:
    user_id: int
    username: str

    # Future profile
    target_year: int
    identity_description: str
    core_values: list
    long_term_goals: str
    anticipated_regrets: str
    current_limitations: str
    preferred_tone: str
    commitment_reason: str

    # Optional goal context
    goal_title: str | None = None
    goal_status: str | None = None
    goal_deadline: str | None = None

    # Optional roadmap context
    roadmap_summary: str | None = None
    phase_title: str | None = None
    phase_status: str | None = None

    inactivity_days: int = 0


def build_notification_context(user: User, inactivity_days: int) -> NotificationContext:
    profile = FutureProfile.objects.get(user=user)

    active_goal = (
        Goal.objects
        .filter(user=user, status="active")
        .first()
    )

    roadmap = None
    current_phase = None

    if active_goal:
        roadmap = Roadmap.objects.filter(goal=active_goal).first()
        if roadmap:
            current_phase = roadmap.phases.filter(status="in_progress").first()

    return NotificationContext(
        user_id=user.id,
        username=user.username,

        target_year=profile.target_year,
        identity_description=profile.identity_description,
        core_values=profile.core_values,
        long_term_goals=profile.long_term_goals,
        anticipated_regrets=profile.anticipated_regrets,
        current_limitations=profile.current_limitations,
        preferred_tone=profile.preferred_tone,
        commitment_reason=profile.commitment_reason,

        goal_title=active_goal.title if active_goal else None,
        goal_status=active_goal.status if active_goal else None,
        goal_deadline=active_goal.deadline if active_goal else None,

        roadmap_summary=roadmap.summary if roadmap else None,
        phase_title=current_phase.title if current_phase else None,
        phase_status=current_phase.status if current_phase else None,

        inactivity_days=inactivity_days
    )


def generate_inactivity_notification(user: User, inactivity_days: int) -> str:
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain.agents import create_agent
    context = build_notification_context(user, inactivity_days)

    system_prompt = NOTIFICATION_SYSTEM_PROMPT

    model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.6  # calm, reflective
    )

    agent = create_agent(
        model=model,
        context_schema=NotificationContext
    )

    response = agent.invoke(
        {
            "messages": [
                {"role": "system", "content": system_prompt}
            ]
        },
        context=context
    )

    return response.content.strip()
