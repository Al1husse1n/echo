from django.shortcuts import render
from django.contrib.auth import login,logout, authenticate
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json
from django.core.exceptions import ValidationError
from .models import *

def home(request):
    return render(request, 'main/home.html')

def auth(request):
    return render(request, 'main/auth.html')

def chat(request):
    return render(request, 'main/chat.html')

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
        print(future_profile)
        
        return JsonResponse({"message": "Future profile successfully saved"}, status=200)
    
    except ValidationError as e:
        return JsonResponse({"errors": e.message_dict}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

