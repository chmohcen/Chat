import random

from django.core.management.base import BaseCommand, CommandError

from main.models import User, Message

SAMPLE_MESSAGES = (
    'Hey, how is your day going?',
    'Does anyone have updates on the latest sprint?',
    'I made some progress on the new feature today.',
    'This looks great, I love the new layout.',
    'Can we review the design before tomorrow?',
    'I will push the changes to the repo shortly.',
    "Let's schedule a quick sync for this afternoon.",
    'I have a few ideas for the next release.',
    'Thanks for the help with deployment!',
    'I am available if anyone needs support.',
    'Happy Friday! Have a great weekend.',
    'The tests are passing on my local machine.',
    'Can you share the latest API docs?',
    'We should improve the onboarding flow.',
    'Sounds good, talk soon!',
)


class Command(BaseCommand):
    help = 'Populate the chat app with random messages between existing users.'

    def add_arguments(self, parser):
        parser.add_argument('--messages', type=int, default=50, help='Number of messages to create')
        parser.add_argument('--clear', action='store_true', help='Clear existing messages before populating')

    def handle(self, *args, **options):
        message_count = options['messages']
        clear = options['clear']

        if clear:
            self.stdout.write('Deleting existing messages...')
            Message.objects.all().delete()

        users = list(User.objects.all())
        if len(users) < 2:
            raise CommandError('Need at least 2 existing users to create messages.')

        self.stdout.write(f'Creating {message_count} messages...')
        for _ in range(message_count):
            sender, receiver = random.sample(users, 2)
            Message.objects.create(
                sender=sender,
                receiver=receiver,
                text=random.choice(SAMPLE_MESSAGES),
                is_seen=random.choice([True, False]),
            )

        self.stdout.write(self.style.SUCCESS('Message population complete!'))
        self.stdout.write(f'Messages created: {message_count}')
