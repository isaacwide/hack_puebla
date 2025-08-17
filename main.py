from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os

app = Flask(__name__)
DATABASE = os.path.join(os.getcwd(), 'incidentes.db')

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def create_table():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS incidentes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            texto TEXT NOT NULL,
            url TEXT NOT NULL,
            categoria TEXT NOT NULL,
            motivo TEXT NOT NULL,
            fecha TIMESTAMP NOT NULL
        );
    ''')
    conn.commit()
    conn.close()

create_table()

# --- NUEVA RUTA para la página de inicio ---
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