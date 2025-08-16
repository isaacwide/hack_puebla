from flask import Flask, render_template, request, jsonify
from datetime import datetime
from pymongo import MongoClient

app = Flask(__name__)

# --- Configuración de la base de datos MongoDB ---
MONGO_URI = "mongodb+srv://isacaguilar222:1Y3nMiJUvATt7nIG@database.ezqrcly.mongodb.net/?retryWrites=true&w=majority&appName=dataBaseisacaaguilar222"
DB_NAME = "main_dataBase"
COLLECTION_NAME = "data"

def get_mongo_collection():
    """Establece la conexión a MongoDB y retorna la colección."""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        print("Conectado exitosamente a MongoDB.")
        return collection
    except Exception as e:
        print(f"Error al conectar a MongoDB: {e}")
        return None

# Obtiene la colección de incidentes al iniciar la aplicación
incidentes_collection = get_mongo_collection()

@app.route('/')
def landing_page():
    return render_template('landing_page.html')

@app.route('/dashboard')
def dashboard():
    if not incidentes_collection:
        return "Error: No se pudo conectar a la base de datos.", 500

    # Busca todos los documentos, los ordena por fecha y los convierte a una lista
    # La conversion es necesaria porque pymongo.cursor no se puede pasar directamente a la plantilla
    incidentes = list(incidentes_collection.find().sort("fecha", -1))
    
    return render_template('index.html', incidentes=incidentes)

@app.route('/api/incidente', methods=['POST'])
def registrar_incidente():
    if not incidentes_collection:
        return jsonify({"error": "No se pudo conectar a la base de datos."}), 500
        
    data = request.json
    texto = data.get('texto')
    url = data.get('url')
    categoria = data.get('categoria')
    motivo = data.get('motivo')
    usuario_id = data.get('usuario_id')
    tipo_de_incidente = data.get('tipo_de_incidente')
    
    if not all([texto, url, categoria, motivo, usuario_id, tipo_de_incidente]):
        return jsonify({"error": "Faltan datos en la solicitud"}), 400
    
    incidente_document = {
        "texto": texto,
        "url": url,
        "categoria": categoria,
        "motivo": motivo,
        "usuario_id": usuario_id,
        "tipo_de_incidente": tipo_de_incidente,
        "fecha": datetime.now()
    }
    
    # Inserta el documento en la colección de incidentes
    result = incidentes_collection.insert_one(incidente_document)
    
    return jsonify({"success": True, "message": "Incidente registrado.", "id": str(result.inserted_id)}), 201

if __name__ == '__main__':
    app.run(debug=True)