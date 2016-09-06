from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.http import Http404, HttpResponse

from events.models import *
from events.serializers import *
from events.permissions import *
from events import parser

class CalendarList(APIView):
  permission_classes = (IsOwner,)

  def get(self, request, format=None):
    calendars = Calendar.objects.filter(owner=request.user)
    serializer = CalendarSerializer(calendars, many=True)
    return Response(serializer.data)

  def post(self, request, format=None):
    serializer = CalendarSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
      serializer.save()
      return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(construct_error_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

class CalendarDataSourceList(APIView):
  permission_classes = (IsOwner,)

  def post(self, request, pk, format=None):
    try:
      calendar = Calendar.objects.get(pk=pk)
    except Calendar.DoesNotExist:
      raise Http404
    self.check_object_permissions(self.request, calendar)
    serializer = DataSourceSerializer(data=request.data, context={'calendar': calendar})
    if serializer.is_valid():
      data_source = serializer.save()
      ## Confirmed that data is valid, so now let's pull down the events and save them to the DB
      events_data = parser.parse_html(request.data['html'], data_source)
      parser.save_parsed_events(events_data, data_source)
      return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(construct_error_response(serializer.errors), status=status.HTTP_400_BAD_REQUEST)

class CalendarDataSourceDetail(APIView):
  permission_classes = (IsOwner,)

  def put(self, request, cal_pk, source_pk, format=None):
    try:
      calendar = Calendar.objects.get(pk=cal_pk)
    except Calendar.DoesNotExist:
      raise Http404
    try:
      data_source = DataSource.objects.get(pk=source_pk)
    except DataSource.DoesNotExist:
      raise Http404

    data_source.calendars.clear()
    calendar.data_sources.add(data_source)

    return Response('Changed calendar of data source %s to calendar %s.' % (data_source.name, calendar.name), status=status.HTTP_200_OK)

def get_calendar_ics(request, pk):
  try:
    calendar = Calendar.objects.get(pk=pk)
  except Calendar.DoesNotExist:
    return HttpResponse(status=404, reason='Calendar with id "%d" does not exist.' % pk)

  serializer = CalendarICSSerializer(calendar)
  return HttpResponse(serializer.data, content_type='text/calendar')

def construct_error_response(serializer_errors):
  return {
    'detail': 'Error(s) found with submitted fields.',
    'errors': serializer_errors
  }