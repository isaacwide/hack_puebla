import os
from flask import Flask, render_template, request, jsonify, flash, redirect, url_for
from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
from flask_wtf import FlaskForm # Importa FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Length


app = Flask(__name__)

app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'una_clave_secreta_de_desarrollo') 

class LoginForm(FlaskForm): 
    username = StringField('Usuario', validators=[DataRequired(), Length(min=4)])
    password = PasswordField('Contraseña', validators=[DataRequired()])
    submit = SubmitField('Iniciar Sesión')

# Configuración de MongoDB Atlas
MONGO_URI = os.environ.get('MONGO_URI')

if not MONGO_URI:
    print("ERROR: La variable de entorno MONGO_URI no está configurada.")

try:
    client = MongoClient(MONGO_URI)
    db = client.get_database('main_dataBase') 
    incidentes_collection = db.url_analysis 
    print("Conexión a MongoDB Atlas establecida con éxito.")
except Exception as e:
    print(f"ERROR: No se pudo conectar a MongoDB Atlas: {e}")
    exit("Fallo en la conexión a la base de datos. Saliendo.")


@app.errorhandler(404)
def page_not_found(e):
    """Manejo de errores 404 personalizado."""
    return render_template('404.html'), 404

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm() #

    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data
        
        
        # Ejemplo muy simplificado y NO SEGURO (SOLO PARA PROBAR LA LOGICA DEL FORMULARIO)
        if username == 'test' and password == 'testpass':
            flash('Inicio de sesión exitoso!', 'success')
            return redirect(url_for('dashboard')) # Redirige al dashboard si el login es correcto
        else:
            flash('Usuario o contraseña incorrectos.', 'danger')
            return redirect(url_for('login')) # Vuelve a la página de login
    
    return render_template("login.html", form=form)


@app.route('/')
def landing_page():
    """Sirve la página de inicio."""
    return render_template('landing_page.html')

@app.route('/dashboard')
def dashboard():
    # En un sistema real, esta ruta debería estar protegida con @login_required
    # de Flask-Login para asegurar que solo usuarios autenticados accedan.
    incidentes = list(incidentes_collection.find().sort("fecha", -1))
    return render_template('index.html', incidentes=incidentes)

# --- Rutas de la API (Base de Datos) ---

@app.route('/api/incidente/<incidente_id>', methods=['GET'])
def get_incidente(incidente_id):
    try:
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