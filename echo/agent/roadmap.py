from dotenv import load_dotenv
import json
from google import genai


load_dotenv()

client=genai.Client()


def generate_roadmap(goal_title:str, goal_description:str, deadline:str=None):
    
    error_json = "{'error' : 'type your message here'}"
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
- goal title: {goal_title}
- goal description: {goal_description}
- if there is a deadline, the user may give you one: {deadline}
- if the goal given is beyond your knowledge based or if there's anything you dont understand or if anything is missing, or if there is a deadline and if that deadline already has passed send a JSON response with format:- {error_json}
so your only purpose is to generate the json(the error or the roadmap)
  

## YOUR TASK
Generate a phased learning/execution roadmap with clear phases and completion criteria.

## OUTPUT FORMAT
if there are no errors as specified above, return a valid JSON object with this exact structure:

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
    response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=prompt,
            config={
                "response_mime_type": "application/json"
            }
    )

    return (json.loads(response.text))


