from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
CORS(app, origins=["http://localhost:5173"])

from backend.routes.auth import auth_bp
from backend.routes.document import document_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(document_bp, url_prefix='/api/document')

@app.route('/')
def health():
    return {"status": "Textify API running", "version": "2.0"}

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
