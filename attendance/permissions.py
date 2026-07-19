from rest_framework.permissions import BasePermission


class IsFrontendSuperAdmin(BasePermission):
    """
    Allows access only to Tier 2 Admins (Frontend Super Admins Group).
    Also allows Django global superusers absolute access.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        return (
            request.user.is_superuser or 
            request.user.groups.filter(name="Frontend Super Admin").exists()
        )


class IsStandardAdmin(BasePermission):
    """
    Allows access to Tier 3 Admins (Standard Admins Group).
    Also grants access to Tier 2 Admins since they outrank Tier 3.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        return (
            request.user.is_superuser or 
            request.user.groups.filter(name__in=["Frontend Super Admin", "Standard Admin"]).exists()
        )