from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import AttendanceRecord, SystemSettings, User

# Tell Django to show these tables in the admin dashboard
admin.site.register(User, UserAdmin)
admin.site.register(SystemSettings)
admin.site.register(AttendanceRecord)