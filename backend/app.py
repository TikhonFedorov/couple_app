import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_session import Session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Couple, TodoItem, WishlistItem, MenuItem, Dish

# Загружаем переменные окружения из .env файла
load_dotenv()

app = Flask(__name__, instance_relative_config=True)

# Конфигурация приложения из .env
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default_secret_key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///instance/database.db')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False  # Сессии удаляются при закрытии браузера
app.config['SESSION_USE_SIGNER'] = True  # Доп. безопасность для cookies
app.config['SESSION_COOKIE_SAMESITE'] = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', 'False') == 'True'

# Инициализация расширений
Session(app)
db.init_app(app)

CORS(
    app,
    resources={r"/api/*": {"origins": "http://localhost:3000"}},  # измените origin под адрес фронтенда
    supports_credentials=True,
)

login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'error': 'Authentication required'}), 401


@app.before_request
def handle_options_request():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')  # фронтенд
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200

# Регистрация
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    couple_name = data.get('couple_name') or f"Пара {username}"

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Пользователь уже существует'}), 400

    couple = Couple(name=couple_name)
    db.session.add(couple)
    db.session.commit()

    user = User(
        username=username,
        password=generate_password_hash(password),
        couple_id=couple.id,
        name=data.get('name', ''),
        email=data.get('email', ''),
        avatar_url=data.get('avatar_url', ''),
        description=data.get('description', ''),
        skills=','.join(data.get('skills', [])),
        about='|'.join(data.get('about', []))
    )
    db.session.add(user)
    db.session.commit()

    login_user(user)
    return jsonify({'message': 'Регистрация успешна', 'user_id': user.id})

# Вход
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and check_password_hash(user.password, password):
        login_user(user)
        return jsonify({'message': 'Вход выполнен', 'user_id': user.id})
    return jsonify({'error': 'Неверные данные'}), 401

# Выход
@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Выход выполнен'})

# Профиль
@app.route('/api/profile', methods=['GET', 'PUT'])
@login_required
def profile():
    user = current_user

    if request.method == 'GET':
        return {
            'username': user.username,
            'name': user.name,
            'email': user.email,
            'avatar_url': user.avatar_url,
            'description': user.description,
            'skills': user.skills.split(',') if user.skills else [],
            'about': user.about.split('|') if user.about else []
        }

    if request.method == 'PUT':
        data = request.get_json()
        user.name = data.get('name', user.name)
        user.email = data.get('email', user.email)
        user.avatar_url = data.get('avatar_url', user.avatar_url)
        user.description = data.get('description', user.description)
        skills = data.get('skills')
        about = data.get('about')
        user.skills = ','.join(skills) if isinstance(skills, list) else user.skills
        user.about = '|'.join(about) if isinstance(about, list) else user.about
        db.session.commit()
        return {'message': 'Профиль обновлен'}

# To Do
@app.route('/api/todos', methods=['GET', 'POST'])
@login_required
def todos():
    if request.method == 'GET':
        todos = TodoItem.query.filter_by(couple_id=current_user.couple_id).all()
        return jsonify([{
            'id': t.id,
            'title': t.title,
            'description': t.description,
            'completed': t.completed,
            'created_by_name': User.query.get(t.created_by).name if User.query.get(t.created_by) else 'Unknown'
        } for t in todos])

    data = request.get_json()
    todo = TodoItem(
        title=data['title'],
        description=data.get('description', ''),
        couple_id=current_user.couple_id,
        created_by=current_user.id,
    )
    db.session.add(todo)
    db.session.commit()
    return jsonify({
        'id': todo.id,
        'title': todo.title,
        'description': todo.description,
        'completed': todo.completed
    }), 201

@app.route('/api/todos/<int:todo_id>', methods=['PUT', 'DELETE'])
@login_required
def todo_item(todo_id):
    todo = TodoItem.query.filter_by(id=todo_id, couple_id=current_user.couple_id).first()
    if not todo:
        return jsonify({'error': 'Задача не найдена'}), 404

    if request.method == 'PUT':
        data = request.get_json()
        todo.title = data.get('title', todo.title)
        todo.description = data.get('description', todo.description)
        todo.completed = data.get('completed', todo.completed)
        db.session.commit()
        return jsonify({
            'id': todo.id,
            'title': todo.title,
            'description': todo.description,
            'completed': todo.completed
        })

    elif request.method == 'DELETE':
        db.session.delete(todo)
        db.session.commit()
        return jsonify({'message': 'Задача удалена'})

