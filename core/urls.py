from django.contrib import admin
from django.urls import path
# Notice TokenObtainPairView is REMOVED from this import below
from rest_framework_simplejwt.views import TokenRefreshView

from attendance.views import AdminDailyLogView  # <-- Added it here!
from attendance.views import (ClockInView, ClockOutView,
                              ExportAttendanceCSVView, HistoryView,
                              MyTokenObtainPairView, PromoteUserView,
                              RegisterView, UpdateSystemSettingsView)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Registration Endpoint
    path('api/register/', RegisterView.as_view(), name='register'),
    
    # Login Endpoint - NOW USING YOUR CUSTOM VIEW!
    path('api/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Attendance 
    path('api/attendance/clock-in/', ClockInView.as_view(), name='clock_in'),
    path('api/attendance/clock-out/', ClockOutView.as_view(), name='clock_out'),
    
    # History Endpoint
    path('api/attendance/history/', HistoryView.as_view(), name='history'),
    
    # This endpoint refreshes the token before it expires
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Admin Endpoints
    path('api/admin/settings/', UpdateSystemSettingsView.as_view(), name='update-settings'),
    path('api/admin/promote/', PromoteUserView.as_view(), name='promote-user'),
    path('api/admin/daily-log/', AdminDailyLogView.as_view(), name='admin-daily-log'),
    # Add this right beneath your other Admin Endpoints
    path('api/admin/export-csv/', ExportAttendanceCSVView.as_view(), name='export-csv'),
]