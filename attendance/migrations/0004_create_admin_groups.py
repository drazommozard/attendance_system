from django.db import migrations


def create_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    # Create our two distinct tiers
    Group.objects.get_or_create(name='Frontend Super Admin')
    Group.objects.get_or_create(name='Standard Admin')

def remove_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Group.objects.filter(name__in=['Frontend Super Admin', 'Standard Admin']).delete()

class Migration(migrations.Migration):

    dependencies = [
        ("attendance", "0003_systemsettings_shift_end_time"),
    ]
    operations = [
        migrations.RunPython(create_groups, reverse_code=remove_groups),
    ]