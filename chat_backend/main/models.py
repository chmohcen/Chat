from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from urllib.parse import quote
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    STATUS_CHOICES = (
        ('online', 'Online'),
        ('away', 'Away'),
        ('offline', 'Offline'),
    )

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    picture = models.ImageField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    @property
    def final_picture(self):
        if self.picture:
            return f"{settings.BACK_HOST}{self.picture.url}"

        return f"https://api.dicebear.com/7.x/initials/svg?seed={quote(self.name)}"

    def __str__(self):
        return self.name


class Message(models.Model):
    text = models.TextField()
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_messages')
    is_seen = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"From {self.sender} to {self.receiver}: {self.text[:20]}"


