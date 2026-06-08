from dotenv import load_dotenv
load_dotenv()  # Must run before any import that reads os.getenv() at module level

from flask import Flask
from flask_cors import CORS
from database import db
from routes.task_routes import task_bp
from routes.user_routes import user_bp
from routes.report_routes import report_bp
import os
import datetime

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///tasks.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

secret_key = os.getenv('SECRET_KEY')
if not secret_key:
    raise EnvironmentError('SECRET_KEY environment variable is required')
app.config['SECRET_KEY'] = secret_key

CORS(app)
db.init_app(app)

app.register_blueprint(task_bp)
app.register_blueprint(user_bp)
app.register_blueprint(report_bp)

@app.route('/health')
def health():
    return {'status': 'ok', 'timestamp': str(datetime.datetime.now())}

@app.route('/')
def index():
    return {'message': 'Task Manager API', 'version': '1.0'}

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
