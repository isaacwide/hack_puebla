from flask import Flask, render_template, request, jsonify
import sqlite3
from datetime import datetime
from pymongo import MongoClient
import os

app = Flask(__name__)
MONGO_URI = os.environ.get('MONGO_URI')

if not MONGO_URI:
    print("error: MONGO_URI environment variable not set.")


try:
    client = MongoClient(MONGO_URI)
  
except Exception as e:
    print(f"error: Could not connect to MongoDB. {e}")

# --- NUEVA RUTA para la página de inicio ---
@app.route('/')
def landing_page():
    return render_template('landing_page.html')

# --- RUTA EXISTENTE para el dashboard (ahora en /dashboard) ---
@app.route('/dashboard')
def dashboard():
    conn = get_db_connection()
    incidentes = conn.execute('SELECT * FROM incidentes ORDER BY fecha DESC').fetchall()
    conn.close()
    return render_template('index.html', incidentes=incidentes)

@app.route('/api/incidente', methods=['POST'])
def registrar_incidente():
    data = request.json
    texto = data.get('texto')
    url = data.get('url')
    categoria = data.get('categoria')
    motivo = data.get('motivo')
    
    if not all([texto, url, categoria, motivo]):
        return jsonify({"error": "Faltan datos en la solicitud"}), 400
    
    conn = get_db_connection()
    conn.execute('INSERT INTO incidentes (texto, url, categoria, motivo, fecha) VALUES (?, ?, ?, ?, ?)',
                 (texto, url, categoria, motivo, datetime.now()))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Incidente registrado."}), 201

if __name__ == '__main__':
    app.run(debug=True)