# Wishlist
@app.route('/api/wishlist', methods=['GET', 'POST'])
@login_required
def wishlist():
    if request.method == 'GET':
        wishes = WishlistItem.query.filter_by(couple_id=current_user.couple_id).all()
        return jsonify([{
            'id': w.id,
            'title': w.title,
            'description': w.description,
            'priority': w.priority,
            'completed': w.completed,
            'created_by_name': User.query.get(w.created_by).name if User.query.get(w.created_by) else 'Unknown'
        } for w in wishes])

    data = request.get_json()
    wish = WishlistItem(
        title=data['title'],
        description=data.get('description', ''),
        priority=data.get('priority', 'medium'),
        couple_id=current_user.couple_id,
        created_by=current_user.id
    )
    db.session.add(wish)
    db.session.commit()
    return jsonify({
        'id': wish.id,
        'title': wish.title,
        'description': wish.description,
        'priority': wish.priority,
        'completed': wish.completed
    }), 201

@app.route('/api/wishlist/<int:wish_id>', methods=['PUT', 'DELETE'])
@login_required
def wishlist_item(wish_id):
    wish = WishlistItem.query.filter_by(id=wish_id, couple_id=current_user.couple_id).first()
    if not wish:
        return jsonify({'error': 'Желание не найдено'}), 404

    if request.method == 'PUT':
        data = request.get_json()
        wish.title = data.get('title', wish.title)
        wish.description = data.get('description', wish.description)
        wish.priority = data.get('priority', wish.priority)
        wish.completed = data.get('completed', wish.completed)
        db.session.commit()
        return jsonify({
            'id': wish.id,
            'title': wish.title,
            'description': wish.description,
            'priority': wish.priority,
            'completed': wish.completed
        })

    elif request.method == 'DELETE':
        db.session.delete(wish)
        db.session.commit()
        return jsonify({'message': 'Желание удалено'})

# Меню
@app.route('/api/menu', methods=['GET', 'POST'])
@login_required
def menu():
    if request.method == 'GET':
        menu_items = MenuItem.query.filter_by(couple_id=current_user.couple_id).all()
        # Возвращаем dish_id, день недели, прием пищи, plus created_by_name
        return jsonify([{
            'id': m.id,
            'dish_id': m.dish_id,
            'day_of_week': m.day_of_week,
            'meal_type': m.meal_type,
            'created_by_name': User.query.get(m.created_by).name if User.query.get(m.created_by) else 'Unknown'
        } for m in menu_items])

    data = request.get_json()
    menu_item = MenuItem(
        dish_id=data['dish_id'],
        day_of_week=data['day_of_week'],
        meal_type=data['meal_type'],
        couple_id=current_user.couple_id,
        created_by=current_user.id
    )
    db.session.add(menu_item)
    db.session.commit()
    return jsonify({
        'id': menu_item.id,
        'dish_id': menu_item.dish_id,
        'day_of_week': menu_item.day_of_week,
        'meal_type': menu_item.meal_type,
    }), 201

@app.route('/api/menu/<int:menu_id>', methods=['PUT', 'DELETE'])
@login_required
def menu_item(menu_id):
    menu_item = MenuItem.query.filter_by(id=menu_id, couple_id=current_user.couple_id).first()
    if not menu_item:
        return jsonify({'error': 'Блюдо не найдено'}), 404

    if request.method == 'PUT':
        data = request.get_json()
        menu_item.dish_name = data.get('dish_name', menu_item.dish_name)
        menu_item.day_of_week = data.get('day_of_week', menu_item.day_of_week)
        menu_item.meal_type = data.get('meal_type', menu_item.meal_type)
        menu_item.recipe_url = data.get('recipe_url', menu_item.recipe_url)
        db.session.commit()
        return jsonify({
            'id': menu_item.id,
            'dish_name': menu_item.dish_name,
            'day_of_week': menu_item.day_of_week,
            'meal_type': menu_item.meal_type,
            'ingredients': menu_item.ingredients,
            'recipe_url': menu_item.recipe_url
        })

    elif request.method == 'DELETE':
        db.session.delete(menu_item)
        db.session.commit()
        return jsonify({'message': 'Блюдо удалено'})
    
@app.route('/api/dishes', methods=['GET', 'POST'])
@login_required
def dishes():
    if request.method == 'GET':
        dishes = Dish.query.all()
        return jsonify([{
            'id': d.id,
            'name': d.name,
            'category': d.category,
            'image_url': d.image_url,
            'recipe_url': d.recipe_url
        } for d in dishes])

    data = request.get_json()
    dish = Dish(
        name=data['name'],
        category=data['category'],
        image_url=data.get('image_url'),
        recipe_url=data.get('recipe_url')
    )
    db.session.add(dish)
    db.session.commit()
    return jsonify({'message': 'Блюдо добавлено', 'id': dish.id}), 201

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
