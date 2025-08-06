from werkzeug.security import generate_password_hash
from app import app, db
from models import User, Couple

with app.app_context():
    db.drop_all()
    db.create_all()

    couple1 = Couple(name='Пара Тестовая')
    db.session.add(couple1)
    db.session.commit()

    user1 = User(
        username='ivan_ivanov',
        password=generate_password_hash('password1'),
        couple_id=couple1.id,
        name='Иван Иванов',
        email='ivan@example.com',
        description='Активный член пары, занимается задачами и планированием.',
        skills='Планирование,Готовка,Забота',
        about='Опыт управления проектами|Любит кулинарию и спорт'
    )

    user2 = User(
        username='anna_petrova',
        password=generate_password_hash('password2'),
        couple_id=couple1.id,
        name='Анна Петрова',
        email='anna@example.com',
        description='Планирует совместное меню и ведёт wishlist.',
        skills='Организация,UX,Power BI',
        about='Проектирование дизайн-систем|Анализ данных'
    )

    db.session.add_all([user1, user2])
    db.session.commit()

    print('База данных инициализирована и добавлены тестовые пользователи: user1, user2')
