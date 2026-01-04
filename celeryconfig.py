import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('quickdeliver')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'check-document-expiry': {
        'task': 'apps.verification.tasks.check_documents_expiring_soon',
        'schedule': crontab(hour=8, minute=0),
    },
    'auto-suspend-expired-accounts': {
        'task': 'apps.verification.tasks.suspend_accounts_with_expired_docs',
        'schedule': crontab(hour=1, minute=0),
    },
}
