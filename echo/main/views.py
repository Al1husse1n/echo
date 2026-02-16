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

