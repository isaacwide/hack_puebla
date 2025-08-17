import os
import datetime
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo.mongo_client import MongoClient
from bson.objectid import ObjectId
from google.generativeai import GenerativeModel
import google.generativeai as genai

# --- 1. CONFIGURACIÓN INICIAL Y CARGA DE VARIABLES DE ENTORNO ---
# Asegúrate de haber instalado las librerías necesarias:
# pip install Flask flask-cors pymongo google-generativeai

# Carga las variables de entorno.
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
    db = client.get_database("main_dataBase")
    print("Conexión a MongoDB exitosa.")
except Exception as e:
    print(f"Error al conectar a MongoDB: {e}")
    client = None

try:
    # Configura la API Key para el modelo de Gemini
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = GenerativeModel("gemini-2.5-flash-preview-05-20")
    print("Modelo de Gemini inicializado correctamente.")
except Exception as e:
    print(f"Error al inicializar el modelo de Gemini: {e}")
    gemini_model = None

# --- 3. ENDPOINT EXISTENTE PARA EL ANÁLISIS DE URLS ---

@app.route('/api/analizar-url', methods=['POST'])
def analizar_url():
    """
    Endpoint para analizar una URL y determinar si es segura.
    """
    if not request.json or 'url' not in request.json:
        return jsonify({"error": "No se encontró 'url' en la solicitud."}), 400

    url_to_analyze = request.json['url']
    print(f"Recibida solicitud para analizar URL: {url_to_analyze}")

    if not gemini_model:
        return jsonify({"error": "El modelo de Gemini no está disponible."}), 503

    try:
        # Prompt modificado para que el modelo devuelva el JSON directamente en el texto
        prompt = (
            f"Analiza el contenido de esta URL: {url_to_analyze}. "
            "Clasifica el contenido como 'URL Segura', 'Contenido Inapropiado para Menores' o "
            "'Página para Adultos'. Proporciona una explicación breve y concisa. "
            "Luego, genera una lista de 3 consejos de seguridad en formato JSON. "
            "Cada consejo debe tener un 'titulo' y una 'descripcion'. "
            "El formato de la respuesta debe ser un solo objeto JSON con las claves "
            "'tipo_de_incidente', 'explicacion' y 'consejos_seguridad'. "
            "Asegúrate de que la respuesta sea un JSON válido y nada más."
        )
        
        # Eliminar generation_config ya que causa un error
        response = gemini_model.generate_content(
            contents=[{"parts": [{"text": prompt}]}]
        )
        
        gemini_json_str = response.candidates[0].content.parts[0].text
        print(f"Respuesta cruda de Gemini: {gemini_json_str}")

        # Extraer el JSON del texto de la respuesta para evitar errores de parseo
        json_start = gemini_json_str.find('{')
        json_end = gemini_json_str.rfind('}')
        
        if json_start == -1 or json_end == -1 or json_end < json_start:
            raise json.JSONDecodeError("No se pudo encontrar un JSON válido en la respuesta del modelo.", gemini_json_str, 0)
        
        clean_json_str = gemini_json_str[json_start : json_end + 1]
        result = json.loads(clean_json_str)

        incidente_type = result.get('tipo_de_incidente', 'Análisis no categorizado')
        gemini_explanation = result.get('explicacion', '')

        if client:
            analysis_data = {
                "url": url_to_analyze,
                "tipo_de_incidente": incidente_type,
                "texto": gemini_explanation,
                "categoria": "Contenido No Deseado",
                "motivo": "Clasificación de seguridad",
                "usuario_id": "sistema_automatizado",
                "fecha": datetime.datetime.now()
            }
            db.url_analysis.insert_one(analysis_data)
            print("Datos de análisis de URL guardados en MongoDB.")

        return jsonify({
            "url_analizada": url_to_analyze,
            "tipo_de_incidente": incidente_type,
            "gemini_response": gemini_explanation,
            "consejos_seguridad": result.get('consejos_seguridad', [])
        })

    except (json.JSONDecodeError, Exception) as e:
        print(f"Error en el endpoint /api/analizar-url: {e}")
        return jsonify({"error": "Ocurrió un error en el servidor o el formato de respuesta del modelo no es válido."}), 500

# --- 4. NUEVO ENDPOINT PARA ANÁLISIS DE TEXTO EN TIEMPO REAL ---

