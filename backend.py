import os
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo.mongo_client import MongoClient
from bson.objectid import ObjectId
from google.generativeai import GenerativeModel

# --- 1. CONFIGURACIÓN INICIAL Y CARGA DE VARIABLES DE ENTORNO ---
# Asegúrate de haber instalado las librerías necesarias:
# pip install Flask flask-cors pymongo google-generativeai

# Carga las variables de entorno. Es crucial no codificar las claves directamente.
# El servidor debe tener estas variables configuradas antes de ejecutarse.
# Ejemplo:
# export MONGO_URI="mongodb+srv://..."
# export GEMINI_API_KEY="AIzaSyB..."

MONGO_URI = os.getenv("MONGO_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Verifica si las variables se cargaron correctamente
if not MONGO_URI:
    print("Error: La variable de entorno MONGO_URI no está configurada.")
    exit()
if not GEMINI_API_KEY:
    print("Error: La variable de entorno GEMINI_API_KEY no está configurada.")
    exit()

# Inicialización de la aplicación Flask
app = Flask(__name__)
CORS(app)

# --- 2. CONEXIÓN A LA BASE DE DATOS Y LA API DE GEMINI ---

try:
    client = MongoClient(MONGO_URI)
    # Conectándose a la base de datos principal
    db = client.get_database("main_dataBase")
    print("Conexión a MongoDB exitosa.")
except Exception as e:
    print(f"Error al conectar a MongoDB: {e}")
    client = None

try:
    gemini_model = GenerativeModel("gemini-2.5-flash-preview-05-20")
    print("Modelo de Gemini inicializado correctamente.")
except Exception as e:
    print(f"Error al inicializar el modelo de Gemini: {e}")
    gemini_model = None

# --- 3. ENDPOINT DE LA API PARA EL ANÁLISIS DE URLS ---

@app.route('/api/analizar-url', methods=['POST'])
def analizar_url():
    """
    Endpoint para analizar una URL y determinar si es segura.
    La extensión de Chrome llama a este endpoint.
    """
    if not request.json or 'url' not in request.json:
        return jsonify({"error": "No se encontró 'url' en la solicitud."}), 400

    url_to_analyze = request.json['url']
    print(f"Recibida solicitud para analizar URL: {url_to_analyze}")

    if not gemini_model:
        return jsonify({"error": "El modelo de Gemini no está disponible."}), 503

    try:
        prompt = (
            "Analiza el contenido de esta URL: "
            f"{url_to_analyze}. "
            "Clasifica el contenido como 'URL Segura', 'Contenido Inapropiado para Menores' o "
            "'Página para Adultos'. Proporciona una explicación breve y concisa del porqué, "
            "incluyendo ejemplos si es posible."
        )
        response = gemini_model.generate_content(prompt)
        gemini_text = response.candidates[0].content.parts[0].text

        incidente_type = gemini_text.split('\n')[0].strip()
        valid_types = ['URL Segura', 'Contenido Inapropiado para Menores', 'Página para Adultos']
        
        if incidente_type not in valid_types:
            incidente_type = 'Análisis no categorizado'

        if client:
            # Se genera un documento en el formato JSON especificado por el usuario
            analysis_data = {
                "url": url_to_analyze,
                "tipo_de_incidente": incidente_type,
                "texto": gemini_text,
                "categoria": "Contenido No Deseado",
                "motivo": "Clasificación de seguridad",
                "usuario_id": "sistema_automatizado",
                "fecha": datetime.datetime.now() # Se agrega la fecha para mantener un registro
            }
            # Se usa la colección correcta 'url_analysis' para evitar que se creen nuevas tablas
            db.url_analysis.insert_one(analysis_data)
            print("Datos de análisis guardados en MongoDB.")

        return jsonify({
            "url_analizada": url_to_analyze,
            "tipo_de_incidente": incidente_type,
            "gemini_response": gemini_text
        })

    except Exception as e:
        print(f"Error en el endpoint /api/analizar-url: {e}")
        return jsonify({"error": "Ocurrió un error en el servidor."}), 500

# --- 4. ENDPOINT PARA OBTENER EL HISTORIAL DE ANÁLISIS ---

@app.route('/api/history', methods=['GET'])
def get_history():
    """
    Endpoint para obtener todo el historial de análisis de URLs.
    No requiere parámetros.
    """
    if not client:
        return jsonify({"error": "No hay conexión a la base de datos."}), 503

    try:
        # Busca todos los documentos en la colección 'url_analysis'
        history = list(db.url_analysis.find({}).sort("fecha", -1))
        
        # Convierte el ObjectId a string para que se pueda serializar a JSON
        for record in history:
            record['_id'] = str(record['_id'])
            
        print(f"Se encontraron {len(history)} registros en el historial.")
        return jsonify(history), 200

    except Exception as e:
        print(f"Error al obtener el historial: {e}")
        return jsonify({"error": "Ocurrió un error en el servidor al obtener el historial."}), 500

# --- 5. EJECUCIÓN DEL SERVIDOR ---

if __name__ == '__main__':
    app.run(debug=True, port=5000)
