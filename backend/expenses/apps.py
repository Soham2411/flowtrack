from django.apps import AppConfig
import os

class ExpensesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'expenses'
    
    def ready(self):
        # Create superuser when app is ready
        if os.environ.get('CREATE_SUPERUSER') == 'true':
            self.create_superuser()
    
    def create_superuser(self):
        from django.contrib.auth.models import User
        try:
            if not User.objects.filter(username='admin').exists():
                User.objects.create_superuser(
                    username='admin',
                    email='admin@flowtrack.com',
                    password='FlowTrack2024!'
                )
                print("✅ Admin superuser created: admin / FlowTrack2024!")
            else:
                print("ℹ️ Admin user already exists")
        except Exception as e:
            print(f"❌ Superuser creation error: {e}")