from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_agent
from dataclasses import dataclass
from django.utils import timezone
from main.models import User, FutureProfile, Goal,Roadmap, ChatMessage

load_dotenv()

system_prompt = """
Ypu are a reflective AI chatbot that is a simulated version of their future self
You respond as if it were that future version, looking back with perspective.
You turn self-development into a conversation
You are also an AI personal coach for the user {username}. 
Use the full context of their profile, goals, and roadmap to provide helpful, personalized responses. 

Context includes:
- Future profile: target_year, identity_description, core_values, long_term_goals, anticipated_regrets, current_limitations, preferred_tone, commitment_reason
- Goal: goal_title, goal_description, goal_deadline, goal_status
- Roadmap: roadmap_summary, phases_total, phases_completed
- Current roadmap phase: phase_order, phase_status, phase_title, phase_description
- Recent messages: last 5 messages between AI and user
- the context may not include the goals and roadmaps, since the user maybe new or deleted the goals
- if there are no goals and roadmaps, respond according to the future profile

Instructions:
1. Always respond in the user’s preferred_tone.
2. Use the user’s core values, goals, and long-term vision to provide advice or guidance.
3. Focus on actionable steps or insights for the current goal and roadmap phase.
4. Reference the roadmap phase if relevant.
5. Avoid generic advice; make it specific to the user's context.
6. Keep responses concise, encouraging, and clear.
7. Align daily behavior with long-term identity
8. Build self-awareness through dialogue


When responding, you may also reflect briefly on previous messages for continuity.
"""

#a new user with no goals saved
@dataclass
class NoGoals:
    user_id:int
    username:str
    #future Profile Context
    target_year:int
    identity_description:str
    core_values:list
    long_term_goals: str
    anticipated_regrets:str
    current_limitations:str
    preferred_tone:str
    commitment_reason:str
     

@dataclass
class Context:
    user_id:int
    username:str
    #future Profile Context
    target_year:int
    identity_description:str
    core_values:list
    long_term_goals: str
    anticipated_regrets:str
    current_limitations:str
    preferred_tone:str
    commitment_reason:str
    #goal context
    goal_title:str
    goal_description:str
    goal_deadline:str
    goal_status:str
    #roadmap summary
    roadmap_summary:str
    phases_total: int = 0
    phases_completed: int = 0
    #roadmap phase
    phase_order:int
    phase_status:str
    phase_title:str 
    phase_description:str

    #recent chat history
    recent_messages: list

def get_user_context(user_id:int, goal:Goal):
    user = User.objects.get(id=user_id)

    try:
        profile = FutureProfile.objects.get(user=user)
    except FutureProfile.DoesNotExist:
        profile = None
    
    try:
        roadmap = Roadmap.objects.get(goal=goal)
        phases_completed = roadmap.phases.filter(status="completed").count()
        phases_total = roadmap.phases.count()
        current_phase = roadmap.phases.filter(status="in_progress").first()
    except Roadmap.DoesNotExist:
            pass

    #fetch chat message
    chats = ChatMessage.objects.filter(related_goal=goal).order_by("-created_at")[:7]
    recent_messages = []

    for chat in chats:
         recent_messages.append(
              {
                   "sender": chat.sender,
                   "content": chat.content,
                   "created_at": chat.created_at
              }
         )
    
    context = Context(
        user_id= user_id,
        username= user.username,
        target_year= profile.target_year,
        identity_description= profile.identity_description,
        core_values= profile.core_values,
        long_term_goals = profile.long_term_goals,
        anticipated_regrets = profile.anticipated_regrets,
        current_limitations = profile.current_limitations,
        preferred_tone = profile.preferred_tone,
        commitment_reason = profile.commitment_reason,
        goal_title = goal.title,
        goal_description = goal.description,
        goal_deadline = goal.deadline,
        goal_status = goal.status,
        roadmap_summary = roadmap.summary,
        phases_total = phases_total,
        phases_completed = phases_completed,
        phase_order = current_phase.phase_order,
        phase_status = current_phase.status,
        phase_title = current_phase.title,
        phase_description = current_phase.description,
        recent_messages = recent_messages

    )

    return context

def send_ai_message(user_id:int, goal:Goal, user_message:str):
    context = get_user_context(user_id, goal)
    system_prompt = system_prompt.format(username=context.username)


    model = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash"
    )

    agent = create_agent(
        model=model,
        context_schema=Context
    )

    response = agent.invoke(
         {
              "messages":[
                   {"role": "system", "content": system_prompt},
                   {"role": "user", "content": user_message}
              ]
         }, 
         context = context
    )

    return response
