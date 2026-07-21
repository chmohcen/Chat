from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        validators=[validate_password],
    )
    final_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id','name', 'email', 'password', 'picture', 'status', 'final_picture']
        extra_kwargs = {
            'picture': {'required': False, 'allow_null': True},
            'status': {'required': False},
            'id': {'read_only': True},
        }

    def get_final_picture(self, obj):
        return obj.final_picture

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance
