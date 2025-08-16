from flask import Flask, render_template
import os 
from pymongo import MongoClient
# Initialize Flask application
MONGO_URI = os.environ.get('MONGO_URI')
app = Flask(__name__)

if not MONGO_URI:
    print("MONGO_URI environment variable not set.")

try :
    client = MongoClient(MONGO_URI)
    db = client.get_database('base_de_datos_principal' )
    collection = db.data
    print("Connected to MongoDB successfully.")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")

@app.route('/')
def home():
    return "Hello, Flask!"

if __name__ == '__main__':
    app.run(debug=True, port=5000)