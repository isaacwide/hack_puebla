import os
from flask import Flask, render_template, request, jsonify, flash, redirect, url_for, make_response
from pymongo import MongoClient
from bson.objectid import ObjectId
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Length, EqualTo



from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user


# --- Configuración de la Aplicación Flask ---
app = Flask(__name__)

app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'a4b927a883935f6e00c1d6955859e3999a6f4427ba9581883672a2ebd9bc8b7f') 

# --- Configuración de Flask-Login ---
login_manager = LoginManager(app)
login_manager.login_view = 'login' # La ruta a la que redirigir si el usuario no está autenticado

# --- Definición de Formularios con Flask-WTF ---
class LoginForm(FlaskForm): 
    username = StringField('Usuario', validators=[DataRequired(), Length(min=4)])
    password = PasswordField('Contraseña', validators=[DataRequired()])
    submit = SubmitField('Iniciar Sesión')

class RegisterForm(FlaskForm):
    username = StringField('Usuario', validators=[DataRequired(), Length(min=4)])
    password = PasswordField('Contraseña', validators=[DataRequired()])
    confirm_password = PasswordField('Confirmar Contraseña', validators=[DataRequired(), EqualTo('password', message='Las contraseñas no coinciden')])
    submit = SubmitField('Registrarse')

class User(UserMixin):
    def __init__(self, user_data):
        self.username = user_data['username']
        self.password = user_data['password'] # Almacenar la contraseña en texto plano (INSEGURO)
        self.id = str(user_data['_id']) # Flask-Login necesita un 'id' como string

    def check_password(self, password):
        # Verifica la contraseña ingresada directamente con la almacenada (INSEGURO)
        return password == self.password 

# Función user_loader para Flask-Login
# Le dice a Flask-Login cómo cargar un usuario dado su ID de sesión
@login_manager.user_loader
def load_user(user_id):
    # Busca el usuario por su ObjectId en la colección de usuarios
    user_data = users_collection.find_one({"_id": ObjectId(user_id)})
    if user_data:
        return User(user_data)
    return None

# --- Configuración de MongoDB Atlas ---
MONGO_URI = os.environ.get('MONGO_URI')

if not MONGO_URI:
    print("ERROR: La variable de entorno MONGO_URI no está configurada.")
    print("Por favor, establece MONGO_URI con tu cadena de conexión de MongoDB Atlas.")
    exit("Configuración de MONGO_URI fallida. Saliendo.")

try:
    client = MongoClient(MONGO_URI)
    # Base de datos principal para las vistas de los problemas y los usuarios
    db = client.get_database('main_dataBase') 
    incidentes_collection = db.url_analysis # Colección para tus datos de análisis de URL
    users_collection = db.users # ¡Nueva colección para los usuarios! (Asegúrate que se llama 'users' en Atlas)
    print("Conexión a MongoDB Atlas establecida con éxito.")
except Exception as e:
    print(f"ERROR: No se pudo conectar a MongoDB Atlas: {e}")
    exit("Fallo en la conexión a la base de datos. Saliendo.")


# --- Manejo de errores 404 personalizado ---
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

# --- Rutas de Autenticación ---

@app.route('/login', methods=['GET', 'POST'])
def login():
    # Si el usuario ya está autenticado, redirigir a la página principal (main)
    if current_user.is_authenticated:
        return redirect(url_for('first_page')) 

    form = LoginForm() 

    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data
        
        # Buscar al usuario en la colección de usuarios
        user_data = users_collection.find_one({'username': username})

        if user_data:
            user = User(user_data) 
            # Verificar la contraseña (recuerda la advertencia de seguridad si no usas hashing)
            if user.check_password(password):
                login_user(user) # Inicia sesión con Flask-Login
                flash(f'¡Bienvenido, {username}! Inicio de sesión exitoso.', 'success')
                return redirect(url_for('first_page')) 
            else:
                flash('Usuario o contraseña incorrectos.', 'danger')
        else:
            flash('Usuario o contraseña incorrectos.', 'danger')
    
    # Renderiza la plantilla de login si es GET o si el formulario no es válido
    return render_template("login.html", form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    # Si el usuario ya está autenticado, redirigir al dashboard
    if current_user.is_authenticated:
        return redirect(url_for('first_page')) # Redirige a la página principal

    form = RegisterForm() # Usar el formulario de registro

    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data

        # 1. Verificar si el usuario ya existe
        existing_user = users_collection.find_one({'username': username})
        if existing_user:
            flash('El nombre de usuario ya existe. Por favor, elige otro.', 'danger')
            return redirect(url_for('register'))

        
        users_collection.insert_one({
            'username': username,
            'password': password 
        })

        flash('¡Registro exitoso! Ahora puedes iniciar sesión.', 'success')
        return redirect(url_for('login'))
    
    # Renderiza la plantilla de registro
    return render_template('register.html', form=form)

@app.route('/logout')
@login_required 
def logout_out(): 
    logout_user() 
    flash('Has cerrado sesión.', 'info')
    return redirect(url_for('login')) # Redirige a la página de login

# --- Rutas de la Aplicación Principal ---


@app.route('/')
def index_redirect():
    return redirect(url_for('login'))

@app.route('/main')
@login_required # Proteger también la página principal si quieres que sea solo para usuarios logueados
def first_page():
    return render_template("landing_page.html")

@app.route('/dashboard')
@login_required # Asegura que solo usuarios autenticados accedan a este dashboard
def dashboard():
    
    incidentes = list(incidentes_collection.find().sort("timestamp", -1))
    
    response = make_response(render_template('index.html', incidentes=incidentes))
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# --- Rutas de la API (Base de Datos) ---

@app.route('/api/incidente/<incidente_id>', methods=['GET'])
def get_incidente(incidente_id):
    try:
        # Convierte la cadena incidente_id a ObjectId para buscar en MongoDB
        incidente = incidentes_collection.find_one({"_id": ObjectId(incidente_id)})
        if incidente:
            incidente['_id'] = str(incidente['_id']) 
            return jsonify({"success": True, "incidente": incidente}), 200
        else:
            return jsonify({"success": False, "message": "Incidente no encontrado."}), 404
    except Exception as e:
        return jsonify({"success": False, "error": f"ID de incidente inválido o error al buscar: {e}"}), 400


# --- Ejecutar la Aplicación Flask ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)
