from django.db import migrations
from django.contrib.auth.models import User

def create_fresh_admin(apps, schema_editor):
    # Delete existing admin if it exists
    try:
        old_admin = User.objects.get(username='admin')
        old_admin.delete()
        print("🗑️ Deleted old admin user")
    except User.DoesNotExist:
        pass
    
    # Create fresh admin user
    User.objects.create_superuser(
        username='flowtrackadmin',
        email='admin@flowtrack.com',
        password='FlowTrack2024Admin!'
    )
    print("✅ Created fresh admin: flowtrackadmin / FlowTrack2024Admin!")

class Migration(migrations.Migration):
    dependencies = [
        ('expenses', '0002_reset_admin_password'),
    ]
    
    operations = [
        migrations.RunPython(create_fresh_admin),
    ]