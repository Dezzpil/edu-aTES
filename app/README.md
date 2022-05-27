# App
- esr - events schemas registry
- tt - таск-трекер
- acc - аккаунтинг / биллинг

# Подготовка и запуск
* В качестве сервиса аутентификации используется https://github.com/davydovanton/popug-inventory. Необходимо склонить и запустить докер-компоуз с RabbitMQ
* Задать хосты для сервисов в /etc/hosts
* Зарегистрировать приложения для OAuth в сервисе аутентификации (путь /oauth/applications) использую настроенные хосты
* Прописать полученные id и ключи в index.ts каждого сервиса
* Запустить БД для tt (с помощью docker-compose up db)
* Запустить БД для acc (с помощью docker-compose up db)