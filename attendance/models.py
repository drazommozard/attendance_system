from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    # AbstractUser already provides username, password, first_name, last_name, and email.
    # We just add our custom flag to separate standard employees from admins.
    is_employee_admin = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.username})"

class SystemSettings(models.Model):
    shift_start_time = models.TimeField(help_text="e.g., 08:00:00")
    shift_end_time = models.TimeField(help_text="e.g., 17:00:00", null=True, blank=True)  # New field!
    grace_period_minutes = models.IntegerField(default=30)
    office_latitude = models.FloatField()
    office_longitude = models.FloatField()
    allowed_radius_km = models.FloatField(
        default=1.0, 
        help_text="Maximum distance in kilometers allowed for clock-in"
    )

    class Meta:
        verbose_name_plural = "System Settings" 

    def __str__(self):
        return "Global Attendance Settings"
class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Late', 'Late'),
        ('Missed Punch', 'Missed Punch'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField(auto_now_add=True)
    time_in = models.TimeField(auto_now_add=True)
    time_out = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    class Meta:
        # This is the physical database constraint preventing duplicate daily clock-ins
        unique_together = ('user', 'date')

    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.status}"