@app.route('/api/analizar-texto', methods=['POST'])
def analizar_texto():
    """
    Nuevo endpoint para analizar texto de conversaciones y detectar patrones de grooming.
    Recibe un fragmento de texto y devuelve un análisis de riesgo y consejos.
    """
    if not request.json or 'texto' not in request.json:
        return jsonify({"error": "No se encontró 'texto' en la solicitud."}), 400

    text_to_analyze = request.json['texto']
    print(f"Recibida solicitud para analizar texto: {text_to_analyze}")

    if not gemini_model:
        return jsonify({"error": "El modelo de Gemini no está disponible."}), 503

    try:
        # Prompt modificado para que el modelo devuelva el JSON directamente en el texto
        prompt = (
            "Analiza el siguiente texto de una conversación: "
            f"'{text_to_analyze}'. "
            "Detecta si el texto contiene patrones de grooming o comportamiento de riesgo. "
            "Clasifica el riesgo en 'Bajo', 'Medio' o 'Alto'. "
            "Proporciona una explicación del riesgo en no más de 50 palabras. "
            "Luego, genera una lista de 3 consejos de seguridad específicos para este contexto. "
            "El formato de la respuesta debe ser un solo objeto JSON con las claves "
            "'nivel_de_riesgo', 'explicacion' y 'consejos_seguridad'. "
            "Cada consejo debe tener un 'titulo' y una 'descripcion'. "
            "Asegúrate de que la respuesta sea un JSON válido y nada más."
        )

        # Eliminar generation_config ya que causa un error
        response = gemini_model.generate_content(
            contents=[{"parts": [{"text": prompt}]}]
        )
        
        gemini_json_str = response.candidates[0].content.parts[0].text
        print(f"Respuesta cruda de Gemini: {gemini_json_str}")

        # Extraer el JSON del texto de la respuesta para evitar errores de parseo
        json_start = gemini_json_str.find('{')
        json_end = gemini_json_str.rfind('}')
        
        if json_start == -1 or json_end == -1 or json_end < json_start:
            raise json.JSONDecodeError("No se pudo encontrar un JSON válido en la respuesta del modelo.", gemini_json_str, 0)

        clean_json_str = gemini_json_str[json_start : json_end + 1]
        result = json.loads(clean_json_str)

        # Se guarda el registro del análisis de texto en la base de datos
        if client:
            analysis_data = {
                "texto_analizado": text_to_analyze,
                "nivel_de_riesgo": result.get('nivel_de_riesgo', 'Desconocido'),
                "explicacion": result.get('explicacion', ''),
                "fecha": datetime.datetime.now()
            }
            db.text_analysis.insert_one(analysis_data)
            print("Datos de análisis de texto guardados en MongoDB.")

        return jsonify(result)

    except (json.JSONDecodeError, Exception) as e:
        print(f"Error en el endpoint /api/analizar-texto: {e}")
        return jsonify({"error": "Ocurrió un error en el servidor o el formato de respuesta del modelo no es válido."}), 500

# --- 5. ENDPOINT EXISTENTE PARA OBTENER EL HISTORIAL DE ANÁLISIS ---

@app.route('/api/history', methods=['GET'])
def get_history():
    """
    Endpoint para obtener todo el historial de análisis de URLs y texto.
    """
    if not client:
        return jsonify({"error": "No hay conexión a la base de datos."}), 503

    try:
        # Busca todos los documentos en la colección 'url_analysis' y 'text_analysis'
        url_history = list(db.url_analysis.find({}).sort("fecha", -1))
        text_history = list(db.text_analysis.find({}).sort("fecha", -1))
        
        # Convierte el ObjectId a string
        for record in url_history:
            record['_id'] = str(record['_id'])
        for record in text_history:
            record['_id'] = str(record['_id'])
            
        full_history = {
            "url_analysis": url_history,
            "text_analysis": text_history
        }
            
        print(f"Se encontraron {len(url_history)} registros de URL y {len(text_history)} de texto.")
        return jsonify(full_history), 200

    except Exception as e:
        print(f"Error al obtener el historial: {e}")
        return jsonify({"error": "Ocurrió un error en el servidor al obtener el historial."}), 500

# --- 6. EJECUCIÓN DEL SERVIDOR ---

if __name__ == '__main__':
    app.run(debug=True, port=5000)