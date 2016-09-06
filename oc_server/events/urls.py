from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns

from events import views

urlpatterns = [
	url(r'^calendars/(?P<cal_pk>[0-9]+)/sources/(?P<source_pk>[0-9]+)/$', views.CalendarDataSourceDetail.as_view()),
    url(r'^calendars/(?P<pk>[0-9]+)/sources/$', views.CalendarDataSourceList.as_view()),
    url(r'^calendars/(?P<pk>[0-9]+).ics$', views.get_calendar_ics),
    url(r'^calendars/$', views.CalendarList.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)