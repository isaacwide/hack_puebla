#pip install python-dotenv
#pip install flask requests
from flask import Flask, request, jsonify
import requests
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

@app.route('/analizar-url', methods=['POST'])
def analizar_url():
    data = request.get_json()
    url = data.get('url')
    prompt = f"¿La siguiente URL es peligrosa para un menor? Categoriza: {url}"
    gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_API_KEY
    }
    response = requests.post(gemini_url, json=payload, headers=headers)
    result = response.json()
    print(result)  # Para depuración
    texto = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'Sin respuesta')
    return jsonify({"resultado": texto})

if __name__ == '__main__':
    app.run(port=3000)