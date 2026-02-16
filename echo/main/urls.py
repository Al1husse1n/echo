from django.urls import path
from . import views
from django.views.generic import RedirectView

urlpatterns= [
    path('home/', views.home, name="home"),
    path('', RedirectView.as_view(url='/home/', permanent=True)),
    path('auth/', views.auth, name='auth'),
    path('chat/', views.chat, name="chat"),
    path('authentication/', views.authentication, name="authentication"),
]