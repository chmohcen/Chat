from django.contrib.auth import authenticate, login, logout
from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Message, User
from .serializers import MessageSerializer, UserSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = User.objects.all()

        if self.action == 'list':
            queryset = queryset.exclude(pk=self.request.user.pk)
            search = self.request.query_params.get('search', '').strip()
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) | Q(email__icontains=search)
                )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    def _get_with_user_id(self):
        with_id = self.request.query_params.get('with')
        if not with_id or not with_id.isdigit():
            raise ValidationError({"with": "A valid user id is required."})
        return int(with_id)

    def get_queryset(self):
        user = self.request.user
        with_id = self._get_with_user_id()
        return Message.objects.filter(
            Q(sender=user, receiver_id=with_id) | Q(sender_id=with_id, receiver=user)
        ).order_by('created_at')

    def list(self, request, *args, **kwargs):
        with_id = self._get_with_user_id()
        Message.objects.filter(sender_id=with_id, receiver=request.user, is_seen=False).update(is_seen=True)
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        user = request.user
        messages = (
            Message.objects
            .filter(Q(sender=user) | Q(receiver=user))
            .select_related('sender', 'receiver')
            .order_by('-created_at')
        )

        latest_by_other_user = {}
        for message in messages:
            other_user = message.receiver if message.sender_id == user.id else message.sender
            if other_user.id not in latest_by_other_user:
                latest_by_other_user[other_user.id] = (other_user, message)

        unread_counts = {
            row['sender_id']: row['count']
            for row in Message.objects.filter(
                receiver=user,
                sender_id__in=latest_by_other_user.keys(),
                is_seen=False,
            ).values('sender_id').annotate(count=Count('id'))
        }

        ordered_conversations = list(latest_by_other_user.items())

        try:
            offset = max(0, int(request.query_params.get('offset', 0)))
        except ValueError:
            offset = 0
        try:
            limit = int(request.query_params.get('limit', 20))
        except ValueError:
            limit = 20
        limit = max(1, min(limit, 100))

        page = ordered_conversations[offset:offset + limit]

        conversations = [
            {
                'user': UserSerializer(other_user, context={'request': request}).data,
                'last_message': {
                    'id': message.id,
                    'text': message.text,
                    'created_at': message.created_at,
                    'sender': message.sender_id,
                    'is_seen': message.is_seen,
                },
                'unread_count': unread_counts.get(other_user_id, 0),
            }
            for other_user_id, (other_user, message) in page
        ]

        return Response({
            'results': conversations,
            'has_more': offset + limit < len(ordered_conversations),
        })


class LoginView(APIView):

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Email and password required"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, email=email, password=password)

        if user is not None:
            login(request, user)
            refresh_token = RefreshToken.for_user(user)
            serializer = UserSerializer(user)

            return Response({
                "message": "Logged in successfully",
                "user": serializer.data,
                "access": str(refresh_token.access_token),
                "refresh": str(refresh_token),
            })

        return Response({"error": "Email or password incorrect"}, status=status.HTTP_401_UNAUTHORIZED)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class LogoutView(APIView):

    def post(self, request):
        logout(request)
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)