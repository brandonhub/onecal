import json
import urllib2

from django.test import TestCase
from django.test import Client
from django.contrib.auth.models import User

from events.models import *
from events.serializers import *
from events import parser
from events import ical_generator
from users.utils import *

test_user_email = 'test@test.com'
test_user_password = 'MEEKS_PLACEHOLDER'

class FullInitialPipelineTestCase(TestCase):

  ##############################
  ###  Supporting functions  ###
  ##############################

  def create_user(self):
    test_user_data = {
      'email': test_user_email,
      'password': test_user_password
    }
    response = Client().post('/users/', json.dumps(test_user_data), 'application/json')
    return response

  def fetch_token(self, return_response=False):
    test_user_data = {
      'email': test_user_email,
      'password': test_user_password
    }
    response = Client().post('/users/tokens/', json.dumps(test_user_data), 'application/json')
    if return_response:
      return response
    return response.json()['token']

  def create_calendar(self, token, return_response=False):
    calendar_data = {
      'name': 'Test Calendar Name'
    }
    response = Client().post('/events/calendars/', json.dumps(calendar_data), 'application/json', HTTP_AUTHORIZATION='Token ' + token)
    if return_response:
      return response
    return response.json()

  def fetch_calendars(self, token, return_response=False):
    response = Client().get('/events/calendars/', HTTP_AUTHORIZATION='Token ' + token)
    if return_response:
      return response
    return response.json()

  def create_data_source(self, token, calendar_id, return_response=False):
    html = urllib2.urlopen('https://s3-us-west-1.amazonaws.com/onecal/testing/raw_html_input_test.html').read()

    date_data_field = {
      'name': 'date',
      'selector': 'td.date',
      'data_format': '%m/%d/%Y'
    }

    title_data_field = {
      'name': 'title',
      'selector': 'td.title'
    }

    detail_data_field = {
      'name': 'detail',
      'selector': 'td.detail'
    }

    data_source = {
      'name': 'Test Data Source 1',
      'url': 'https://s3-us-west-1.amazonaws.com/onecal/testing/raw_html_input_test.html',
      'html': html,
      'root_selector': 'html > body > table',
      'repeater_selector': 'tr',
      'starting_year': 2016,
      'header_first': False,
      'data_fields': [date_data_field, title_data_field, detail_data_field]
    }

    response = Client().post('/events/calendars/' + str(calendar_id) + '/sources/', json.dumps(data_source), 'application/json', HTTP_AUTHORIZATION='Token ' + token)
    if return_response:
      return response
    return response.json()

  ###############
  ###  Tests  ###
  ###############

  def test_user_creation(self):
    response = self.create_user()
    self.assertEqual(response.status_code, 201)

  def test_token_fetching(self):
    self.create_user()
    response = self.fetch_token(True)
    self.assertEqual(response.status_code, 200)

  def test_calendar_creation(self):
    self.create_user()
    token = self.fetch_token()
    response = self.create_calendar(token, True)
    self.assertEqual(response.status_code, 201)

  def test_calendar_fetching(self):
    self.create_user()
    token = self.fetch_token()
    self.create_calendar(token)
    response = self.fetch_calendars(token, True)
    self.assertEqual(response.status_code, 200)
    self.assertEqual(len(response.json()), 1)

  def test_data_source_creation(self):
    self.create_user()
    token = self.fetch_token()
    self.create_calendar(token)
    calendar = self.fetch_calendars(token)[0]
    response = self.create_data_source(token, calendar['id'], True)
    self.assertEqual(response.status_code, 201)

  def test_changing_data_source_calendar(self):
    self.create_user()
    token = self.fetch_token()
    self.create_calendar(token)
    self.create_calendar(token)
    current_calendar_id = self.fetch_calendars(token)[0]['id']
    self.create_data_source(token, current_calendar_id)

    data_source_id = 0
    destination_calendar_id = 0
    calendars = self.fetch_calendars(token)
    for calendar_data in calendars:
      if len(calendar_data['data_sources']) != 0:
        data_source_id = calendar_data['data_sources'][0]['id']
      else:
        destination_calendar_id = calendar_data['id']

    response = Client().put('/events/calendars/%d/sources/%d/' % (destination_calendar_id, data_source_id), 'application/json', HTTP_AUTHORIZATION='Token ' + token)
    self.assertEqual(response.status_code, 200)

  def test_ical_endpoint(self):
    self.create_user()
    token = self.fetch_token()
    calendar_id = self.create_calendar(token)['id']
    self.create_data_source(token, calendar_id)

    response = Client().get('/events/calendars/' + str(calendar_id) + '.ics')
    self.assertEqual(response.status_code, 200)