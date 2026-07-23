runfront:
	cd chat_frontend && npm run start
runback:
	cd chat_backend && python manage.py runserver
mig:
	cd chat_backend && python manage.py makemigrations && python manage.py migrate
