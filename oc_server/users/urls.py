from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns

from users import views

urlpatterns = [
    url(r'^tokens/$', views.get_auth_token),
    url(r'^$', views.create_user),
]

urlpatterns = format_suffix_patterns(urlpatterns)