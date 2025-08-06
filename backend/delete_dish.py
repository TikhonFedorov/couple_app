from app import app, db
from models import Dish

with app.app_context():
    Dish.query.delete()        # Удаляет все записи из таблицы Dish
    db.session.commit()        # Фиксирует изменения в базе
    print("Все блюда удалены.")