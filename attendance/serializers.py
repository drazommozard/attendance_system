from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import AttendanceRecord, SystemSettings, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'is_employee_admin']




class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = [
            'shift_start_time', 
            'shift_end_time', 
            'grace_period_minutes', 
            'office_latitude', 
            'office_longitude', 
            'allowed_radius_km'
        ]

class AttendanceRecordSerializer(serializers.ModelSerializer):
    # This automatically includes the user's name in the JSON, instead of just their ID number
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ['id', 'user', 'user_details', 'date', 'time_in', 'time_out', 'status']
        # The frontend doesn't send these; the backend calculates them automatically
        read_only_fields = ['date', 'time_in', 'time_out', 'status']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user        
    


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims into the token payload
        token['username'] = user.username
        token['is_superuser'] = user.is_superuser
        token['is_staff'] = user.is_staff
        
        # Pull group names out as a simple list of strings
        token['groups'] = list(user.groups.values_list('name', flat=True))

        return token