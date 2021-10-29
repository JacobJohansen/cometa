from django.apps import AppConfig

# From: https://github.com/yunojuno/django-management-command-log

class ManagementCommandLogConfig(AppConfig):
    name = "extensions.command_log"
    verbose_name = "Management command audit log"
