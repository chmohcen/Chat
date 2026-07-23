from django.contrib import admin
from .models import User, Message


class MessageAdmin(admin.ModelAdmin):
    list_filter = ('sender', 'receiver')


admin.site.register(User)
admin.site.register(Message, MessageAdmin)