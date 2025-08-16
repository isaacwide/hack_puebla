from flask import Flask, render_template
from pymongo import MongoClient

app = Flask(__name__)

@app.route('/')
def home():
    return "Hello, Flask!"

if __name__ == '__main__':
    app.run(debug=True, port=5000)