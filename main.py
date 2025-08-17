import os
from flask import Flask, render_template, request, jsonify
from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId # Importa ObjectId para trabajar con los IDs de MongoDB
from forms import LoginForm


app = Flask(__name__)

app.config['SECRET_KEY'] = ':&lY~-P)d7FOo}rZjg-?KZ@~E0z8V?J/hvy$hFn&#!vP!8JtCr'



MONGO_URI = os.environ.get('MONGO_URI')

if not MONGO_URI:
    print("ERROR: La variable de entorno MONGO_URI no está configurada.")
    print("Por favor, establece MONGO_URI con tu cadena de conexión de MongoDB Atlas.")
    exit("Configuración de MONGO_URI fallida. Saliendo.")

try:
    client = MongoClient(MONGO_URI)
    db = client.get_database('main_dataBase') 
    incidentes_collection = db.data 
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
    form = LoginForm()

    if form.validate_on_submit():
        user = form.username.data
        password =form.password.data

    return render_template("login.html",form=form)


@app.route('/')
def landing_page():
    """Sirve la página de inicio."""
    return render_template('landing_page.html')

@app.route('/dashboard')
def dashboard():
    
    incidentes = list(incidentes_collection.find().sort("fecha", -1))
    
    # Renderiza la plantilla 'index.html' y le pasa la lista de incidentes
    return render_template('index.html', incidentes=incidentes)

# --- Rutas de la API (Base de Datos) ---

@app.route('/api/incidente/<incidente_id>', methods=['GET'])
def get_incidente(incidente_id):
    #obtener el inicidente 
    try:
        # Convierte la cadena incidente_id a ObjectId para buscar en MongoDB
        incidente = incidentes_collection.find_one({"_id": ObjectId(incidente_id)})
        if incidente:
            incidente['_id'] = str(incidente['_id']) # Convierte ObjectId a string para JSON
            return jsonify({"success": True, "incidente": incidente}), 200
        else:
            return jsonify({"success": False, "message": "Incidente no encontrado."}), 404
    except Exception as e:
        return jsonify({"success": False, "error": f"ID de incidente inválido o error al buscar: {e}"}), 400


# --- Ejecutar la Aplicación Flask ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)
