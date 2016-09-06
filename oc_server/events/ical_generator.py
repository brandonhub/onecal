import icalendar as ical
from datetime import date, datetime, timedelta
import random, string

def generate_ical(calendar_name, events_data):
  """
  Format of each event should be:
   - date (python date object)
   - title (str)
   - detail (str)

BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:andrew.c.camel@gmail.com
X-WR-TIMEZONE:America/Chicago
BEGIN:VTIMEZONE
TZID:America/Chicago
X-LIC-LOCATION:America/Chicago
BEGIN:DAYLIGHT
TZOFFSETFROM:-0600
TZOFFSETTO:-0500
TZNAME:CDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0500
TZOFFSETTO:-0600
TZNAME:CST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE

  """

  calendar = ical.Calendar()
  calendar.add('version', '2.0')
  calendar.add('prodid', '-//Dromo Labs/OneCal//EN')
  calendar.add('x-wr-calname', calendar_name)
  calendar.add('method', 'publish')
  calendar.add('x-wr-timezone', 'America/Chicago')

  for event_data in events_data:
    event = ical.Event()
    event.add('dtstart', event_data['date'])
    event.add('dtend', event_data['date'] + timedelta(days=1))
    event.add('summary', event_data['title'])
    event.add('description', '' if event_data['detail'] == None else event_data['detail'][:8000])
    event.add('sequence', '0')
    event.add('created', event_data['time_created'])
    event.add('last-modified', event_data['time_created'])
    event.add('location', '')
    event.add('uid', event_data['uid'])
    calendar.add_component(event)

  return calendar.to_ical()