from flask import Flask, render_template, request, jsonify
import sqlite3
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