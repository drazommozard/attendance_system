import csv
import math
from datetime import datetime, timedelta

from django.contrib.auth.models import Group
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import AttendanceRecord, SystemSettings, User
from .permissions import IsFrontendSuperAdmin, IsStandardAdmin
from .serializers import \
    MyTokenObtainPairSerializer  # Import your new serializer
from .serializers import (AttendanceRecordSerializer, SystemSettingsSerializer,
                          UserRegistrationSerializer)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer


class ClockInView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        today = datetime.now().date()
        current_time = datetime.now().time()

        if AttendanceRecord.objects.filter(user=user, date=today).exists():
            return Response({"error": "You have already clocked in today."}, status=status.HTTP_400_BAD_REQUEST)

        settings = SystemSettings.objects.first()
        if not settings:
            return Response({"error": "System settings not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            emp_lat = float(request.data.get('latitude'))
            emp_lon = float(request.data.get('longitude'))
        except (TypeError, ValueError):
            return Response({"error": "Valid GPS coordinates are required to clock in."}, status=status.HTTP_400_BAD_REQUEST)

        # Haversine formula calculation
        R = 6371.0  
        lat1 = math.radians(float(settings.office_latitude))
        lon1 = math.radians(float(settings.office_longitude))
        lat2 = math.radians(emp_lat)
        lon2 = math.radians(emp_lon)

        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c

        if distance > settings.allowed_radius_km:
            return Response(
                {"error": f"You are too far from the office. Distance: {distance:.2f} km. Allowed: {settings.allowed_radius_km} km"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        shift_start_dt = datetime.combine(today, settings.shift_start_time)
        grace_period = timedelta(minutes=settings.grace_period_minutes)
        late_threshold = shift_start_dt + grace_period
        current_dt = datetime.combine(today, current_time)

        attendance_status = 'Late' if current_dt > late_threshold else 'Present'

        record = AttendanceRecord.objects.create(user=user, date=today, time_in=current_time, status=attendance_status)
        serializer = AttendanceRecordSerializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ClockOutView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        # 1. Fetch Global System Settings
        settings = SystemSettings.objects.first()
        if not settings or not settings.shift_end_time:
            return Response(
                {"error": "System shift configuration is missing."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Enforce Shift End Time Guardrail (Option A: Locked Until EOD)
        import zoneinfo  # Built-in Python library for timezones

        from django.utils import timezone
        
        nairobi_tz = zoneinfo.ZoneInfo("Africa/Nairobi")
        current_time = timezone.now().astimezone(nairobi_tz).time()
        
        print(f"SERVER CURRENT TIME: {current_time} | SHIFT END TIME: {settings.shift_end_time}")
        if current_time < settings.shift_end_time:
            formatted_end_time = settings.shift_end_time.strftime("%I:%M %p")
            return Response(
                {"error": f"You cannot clock out before the standard shift end time of {formatted_end_time}."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Fetch and Validate Today's Attendance Record
        today = datetime.now().date()
        try:
            record = AttendanceRecord.objects.get(user=request.user, date=today)
        except AttendanceRecord.DoesNotExist:
            return Response(
                {"error": "No clock-in record found for today. You must clock in first."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        if record.time_out:
            return Response(
                {"error": "You have already clocked out for today."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Geolocation Validation using manual Haversine math
        try:
            user_lat = float(request.data.get('latitude'))
            user_lon = float(request.data.get('longitude'))
        except (TypeError, ValueError):
            return Response(
                {"error": "Valid GPS coordinates are required to clock out."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        R = 6371.0  
        lat1 = math.radians(float(settings.office_latitude))
        lon1 = math.radians(float(settings.office_longitude))
        lat2 = math.radians(user_lat)
        lon2 = math.radians(user_lon)

        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c

        if distance > settings.allowed_radius_km:
            return Response(
                {"error": f"Clock-out failed. You are too far from the office. Distance: {distance:.2f} km. Allowed: {settings.allowed_radius_km} km"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5. Commit Check-out Timestamp to Database
        record.time_out = current_time
        record.save()

        return Response(
            {"message": "Clock-out successful! Have a great evening."}, 
            status=status.HTTP_200_OK
        )


class HistoryView(generics.ListAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AttendanceRecord.objects.filter(user=self.request.user).order_by('-date')
    



class UpdateSystemSettingsView(APIView):
    # This locks the endpoint completely to Tier 2 Frontend Super Admins / Superusers
    permission_classes = [IsAuthenticated, IsFrontendSuperAdmin]

    def get(self, request):
        """Allows admins to fetch the current global configurations."""
        settings = SystemSettings.objects.first()
        if not settings:
            return Response({"error": "No configuration found."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = SystemSettingsSerializer(settings)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        """Allows Tier 2 admins to update configurations safely."""
        settings = SystemSettings.objects.first()
        if not settings:
            return Response({"error": "No configuration found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SystemSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "System configurations updated successfully!", "data": serializer.data},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



class PromoteUserView(APIView):
    # Strictly locked to Tier 2 Frontend Super Admins / Global Superusers
    permission_classes = [IsAuthenticated, IsFrontendSuperAdmin]

    def post(self, request):
        username = request.data.get("username")
        
        if not username:
            return Response(
                {"error": "Username is required to perform a promotion."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Look up the targeted user
        try:
            target_user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"error": f"User with username '{username}' not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # 2. Grab our Standard Admin group
        try:
            standard_admin_group = Group.objects.get(name="Standard Admin")
        except Group.DoesNotExist:
            return Response(
                {"error": "Standard Admin group configuration is missing from the database. Please rerun migrations."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 3. Check if they are already an admin to avoid redundant processing
        if target_user.groups.filter(name="Standard Admin").exists():
            return Response(
                {"message": f"User '{username}' is already a Standard Admin."},
                status=status.HTTP_200_OK
            )

        # 4. Add user to the group and make sure is_staff is True so they can log into admin components if needed
        target_user.groups.add(standard_admin_group)
        target_user.is_staff = True  
        target_user.save()

        return Response(
            {"message": f"User '{username}' has been successfully promoted to Standard Admin (Tier 3)."},
            status=status.HTTP_200_OK
        )
    
  # Allows Tier 2 and Tier 3



class AdminDailyLogView(APIView):
    # Accessible by Tier 2 (Super Admin) and Tier 3 (Standard Admin)
    permission_classes = [IsAuthenticated, IsStandardAdmin]

    def get(self, request):
        today = datetime.now().date()
        
        # 1. Fetch all of today's attendance entries
        records = AttendanceRecord.objects.filter(date=today).order_by('-time_in')
        
        # 2. Run aggregate counts on today's records
        total_present = records.count()
        total_late = records.filter(status='Late').count()
        total_on_time = records.filter(status='Present').count()
        
        # 3. Serialize the records list for the dashboard table
        serializer = AttendanceRecordSerializer(records, many=True)
        
        # 4. Return both the metadata counters and the detailed logs together
        return Response({
            "summary": {
                "total_present": total_present,
                "total_on_time": total_on_time,
                "total_late": total_late,
            },
            "records": serializer.data
        }, status=status.HTTP_200_OK)
    


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class ExportAttendanceCSVView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # 1. Look for dates sent by the React frontend
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="attendance_export.csv"'
        writer = csv.writer(response)
        writer.writerow(['Date', 'Employee', 'Time In', 'Time Out', 'Status'])

        # 2. Get all records by default
        records = AttendanceRecord.objects.all().order_by('-date', '-time_in')
        
        # 3. If the frontend sent dates, filter the database before exporting
        if start_date:
            records = records.filter(date__gte=start_date)
        if end_date:
            records = records.filter(date__lte=end_date)
        
        for record in records:
            time_in_str = record.time_in.strftime('%H:%M:%S') if record.time_in else 'N/A'
            time_out_str = record.time_out.strftime('%H:%M:%S') if record.time_out else 'N/A'
            
            writer.writerow([
                record.date,
                record.user.username,
                time_in_str,
                time_out_str,
                record.status
            ])

        return response