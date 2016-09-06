from bs4 import BeautifulSoup
from datetime import datetime
import urllib2

from events.serializers import *

def parse_html(raw_html, data_source):
  """
  Only root_selector should be absolute
    - repeater_selector should be relative to root_selector
    - each data field selector should be relative to repeater_selector

  TODO: Starting year doesn't work as it should because it lazily sets all dates to starting year
        Working correctly, only the first date should get the starting year and then it should determine if any of the dates cross into the next year

  """

  soup = BeautifulSoup(raw_html, 'html.parser')

  try:
    selectors = data_source.root_selector.split(' > ')
    root_node = soup
    while len(selectors) > 0:
      root_node = root_node.select(selectors.pop(0).lower())[0]
  except IndexError:
    raise Exception('Root node with selector "%s" not found.' % data_source.root_selector)

  events_data = []
  repeater_nodes = root_node.select(data_source.repeater_selector.lower())
  if data_source.header_first:
    del repeater_nodes[0]
  for repeater_node in repeater_nodes:
    event_data = {}
    event_data['uid'] = ''.join(random.choice(string.ascii_lowercase + string.digits) for i in range(10)) + '@onecal.dromolabs.com'
    for data_field in list(data_source.data_fields.all()):
      try:
        selectors = data_field.selector.split(' > ')
        data_node = repeater_node
        while len(selectors) > 0:
          data_node = data_node.select(selectors.pop(0).lower())[0]
      except IndexError:
        raise Exception('Data node with selector "%s" not found.' % data_field.selector)

      data = data_node.get_text()

      if data_field.name == 'date':
        data_format = data_field.data_format
        if '%y' not in data_field.data_format.lower():
          # Need to add the starting year b/c date doesn't contain enough info to make an absolute time object
          data_format = '%Y ' + data_field.data_format
          data = str(data_source.starting_year) + ' ' + data
        data = datetime.strptime(data, data_format).date()
      event_data[data_field.name] = data
    events_data.append(event_data)

  events_data = strip_invalid_events(events_data)
  return events_data

def strip_invalid_events(events_data):
  """ Need to take out events with empty titles. """
  valid_events = []
  for event_data in events_data:
    if len(event_data['title']) != 0:
      valid_events.append(event_data)
  return valid_events

def save_parsed_events(events_data, data_source):
  events_serializer = EventSerializer(data=events_data, context={'data_source': data_source}, many=True)
  if events_serializer.is_valid():
    events_serializer.save()
  else:
    raise Exception('Invalid data for events serializer.')
