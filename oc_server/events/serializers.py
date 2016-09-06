from rest_framework import serializers

from events.models import *
from events import ical_generator

import random, string

class DataFieldSerializer(serializers.ModelSerializer):
  class Meta:
    model = DataField
    fields = ('name', 'selector', 'data_format')

class DataSourceSerializer(serializers.ModelSerializer):
  data_fields = DataFieldSerializer(many=True)

  class Meta:
    model = DataSource
    fields = ('id', 'url', 'name', 'root_selector', 'repeater_selector', 'starting_year', 'header_first', 'data_fields')

  def create(self, validated_data):
    ## Add data fields
    data_fields_data = validated_data.pop('data_fields')
    data_source = DataSource.objects.create(**validated_data)
    for data_field_data in data_fields_data:
      DataField.objects.create(data_source=data_source, **data_field_data)

    ## Add data source to calendar (passed through context from view)
    self.context['calendar'].data_sources.add(data_source)

    return data_source

class EventSerializer(serializers.ModelSerializer):
  class Meta:
    model = Event
    fields = ('date', 'title', 'detail', 'uid')

  def create(self, validated_data):
    return Event.objects.create(data_source=self.context['data_source'], **validated_data)

class ICalGeneratorEventSerializer(serializers.ModelSerializer):
  """
  Need this serializer because the ical generator requires a date object -- normal event serializer would make date field a string
  """
  date = serializers.SerializerMethodField()

  class Meta:
    model = Event
    fields = ('date', 'title', 'detail', 'time_created')

  def get_date(self, obj):
    return obj.date

  def get_time_created(self, obj):
    return obj.time_created

class CalendarICSSerializer(serializers.BaseSerializer):
  def to_representation(self, calendar):
    data_source_ids = calendar.data_sources.all().values_list('pk', flat=True)
    events_data = []
    for event in Event.objects.filter(data_source_id__in=data_source_ids):
      events_data.append({
        'date': event.date,
        'title': event.title,
        'detail': event.detail,
        'uid': event.uid,
        'time_created': event.time_created
      })
    return ical_generator.generate_ical(calendar.name, events_data)

class CalendarSerializer(serializers.ModelSerializer):
  data_sources = DataSourceSerializer(many=True, read_only=True)

  class Meta:
    model = Calendar
    fields = ('id', 'name', 'data_sources')

  def create(self, validated_data):
    return Calendar.objects.create(owner=self.context['request'].user, **validated_data)