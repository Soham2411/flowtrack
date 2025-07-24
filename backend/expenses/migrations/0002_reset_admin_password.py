from django.db import migrations
from django.contrib.auth.models import User

def reset_admin_password(apps, schema_editor):
    try:
        admin = User.objects.get(username='admin')
        admin.set_password('AdminReset123!')
        admin.save()
        print("✅ Admin password reset to: AdminReset123!")
    except User.DoesNotExist:
        # Create admin if it doesn't exist
        User.objects.create_superuser(
            username='admin',
            email='admin@flowtrack.com',
            password='AdminReset123!'
        )
        print("✅ Admin user created with password: AdminReset123!")

class Migration(migrations.Migration):
    dependencies = [
        ('expenses', '0001_initial'),
    ]
    
    operations = [
        migrations.RunPython(reset_admin_password),
    ]
    