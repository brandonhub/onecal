from django.contrib import admin

from events.models import *

admin.site.register(DataSource)
admin.site.register(DataField)
admin.site.register(Calendar)
admin.site.register(Event)