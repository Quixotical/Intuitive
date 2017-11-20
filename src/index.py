import os
from flask import Flask, g
from flask_restful import Api, Resource, reqparse, fields, marshal
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_utils import PasswordType, force_auto_coercion
from flask_cors import CORS
import config
import time, datetime, random, string
from itsdangerous import TimedJSONWebSignatureSerializer as JWT
from flask_httpauth import HTTPTokenAuth
from passlib.apps import custom_app_context as pwd_context

from model_helpers import make_jsonifiable, update_model
from field_validators import password_length, fullname_length, validate_email


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

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    social_id = db.Column(db.String(64), nullable=False, unique=True)
    fullname = db.Column(db.String(64), nullable=False)
    email = db.Column(db.String(64), nullable=False)
    password_hash = db.Column(db.String(128), nullable=True)

    def hash_password(self, password):
        self.password_hash = pwd_context.encrypt(password)

    def verify_password(self, password):
        return pwd_context.verify(password, self.password_hash)

    def __repr__(self):
        return str({'id':self.id, 'social_id':self.social_id, 'fullname':self.fullname, 'email':self.email, 'password_hash':self.password_hash})

class ProductArea(db.Model):
    __tablename__ = 'product_areas'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(64), nullable=False)
    description = db.Column(db.String(64), nullable=True)
    product_features = db.relationship('FeatureRequest', backref='product_features', lazy='dynamic')

    def __repr__(self):
        return str({'id':self.id, 'name':self.name, 'description':self.description,
     'features':self.features})

class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(64), nullable=False)
    product_features = db.relationship('FeatureRequest', backref='client_features', lazy='dynamic')

    def __repr__(self):
        return str({'id':self.id, 'name':self.name, 'features':self.features})

class FeatureRequest(db.Model):
    __tablename__ = 'feature_requests'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(128))
    description = db.Column(db.String(255))
    priority = db.Column(db.Integer)
    target_date = db.Column(db.DateTime)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'))
    product_area_id = db.Column(db.Integer, db.ForeignKey('product_areas.id'))

    def __repr__(self):
        return str({'id':self.id, 'title':self.title, 'description':self.description,
     'priority':self.priority, 'target_date':self.target_date, 'client_id':self.client_id,
     'product_area_id':self.product_area_id})

with app.app_context():
    loading = True
    wait_time = 0
    try:
        while loading or wait_time > 60:
            try:
                db.create_all()
                db.session.commit()
                loading=False
            except Exception:
                time.sleep(5)
                wait_time = wait_time + 5
    except Exception:
        raise Exception('Error creating the database')

@auth.verify_token
def verify_token(token):
    g.user = None
    try:
        data = jwt.loads(token)
    except:
        return False
    if 'user' in data:
        g.user = data['user']
        return True
    return False

register_fields = {
    'fullname': fields.String,
    'email': fields.String,
    'password': fields.Boolean,
}
class RegisterAPI(Resource):
    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        self.reqparse.add_argument('fullname', type=str, required=True,
                                    help='Full name not provided',
                                    location='json')
        self.reqparse.add_argument('fullname', type=fullname_length,
                                    location='json')
        self.reqparse.add_argument('email', type=str, required=True,
                                    help='Email is required', location='json')
        self.reqparse.add_argument('password', type=password_length,
                                    location='json')
        self.reqparse.add_argument('email', type=validate_email, location='json')
        self.reqparse.add_argument('email', type=validate_non_social, location='json')
        super(RegisterAPI, self).__init__()

    def post(self):
        args = self.reqparse.parse_args()
        fullname = args['fullname']
        email = args['email']
        password = args['password']

        unique_social_id = False
        social_id = 'non_social' + str(int(random.random()*1000000000))
        while unique_social_id is False:
            user = User.query.filter_by(social_id=social_id).first()
            if user is not None:
                social_id = 'non_social' + str(random.random()*random.random()*1000)
            else:
                unique_social_id = True

        user = User(social_id=social_id, fullname=fullname, email=email)
        user.hash_password(password)
        db.session.add(user)
        db.session.commit()

        formatted_user = make_jsonifiable(User, user)

        token = jwt.dumps({'user': formatted_user})

        return {'auth_token': token}, 201

def validate_non_social(value):
    user = User.query.filter_by(email=value).first()
    if user is None:
        raise ValueError('User does not exist for this email!')
    if user and "non_social" not in user.social_id:
        raise ValueError('Social User already created. Log in with Google')
    if not user.verify_password(password):
        raise ValueError('Invalid email or password')

register_fields = {
    'email': fields.String,
    'password': fields.Boolean,
}
class LoginAPI(Resource):
    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        self.reqparse.add_argument('email', type=str, required=True,
                                    help='Email is required', location='json')
        self.reqparse.add_argument('password', type=password_length,
                                    location='json')
        self.reqparse.add_argument('email', type=validate_email, location='json')
        self.reqparse.add_argument('email', type=validate_non_social, location='json')
        super(RegisterAPI, self).__init__()

    def get(self):
        args = self.reqparse.parse_args()
        email = args['email']
        password = args['password']

        user = User.query.filter_by(email=email).first()
        g.user = user
        formatted_user = make_jsonifiable(User, user)

        token = jwt.dumps({'user': formatted_user})
        return {'token': token}


class UserAPI(Resource):
    def get(self, id):
        pass

    def put(self, id):
        pass

    def delete(self, id):
        pass

register_fields = {
    'fullname': fields.String,
    'email': fields.String,
    'social_id': fields.String,
}
class GoogleLogin(Resource):
    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        self.reqparse.add_argument('fullname', type=str, required=True,
                                    help='Full name not provided',
                                    location='json')
        self.reqparse.add_argument('social_id', type=str,
                                    location='json')
        self.reqparse.add_argument('email', type=str, required=True,
                                    help='Email is required', location='json')
        self.reqparse.add_argument('email', type=validate_email, location='json')
        super(GoogleLogin, self).__init__()

    def post(self):
        args = self.reqparse.parse_args()
        fullname = args['fullname']
        email = args['email']
        social_id = args['social_id']
        user = User.query.filter_by(social_id=social_id).first()
        if not user:
            user = User(social_id=social_id, fullname=fullname, email=email)
            db.session.add(user)
            db.session.commit()

        formatted_user = make_jsonifiable(User, user)
        token = jwt.dumps({'user': formatted_user})

        return {'token': token, 'user': formatted_user}

api = Api(app)
api.add_resource(UserAPI, '/users/<int:id>', endpoint='user')
api.add_resource(RegisterAPI, '/register', endpoint='register')
api.add_resource(LoginAPI, '/login', endpoint='login')
api.add_resource(GoogleLogin, '/login/google', endpoint='google_login')

if __name__ == "__main__":
    app.secret_key = app.config['SECRET_KEY']
    app.config['SESSION_TYPE'] = 'filesystem'
    app.run(host="0.0.0.0", port=80)
