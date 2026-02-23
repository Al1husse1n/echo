from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import login,logout, authenticate
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
import json
from django.core.exceptions import ValidationError
from .models import *
from agent.roadmap import generate_roadmap
from agent.message_tool import send_ai_message
from django.core.mail import send_mail

@login_required
def home(request):
    return render(request, 'main/home.html')


def auth(request):
    return render(request, 'main/auth.html')

@login_required
def chat(request):
    current_user =  request.user
    goals = current_user.goals.all()
    return render(request, 'main/chat.html', {"goals": goals})

@csrf_exempt
def authentication(request):
    if request.method != "POST":
        return JsonResponse({"error":"only POST requests are allowed"}, status=405)
    
    try:
        data = json.loads(request.body)
        if data.get("type") == "signup":
            username = data.get("username") 
            email = data.get("email")
            password = data.get("password")
            user = User(username=username, email=email)
            user.set_password(password)
            user.full_clean()
            user.save()
            user = authenticate(request, username=username, password=password)
            login(request, user)
            send_mail(
                "Welcome to Echo!",
                "Congrats on joining",
                "alihusseinali1284@gmail.com",
                [user.email]   
            )
            return JsonResponse({"message":"sign up successful"}, status=201)
        
        elif data.get("type") == "login":
            username = data.get("username")
            password = data.get("password")
            user = authenticate(request, username=username, password=password)
            if user:
                login(request,user)
                return JsonResponse({"message":"login successful"}, status=200)
            else:
                return JsonResponse({"error": "Invalid credentials"},status=401)
            
    except ValidationError as e:
        return JsonResponse({"errors": e.message_dict}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
@login_required
def profile_form(request):
    if request.method != 'POST':
        return JsonResponse({"error":"only POST request is allowed"}, status=405)
    
    try:
        current_user = request.user
        data = json.loads(request.body)
        target_year = data.get("target_year")
        identity_description = data.get("identity_description")
        core_values = data.get("core_values")
        long_term_goals = data.get("long_term_goals")
        anticipated_regrets = data.get("anticipated_regrets")
        current_limitations = data.get("current_limitations")
        preferred_tone = data.get("preferred_tone")
        commitment_reason = data.get("commitment_reason")
        
        future_profile = FutureProfile(
            user = current_user,
            target_year= int(target_year),
            identity_description= identity_description,
            core_values= core_values,
            long_term_goals= long_term_goals,
            anticipated_regrets= anticipated_regrets,
            current_limitations= current_limitations,
            preferred_tone= preferred_tone,
            commitment_reason= commitment_reason
        )
        future_profile.full_clean()
        future_profile.save()
        
        return JsonResponse({"message": "Future profile successfully saved"}, status=200)
    
    except ValidationError as e:
        return JsonResponse({"errors": e.message_dict}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt  
@login_required  
def create_goal(request):
    if request.method != "POST":
        return JsonResponse({"error":"only POST request is allowed"}, status=405)
    try:
        current_user = request.user
        data = json.loads(request.body)
        goal_title = data.get("title")
        goal_description = data.get("description")
        goal_deadline = data.get("deadline")
        
        goal = Goal(
            user = current_user,
            title = goal_title,
            description = goal_description,
            deadline = goal_deadline
        )

        #generate roadmap
        ai_roadmap = generate_roadmap(goal_title, goal_description, goal_deadline)
        print(ai_roadmap)
        if ai_roadmap.get("error"):
            print(ai_roadmap.get("error"))
            return JsonResponse({"error": ai_roadmap.get("error")}, status=400)
        else:
            goal.full_clean()
            goal.save()
            print(goal)
            roadmap = Roadmap(
                goal = goal,
                summary = ai_roadmap.get("summary")
            )
            roadmap.full_clean()
            roadmap.save()
            print(roadmap)

            for phase in ai_roadmap.get("phases"):
                roadmap_phase = RoadmapPhase(
                    roadmap = roadmap,
                    phase_order = phase.get("phase_order"),
                    title = phase.get("title"),
                    description = phase.get("description"),
                    completion_criteria = [criteria for criteria in phase.get("completion_criteria", ["none"])]
                )
                if ai_roadmap.get("phases").index(phase) == 0:
                    roadmap_phase.status = "in_progress"

                roadmap_phase.full_clean()
                roadmap_phase.save()
                print(roadmap_phase)
            return JsonResponse({"goal_id": f"{goal.id}"}, status=200) 
    except ValidationError as e:
        return JsonResponse({"errors": e.message_dict}, status=400)
    
    except Exception as e:
        return JsonResponse({"error": str(e)})

@login_required
def get_roadmap(request, goal_id):
    if request.method != "GET":
        return JsonResponse({"error": "only GET requests are allowed"}, status=405)
    try:
        phases = {}
        goal = Goal.objects.get(pk=int(goal_id))
        print(goal)
        roadmap_phases = goal.roadmap.phases.all() 
        print(roadmap_phases)
        for phase in roadmap_phases:
            phases[phase.id] = phase.serialize()

        return JsonResponse(phases, status = 200)
    except Goal.DoesNotExist:
        return JsonResponse({"error": "Goal does not exist"}, status = 404)
    except Exception as e:
        return JsonResponse({"error" : str(e)}, status=500)
    

@login_required
def update_status(request, phase_id):
    if request.method != "GET":
        return JsonResponse({"error": "only GET requests are allowed"}, status=405)
    
    try:
        id = int(phase_id)
        phase = RoadmapPhase.objects.get(pk=id)
        goal = phase.roadmap.goal
        print(phase)
        phase.status = "completed"
        phase.save()
        # Find the next phase by ordering (use phase_order) within the same roadmap
        next_phase = RoadmapPhase.objects.filter(
            roadmap=phase.roadmap,
            phase_order=phase.phase_order + 1
        ).first()

        if not next_phase:
            return HttpResponse(status=204)

        next_phase.status = "in_progress"
        next_phase.save()
        return JsonResponse({"next_phase": f"{next_phase.id}"}, status=200)
    
    except RoadmapPhase.DoesNotExist:
        return JsonResponse({"error":"Phase does not exist"}, status=404)
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@login_required
def delete_goal(request, goal_id):
    if request.method != "DELETE":
        return JsonResponse({"error":"only DELETE requests are allowed"}, status=405)
    
    try:
        goal = Goal.objects.get(id=int(goal_id))
        goal.delete()
        return JsonResponse({"message": "goal deleted successfully"}, status=200)

    except Goal.DoesNotExist:
        return JsonResponse({"error" : "Goal doesnot exist"}, status=404)
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
@csrf_exempt    
@login_required
def send_message(request):
    if request.method != "POST":
        return JsonResponse({"error":"only POST requests are allowed"}, status=405)
    
    try:
        current_user = request.user

        data = json.loads(request.body)
        goal_id = int(data.get("goal_id"))
        user_content = data.get("user_message")
        goal = Goal.objects.get(pk=goal_id)
        print(goal)


        #save user message
        user_message = ChatMessage(
            user = current_user,
            sender = "user",
            content = user_content,
            related_goal = goal
        )
        user_message.full_clean()
        user_message.save()

        ai_response = send_ai_message(current_user.id,user_content, goal)
        print(ai_response)
        print("here3")

        #save ai message
        ai_message = ChatMessage(
            user = current_user,
            sender = "echo",
            content = ai_response,
            related_goal = goal
        )
        print("here4")
        ai_message.full_clean()
        ai_message.save()
        print("here5")
        return JsonResponse({"ai_content": ai_response}, status=200)
    
    except Goal.DoesNotExist:
        return JsonResponse({"error" : "Goal wasn't found"}, status=404)
    except ValidationError as e:
        return JsonResponse({"errors" : e.message_dict}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@login_required
def logout_view(request):
    logout(request)
    return redirect('auth')

    

        
        
        



    

