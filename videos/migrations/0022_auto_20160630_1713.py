# -*- coding: utf-8 -*-
# Generated by Django 1.9.6 on 2016-06-30 14:13
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('videos', '0021_auto_20160627_1454'),
    ]

    operations = [
        migrations.CreateModel(
            name='Website',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('date_added', models.DateTimeField(auto_now_add=True)),
                ('play_count', models.IntegerField(default=0)),
                ('date_fav', models.DateTimeField(blank=True, null=True)),
                ('date_runner_up', models.DateTimeField(blank=True, null=True)),
                ('is_fav', models.BooleanField(default=False)),
                ('is_runner_up', models.BooleanField(default=False)),
                ('rating', models.IntegerField(default=0)),
                ('thumbnail', models.CharField(blank=True, max_length=500, null=True)),
            ],
        ),
        migrations.RemoveField(
            model_name='actoralias',
            name='actor',
        ),
        migrations.AddField(
            model_name='actor',
            name='actor_aliases',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='videos.ActorAlias'),
        ),
        migrations.AlterField(
            model_name='scenetag',
            name='name',
            field=models.CharField(max_length=50, unique=True),
        ),
        migrations.AddField(
            model_name='website',
            name='scene_tags',
            field=models.ManyToManyField(null=True, to='videos.SceneTag'),
        ),
        migrations.AddField(
            model_name='scene',
            name='websites',
            field=models.ManyToManyField(blank=True, null=True, to='videos.Website'),
        ),
    ]
