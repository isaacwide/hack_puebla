#pip install python-dotenv
#pip install flask requests
#pip install flask-cors
from flask import Flask, request, jsonify
import requests
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()
app = Flask(__name__)
CORS(app, origins=["chrome-extension://mdfakkfpmjoknkmmdfmgcnfbkhgkalpk"])
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

@app.route('/analizar-url', methods=['POST'])
def analizar_url():
    data = request.get_json()
    url = data.get('url')
    categorias = [
        "Sitios de apuestas",
        "Contenido para adultos",
        "Redes sociales no permitidas",
        "Violencia explícita",
        "Desafíos peligrosos",
        "Fake news y desinformación"
    ]
    prompt = (
        f"Instruction: Classify the following URL for parental control.\n"
        f"Respond with ONLY the exact name of the category from this list if it applies: {', '.join(categorias)}.\n"
        f"If it does not belong to any, respond with ONLY the word SAFE.\n"
        f"DO NOT EXPLAIN, DO NOT ADD ANY TEXT, DO NOT USE QUOTES, DO NOT FORMAT, JUST RESPOND WITH ONE WORD OR EXACT PHRASE FROM THE LIST.\n"
        f"Example 1:\nURL: https://youtube.com\nAnswer: SAFE\n"
        f"Example 2:\nURL: https://www.caliente.mx\nAnswer: Sitios de apuestas\n"
        f"URL: {url}\nAnswer:"
    )
    # prompt = (
    #     f"En base a esta URL: {url}\n"
    #     f"Responde SOLO una palabra: elige exactamente una de estas categorías donde consideres que se clasifique: ({', '.join(categorias)}) si aplica, o 'SEGURA' si no. "
    #     f"No expliques nada, no agregues texto, solo responde la palabra."
    # )
    gemini_url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent"
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
    texto_lower = texto.lower()
    match = next((cat for cat in categorias if cat.lower() in texto_lower), None)
    if not match and any(word in texto_lower for word in ['segura', 'inofensiva', 'safe']):
        match = 'SEGURA'
    return jsonify({"resultado": match or 'Sin respuesta'})

if __name__ == '__main__':
    app.run(port=3000)