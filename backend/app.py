import os
from datetime import timedelta
from dotenv import load_dotenv
from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Couple, TodoItem, WishlistItem, MenuItem, Dish, Couple

# Основная директория и настройка окружения
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
os.makedirs(os.path.join(BASE_DIR, 'instance'), exist_ok=True)
load_dotenv()

app = Flask(__name__, instance_relative_config=True)

# Конфигурация базы данных
db_file = os.getenv('DATABASE_URL') or f"sqlite:///{os.path.join(BASE_DIR, 'instance', 'database.db')}"
app.config['SQLALCHEMY_DATABASE_URI'] = db_file

# Настройки безопасности и сессий
app.config.update({
    'SECRET_KEY': os.getenv('SECRET_KEY', 'default_secret_key'),
    # Для продакшена рекомендуется использовать True при использовании HTTPS
    'REMEMBER_COOKIE_SECURE': True,
    'SESSION_COOKIE_SAMESITE': 'Lax',  # Более безопасный вариант по сравнению с None
    'SESSION_COOKIE_SECURE': True,     # Требует HTTPS
    'PERMANENT_SESSION_LIFETIME': timedelta(days=30)
})

db.init_app(app)

def remove_orphan_couples():
    # Предполагается, что в модели Couple есть отношение users к User
    orphan_couples = Couple.query.filter(~Couple.users.any()).all()
    count = len(orphan_couples)
    for couple in orphan_couples:
        db.session.delete(couple)
    db.session.commit()
    print(f'Removed {count} orphan Couple(s) from database.')

# Оптимизированная конфигурация CORS
CORS(
    app,
    resources={r"/api/*": {"origins": "http://localhost:3000"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

# Инициализация менеджера аутентификации
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
    """Упрощённый обработчик предварительных запросов CORS"""
    if request.method == 'OPTIONS':
        return make_response('', 200)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Обслуживание фронтенда из статической директории"""
    build_dir = os.path.join(app.root_path, '..', 'frontend', 'static')
    if path != "" and os.path.exists(os.path.join(build_dir, path)):
        return send_from_directory(build_dir, path)
    else:
        return send_from_directory(build_dir, 'index.html')

# Регистрация
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Пользователь уже существует'}), 400

    couple_id = data.get('couple_id')
    couple_name = data.get('couple_name')

    if couple_id:
        couple = Couple.query.get(couple_id)
        if not couple:
            return jsonify({'error': 'Пара не найдена'}), 400

        # Проверяем число пользователей в паре
        users_count = User.query.filter_by(couple_id=couple_id).count()
        if users_count >= 2:
            return jsonify({'error': 'В этой паре уже зарегистрировано 2 пользователя'}), 400
    else:
        # Создаем новую пару
        couple = Couple(name=couple_name or f"Пара {username}")
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
        skills=','.join(data.get('skills', [])) if isinstance(data.get('skills'), list) else data.get('skills', ''),
        about='|'.join(data.get('about', [])) if isinstance(data.get('about'), list) else data.get('about', '')
    )
    db.session.add(user)
    db.session.commit()

    login_user(user, remember=True)
    return jsonify({'message': 'Регистрация успешна', 'user_id': user.id})

@app.route('/api/couples', methods=['GET'])
def get_couples():
    couples = Couple.query.all()
    return jsonify([{'id': c.id, 'name': c.name} for c in couples])

# Вход
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Отсутствуют данные'}), 400

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Не указан логин или пароль'}), 400

    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 401

    if not check_password_hash(user.password, password):
        return jsonify({'error': 'Неверный пароль'}), 401

    login_user(user, remember=True)
    return jsonify({'message': 'Вход выполнен', 'user_id': user.id})

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
        remove_orphan_couples()
    app.run(host='0.0.0.0')
