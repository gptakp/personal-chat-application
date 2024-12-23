import random

from flask import Flask, render_template, request, session, redirect, url_for
from flask_cors import CORS
from flask_mail import Mail
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session

# Initialize Flask app
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://postgres:jiraya@localhost/chat1"
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your_secret_key'
# Configure Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
# app.config['MAIL_USERNAME'] = 'pavanmanikantabandi9951672543@gmail.com'
app.config['MAIL_USERNAME'] = 'cmopavan@gmail.com'
#app.config['MAIL_PASSWORD'] = 'zybqsofzzihfhhpp'
app.config['MAIL_PASSWORD'] = 'qrzdumhhrteglixp'
app.config['MAIL_DEFAULT_SENDER'] = 'pavanmanikantabandi9951672543@gmail.com'

mail = Mail(app)


# Initialize CORS and session management
CORS(app, resources={r"/*": {"origins": "*"}})
Session(app)

# Initialize database and migration tools
db = SQLAlchemy(app)
migrate = Migrate(app, db)
ma = Marshmallow(app)

# Initialize SocketIO for real-time communication
socketio = SocketIO(app, cors_allowed_origins="*")