from django.shortcuts import render

def home(request):
    return render(request, 'main/home.html')

def auth(request):
    return render(request, 'main/auth.html')

def chat(request):
    return render(request, 'main/chat.html')