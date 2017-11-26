from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_utils import PasswordType, force_auto_coercion
from flask_cors import CORS
import config
from itsdangerous import TimedJSONWebSignatureSerializer as JWT
from flask_httpauth import HTTPTokenAuth

app = Flask(__name__, static_folder='static', static_url_path='')
cors = CORS(app, resources={r"*": {"origins": "*"}})
jwt = JWT(config.SECRET_KEY, expires_in=360000)
auth = HTTPTokenAuth('Bearer')

db = SQLAlchemy()

app.config['SQLALCHEMY_DATABASE_URI'] = config.SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = config.SQLALCHEMY_TRACK_MODIFICATIONS
app.config['BUNDLE_ERRORS'] = True

with app.app_context():
    db.init_app(app)

force_auto_coercion()

from backend import models, api
