# -*- coding: utf-8 -*-
# Generated by Django 1.9.3 on 2016-03-06 20:47
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0002_calendar_event'),
    ]

    operations = [
        migrations.RenameField(
            model_name='datasource',
            old_name='repeator_selector',
            new_name='repeater_selector',
        ),
    ]
