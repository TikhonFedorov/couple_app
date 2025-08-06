from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    couple_id = db.Column(db.Integer, db.ForeignKey('couple.id'))

    # Профиль
    name = db.Column(db.String(120), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    avatar_url = db.Column(db.String(500), nullable=True)
    description = db.Column(db.Text, nullable=True)
    skills = db.Column(db.Text, nullable=True)  # CSV, например: "Excel,Figma,UX"
    about = db.Column(db.Text, nullable=True)   # Разделяется символом '|'

class Dish(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(80), nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    recipe_url = db.Column(db.String(500), nullable=True)

class Couple(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    users = db.relationship('User', backref='couple', lazy=True)

class TodoItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    couple_id = db.Column(db.Integer, db.ForeignKey('couple.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class WishlistItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.String(20), default='medium')
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    couple_id = db.Column(db.Integer, db.ForeignKey('couple.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    dish_id = db.Column(db.Integer, db.ForeignKey('dish.id'), nullable=False)  # добавьте это!
    day_of_week = db.Column(db.String(20), nullable=False)
    meal_type = db.Column(db.String(20), nullable=False)
    couple_id = db.Column(db.Integer, db.ForeignKey('couple.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # добавить связь (по желанию, для удобства)
    dish = db.relationship('Dish')
