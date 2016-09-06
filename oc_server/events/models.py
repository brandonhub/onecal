from __future__ import unicode_literals

from django.db import models
from django.contrib.auth.models import User

class DataSource(models.Model):
  name = models.CharField(max_length=100)
  url = models.CharField(max_length=1000)
  root_selector = models.CharField(max_length=1000)
  repeater_selector = models.CharField(max_length=1000)
  starting_year = models.IntegerField()
  header_first = models.BooleanField()

  def __unicode__(self):
    return self.name

class DataField(models.Model):
  DATA_FIELD_NAME_CHOICES = (
    ('date', 'date'),
    ('title', 'title'),
    ('detail', 'detail'),
  )

  data_source = models.ForeignKey(DataSource, related_name='data_fields')
  name = models.CharField(max_length=100, choices=DATA_FIELD_NAME_CHOICES)
  selector = models.CharField(max_length=1000)
  data_format = models.CharField(max_length=100, null=True, blank=True)

  def __unicode__(self):
    return '%s: %s' % (self.data_source.name, self.name)

class Calendar(models.Model):
  owner = models.ForeignKey(User)
  name = models.CharField(max_length=100)
  data_sources = models.ManyToManyField(DataSource, related_name='calendars', blank=True)

  def __unicode__(self):
    return self.name

class Event(models.Model):
  data_source = models.ForeignKey(DataSource, related_name='events')
  date = models.DateField()
  title = models.CharField(max_length=1000)
  detail = models.TextField(null=True, blank=True)
  uid = models.CharField(max_length=50)
  time_created = models.DateTimeField(auto_now_add=True)

  def __unicode__(self):
    return '%s @ %s' % (self.title, str(self.date))