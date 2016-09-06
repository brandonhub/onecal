"""
For testing the data source post URL
"""


import json
import urllib2

def generate_data():

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
    'root_selector': 'table',
    'repeater_selector': 'tr',
    'starting_year': 2016,
    'data_fields': [date_data_field, title_data_field, detail_data_field]
  }

  return json.dumps(data)