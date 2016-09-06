# -*- coding: utf-8 -*-
# Generated by Django 1.9.3 on 2016-03-08 21:37
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0004_auto_20160308_2103'),
    ]

    operations = [
        migrations.AlterField(
            model_name='event',
            name='calendar',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='events', to='events.Calendar'),
        ),
    ]