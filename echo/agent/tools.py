from dotenv import load_dotenv
import os
from google import genai
from langchain.tools import tool, ToolRuntime

load_dotenv()
GEMINI_API_KEY=os.getenv("GEMINI_API_KEY")
client=genai.Client(api_key=GEMINI_API_KEY)

@tool('generate_roadmap', description=" Create a roadmap", return_direct=False)
def generate_roadmap(goal_title:str, goal_description, deadline:str=None):
    json_format = """
{
  "summary": "A concise 2-3 sentence overview of the entire learning path, what it covers, and what the user will achieve.",
  "phases": [
    {
      "phase_order": 1,
      "title": "Phase 1: [Clear Phase Name]",
      "description": "Detailed description of what this phase covers, why it's important, and what the user will learn. Include key concepts and skills to be developed.",
      "completion_criteria": [
        "Specific, measurable criterion 1",
        "Specific, measurable criterion 2",
        "Specific, measurable criterion 3"
      ],
      "resources": [
        {
          "title": "Resource name",
          "type": "tutorial|documentation|course|article|video|book",
          "url": "optional url if available"
        }
      ]
    }
  ]
}
"""
    prompt = f"""
You are the roadmap generation tool for the Builder Agent. Your sole purpose is to create structured, actionable roadmaps based on a goal.

## INPUT
You will receive:
- goal_title: {goal_title}
- goal_description: {goal_description}
- if there is a deadline, the user may give you one: {deadline}

## YOUR TASK
Generate a phased learning/execution roadmap with clear phases and completion criteria.

## OUTPUT FORMAT
Return a valid JSON object with this exact structure:

{json_format}

## RULES
1. Create 3-6 logical phases that build on each other
2. Each phase must have 2-4 specific, measurable completion criteria
3. Match complexity to user_level (beginner → more foundational phases)
4. Be practical and neutral - no motivational language
5. Never reference identity, values, or emotions
6. Never include meta-commentary about the tool or process

Generate the roadmap now:
"""