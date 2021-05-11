from django.urls import path, include


from django.contrib.auth.views import PasswordResetView, PasswordResetDoneView, PasswordResetConfirmView, \
    PasswordResetCompleteView
from .views import registration, view_specification, BaseView, view_graph
from .viewsOffice import viewAcc, addSpecification, remove_specification


urlpatterns = [
    path('', BaseView.as_view(), name='index'),
    path('registration/', registration, name='registration'),
    path('accounts/password_reset/', PasswordResetView.as_view(template_name="registration/password_reset.html",
                                                               subject_template_name='registration/reset_subject.txt',
                                                               email_template_name='registration/reset_email.txt'),
         name='reset_password'),
    path('accounts/password_reset/done/', PasswordResetDoneView.as_view(
        template_name="registration/password_reset_sent.html"),
         name='password_reset_done'),
    path('accounts/reset/<uidb64>/<token>/', PasswordResetConfirmView.as_view(
        template_name="registration/confirm_password.html"),
         name='password_reset_confirm'),
    path('accounts/reset/done/', PasswordResetCompleteView.as_view(
        template_name="registration/password_confirmed.html"),
         name='password_reset_complete'),

    path('accounts/', include('django.contrib.auth.urls')),
    path('private_office/', viewAcc, name='private_office'),
    path('private_office/add/', addSpecification, name='add_specification'),
    path('private_office/delete/<pk>', remove_specification, name='delete'),
    path('<int:pk>', view_specification, name='view_specification'),
    path('graph/<int:pk>', view_graph, name='view_graph'),
]
