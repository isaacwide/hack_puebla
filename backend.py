import os
from flask import Flask, render_template, request, jsonify
from datetime import datetime
from pymongo import MongoClient
from bson.objectid import ObjectId # Importa ObjectId para trabajar con los IDs de MongoDB
import requests # Importa la librería requests para hacer llamadas HTTP a la API de Gemini

app = Flask(__name__)


MONGO_URI = os.environ.get('mongodb+srv://isacaguilar222:1Y3nMiJUvATt7nIG@database.ezqrcly.mongodb.net/?retryWrites=true&w=majority&appName=dataBase')
if not MONGO_URI:
    print("ERROR: La variable de entorno MONGO_URI no está configurada.")
try:
    client = MongoClient(MONGO_URI)
    db = client.get_database('main_dataBase') 
    incidentes_collection = db.data 
    print("Conexión a MongoDB Atlas establecida con éxito.")

except Exception as e:
    print(f"ERROR: No se pudo conectar a MongoDB Atlas: {e}")
    exit("Fallo en la conexión a la base de datos. Saliendo.")


GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    print("ERROR: La variable de entorno GEMINI_API_KEY no está configurada.")

@app.route('/')
def landing_page():
    """Sirve la página de inicio."""
    return render_template('landing_page.html')

@app.route('/dashboard')
def dashboard():
    """Muestra la página del dashboard con los incidentes."""
    incidentes = list(incidentes_collection.find().sort("fecha", -1))
    return render_template('index.html', incidentes=incidentes)


# --- NUEVA RUTA: Analizar URL con Gemini y Guardar en MongoDB ---
@app.route('/api/analizar-url', methods=['POST'])
def analizar_url():
    """
    Recibe una URL, la analiza con la API de Gemini para detectar contenido peligroso
    para menores, y guarda el resultado como un incidente en MongoDB.
    """
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"error": "Falta la 'url' en la solicitud."}), 400

    prompt = f"Analiza la siguiente URL e indica si contiene contenido para adultos o inadecuado para menores. Proporciona una respuesta breve y clara: {url}. Responde con 'ADULTO', 'INFANTIL_INAPROPIADO', 'SEGURO' o 'DESCONOCIDO' seguido de una breve explicación."
    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2, # Un valor más bajo para respuestas más concisas y menos creativas
            "maxOutputTokens": 100 # Limitar la longitud de la respuesta
        }
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(gemini_url, json=payload, headers=headers)
        response.raise_for_status() # Lanza un error para códigos de estado HTTP 4xx/5xx

        gemini_result = response.json()
        
        # Extrae el texto generado por Gemini
        gemini_text = gemini_result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'Sin respuesta de Gemini.')
        
        # --- Determinar los campos del incidente basado en la respuesta de Gemini ---
        tipo_de_incidente = "Desconocido"
        categoria = "Análisis de Contenido"
        motivo = "Análisis automatizado por IA"
        usuario_id = "sistema_gemini_analisis"
        texto_incidente = gemini_text # El texto de la respuesta de Gemini será el 'texto' del incidente

        # Lógica simple para clasificar basada en la respuesta de Gemini
        if "ADULTO" in gemini_text.upper():
            tipo_de_incidente = "Página para Adultos"
            categoria = "Contenido Explícito"
        elif "INFANTIL_INAPROPIADO" in gemini_text.upper():
            tipo_de_incidente = "Contenido Inapropiado para Menores"
            categoria = "Protección Infantil"
        elif "SEGURO" in gemini_text.upper():
            tipo_de_incidente = "URL Segura"
            categoria = "Verificación de Seguridad"
        
        # Crea el documento incidente con los datos procesados
        incidente_document = {
            "url": url,
            "tipo_de_incidente": tipo_de_incidente,
            "texto": texto_incidente,
            "categoria": categoria,
            "motivo": motivo,
            "usuario_id": usuario_id,
            "fecha": datetime.now()
        }

        # Inserta el documento en la colección de incidentes
        insert_result = incidentes_collection.insert_one(incidente_document)
        
        return jsonify({
            "success": True,
            "message": "URL analizada y incidente registrado con éxito.",
            "gemini_response": gemini_text,
            "incidente_id": str(insert_result.inserted_id)
        }), 201

    except requests.exceptions.RequestException as e:
        print(f"Error al llamar a la API de Gemini: {e}")
        return jsonify({"success": False, "error": f"Error al analizar URL con Gemini: {e}"}), 500
    except Exception as e:
        print(f"Error inesperado: {e}")
        return jsonify({"success": False, "error": f"Error interno del servidor: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)