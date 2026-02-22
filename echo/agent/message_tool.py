import json
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict, Union

from dotenv import load_dotenv
from django.utils import timezone

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.schema import SystemMessage, HumanMessage

from main.models import User, FutureProfile, Goal, Roadmap, ChatMessage


load_dotenv()


# =========================
# SYSTEM PROMPT
# =========================

system_prompt = """
You are a reflective AI chatbot that is a simulated version of the user's future self.
You respond as if it were that future version, looking back with perspective.
You turn self-development into a conversation.
You are also an AI personal coach.

CORE BEHAVIOR:
1. Respond in the user's preferred_tone.
2. Use their core values and long-term vision.
3. Focus on concrete, actionable steps.
4. Reference the current roadmap phase when available.
5. Avoid generic or motivational filler.
6. Align daily behavior with long-term identity.
7. Build self-awareness through dialogue.

FORMATTING RULES (VERY IMPORTANT):
- Always use short paragraphs (max 2 lines each).
- Never write large blocks of text.
- Use clear section headers when explaining.
- Prefer numbered or bulleted lists over paragraphs.
- Use emojis ONLY as section markers (📌 💡 1️⃣ 2️⃣).
- Bold text ONLY for headers or key labels, never inside full sentences.
- Present advice in a scannable, chat-friendly format.
- If giving steps, limit to 3–5 steps max.
- Write as if the user is reading on a phone.
- instead using this ** add a new line \n for new lines

DEFAULT RESPONSE STRUCTURE:
1. One short reflective opening (1–2 lines).
2. A clear section header.
3. A short list of actionable steps.
4. One encouraging closing line.

Do NOT:
- Write essays
- Overuse bold text
- Repeat the same idea in multiple ways
- Explain obvious concepts
"""

# =========================
# DATA CLASSES
# =========================

@dataclass
class NoGoalsContext:
    user_id: int
    username: str
    target_year: Optional[int]
    identity_description: Optional[str]
    core_values: Optional[List[str]]
    long_term_goals: Optional[str]
    anticipated_regrets: Optional[str]
    current_limitations: Optional[str]
    preferred_tone: Optional[str]
    commitment_reason: Optional[str]


@dataclass
class FullContext(NoGoalsContext):
    goal_title: Optional[str]
    goal_description: Optional[str]
    goal_deadline: Optional[str]
    goal_status: Optional[str]

    roadmap_summary: Optional[str]
    phases_total: int
    phases_completed: int

    phase_order: Optional[int]
    phase_status: Optional[str]
    phase_title: Optional[str]
    phase_description: Optional[str]

    recent_messages: List[Dict]


# =========================
# CONTEXT BUILDER
# =========================

def get_user_context(user_id: int, goal: Optional[Goal] = None) -> Union[NoGoalsContext, FullContext]:
    user = User.objects.get(id=user_id)

    # -------- Future Profile --------
    try:
        profile = FutureProfile.objects.get(user=user)
    except FutureProfile.DoesNotExist:
        profile = None

    base_data = {
        "user_id": user.id,
        "username": user.username,
        "target_year": getattr(profile, "target_year", None),
        "identity_description": getattr(profile, "identity_description", None),
        "core_values": getattr(profile, "core_values", None),
        "long_term_goals": getattr(profile, "long_term_goals", None),
        "anticipated_regrets": getattr(profile, "anticipated_regrets", None),
        "current_limitations": getattr(profile, "current_limitations", None),
        "preferred_tone": getattr(profile, "preferred_tone", "encouraging"),
        "commitment_reason": getattr(profile, "commitment_reason", None),
    }

    # If no goal → return minimal context
    if not goal:
        return NoGoalsContext(**base_data)

    # -------- Roadmap --------
    try:
        roadmap = Roadmap.objects.get(goal=goal)
        phases_completed = roadmap.phases.filter(status="completed").count()
        phases_total = roadmap.phases.count()
        current_phase = roadmap.phases.filter(status="in_progress").first()
    except Roadmap.DoesNotExist:
        roadmap = None
        phases_completed = 0
        phases_total = 0
        current_phase = None

    # -------- Chat History --------
    chats = (
        ChatMessage.objects
        .filter(related_goal=goal)
        .order_by("-created_at")[:5]
    )

    recent_messages = [
        {
            "sender": chat.sender,
            "content": chat.content,
            "created_at": chat.created_at.isoformat(),
        }
        for chat in chats
    ]

    return FullContext(
        **base_data,
        goal_title=getattr(goal, "title", None),
        goal_description=getattr(goal, "description", None),
        goal_deadline=str(getattr(goal, "deadline", "")),
        goal_status=getattr(goal, "status", None),

        roadmap_summary=getattr(roadmap, "summary", None),
        phases_total=phases_total,
        phases_completed=phases_completed,

        phase_order=getattr(current_phase, "phase_order", None),
        phase_status=getattr(current_phase, "status", None),
        phase_title=getattr(current_phase, "title", None),
        phase_description=getattr(current_phase, "description", None),

        recent_messages=recent_messages,
    )


# =========================
# AI MESSAGE SENDER
# =========================

def send_ai_message(user_id: int, user_message: str, goal: Optional[Goal] = None) -> str:
    context = get_user_context(user_id, goal)

    model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.7
    )

    # Convert dataclass to JSON text
    context_text = json.dumps(asdict(context), indent=2, default=str)

    messages = [
        SystemMessage(content=system_prompt),
        SystemMessage(content=f"USER CONTEXT:\n{context_text}"),
        HumanMessage(content=user_message),
    ]

    response = model.invoke(messages)

    return response.content