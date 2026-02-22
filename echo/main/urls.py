from django.urls import path
from . import views
from django.views.generic import RedirectView

urlpatterns= [
    path('home/', views.home, name="home"),
    path('', RedirectView.as_view(url='/chat/', permanent=True)),
    path('auth/', views.auth, name='auth'),
    path('chat/', views.chat, name="chat"),
    path('authentication/', views.authentication, name="authentication"),
    path('profileform/', views.profile_form, name='profileform'),
    path('create_goal/', views.create_goal, name='creategoal'),
    path('getroadmap/<str:goal_id>', views.get_roadmap, name='getroadmap'),
    path('updatestatus/<str:phase_id>', views.update_status, name='updatestatus'),
    path('deletegoal/<str:goal_id>', views.delete_goal, name='deletegoal'),
    path('sendmessage/', views.send_message, name='send_message'),
    path('logout/', views.logout_view, name='logout'),
]