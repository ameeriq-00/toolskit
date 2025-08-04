# backend/api/migrations/0007_add_user_analysis_results.py

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0006_auto_20250729_0141'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserAnalysisResult',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('analysis_type', models.CharField(
                    max_length=20,
                    choices=[
                        ('standard', 'تحليل أسيا'),
                        ('z_format', 'تحليل زين'),
                        ('comparison', 'مقارنة الملفات')
                    ]
                )),
                ('original_filename', models.CharField(max_length=255)),
                ('display_filename', models.CharField(max_length=255)),
                ('version_number', models.PositiveIntegerField(default=1)),
                ('file_hash', models.CharField(max_length=64)),
                ('results', models.JSONField()),
                ('sheet_owner_number', models.CharField(max_length=20, blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='analysis_results',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        
        # إضافة الفهارس
        migrations.AddIndex(
            model_name='useranalysisresult',
            index=models.Index(fields=['user', '-created_at'], name='api_useranal_user_id_created_idx'),
        ),
        migrations.AddIndex(
            model_name='useranalysisresult',
            index=models.Index(fields=['expires_at'], name='api_useranal_expires_at_idx'),
        ),
    ]