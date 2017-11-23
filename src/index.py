import os
from flask import Flask, g
from flask_restful import Api, Resource, reqparse, fields, marshal, abort
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_utils import PasswordType, force_auto_coercion
from flask_cors import CORS
import config
import time, datetime, random, string, json
from itsdangerous import TimedJSONWebSignatureSerializer as JWT
from flask_httpauth import HTTPTokenAuth
from passlib.apps import custom_app_context as pwd_context

from model_helpers import make_jsonifiable, update_model, format_features
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
    user_features = db.relationship('FeatureRequest', backref='user_features', lazy='dynamic')

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
        return str({'id':self.id, 'name':self.name, 'description':self.description})

class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(64), nullable=False)
    client_features = db.relationship('FeatureRequest', backref='client_features', lazy='dynamic')

    def __repr__(self):
        return str({'id':self.id, 'name':self.name})

class FeatureRequest(db.Model):
    __tablename__ = 'feature_requests'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(128))
    description = db.Column(db.String(255))
    priority = db.Column(db.Integer)
    target_date = db.Column(db.DateTime)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'))
    product_area_id = db.Column(db.Integer, db.ForeignKey('product_areas.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

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
        abort(401, authorized=False)
    if 'user' in data:
        social_id = data['user']
        g.user = User.query.filter_by(social_id=social_id).first()
        return True
    abort(401, authorized=False)

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
        self.reqparse.add_argument('email', type=validate_new_email, location='json')
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

        token = jwt.dumps({'user':user.social_id})

        return {'token': token}, 201

def validate_exists(value):
    user = User.query.filter_by(email=value).first()
    if user is None:
        raise ValueError('User does not exist for this email!')
    return value

def validate_non_social(value):
    user = User.query.filter_by(email=value).first()
    if user is None:
        raise ValueError('No user exists for email')
    if user and "non_social" not in user.social_id:
        raise ValueError('Social User already created. Log in with Google')
    return value

def validate_new_email(value):
    user = User.query.filter_by(email=value).first()
    if user is not None:
        raise ValueError('User already exist for this email!')
    return value

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
        self.reqparse.add_argument('email', type=validate_exists, location='json')
        self.reqparse.add_argument('email', type=validate_non_social, location='json')
        super(LoginAPI, self).__init__()

    def post(self):
        args = self.reqparse.parse_args()
        email = args['email']
        password = args['password']

        user = User.query.filter_by(email=email).first()
        if not user.verify_password(password):
            return {'error':'Invalid email or password'}, 400

        g.user = user.feature_requests
        formatted_user = make_jsonifiable(User, user)

        token = jwt.dumps({'user':user.social_id})
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
        token = jwt.dumps({'user':user.social_id})

        return {'token': token}

class VerifyAuthAPI(Resource):
    @auth.login_required
    def get(self):
        return {'authorized': True}

class FeatureRequestAPI(Resource):
    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        self.reqparse.add_argument('title', type=str, required=True,
                                    help='Title not provided',
                                    location='json')
        self.reqparse.add_argument('description', type=str, required=True,
                                    location='json', help='Description required')
        self.reqparse.add_argument('client_id', type=str, required=True,
                                    help='Client required', location='json')
        self.reqparse.add_argument('product_area_id', type=str, location='json',
                                    required=True,
                                    help='Product Area required')
        self.reqparse.add_argument('target_date', type=str, required=True,
                                    help='Target Date required')
        self.reqparse.add_argument('priority', type=str,
                                    required=True,
                                    help='Must select client priority')
        self.reqparse.add_argument('submitted_feature_list', type=str,
                                    required=False,
                                    help='List of features not property formatted')
        super(FeatureRequestAPI, self).__init__()

    @auth.login_required
    def get(self, feature_id):

        clients = Client.query.all()
        formatted_clients = make_jsonifiable(Client, clients)

        product_areas = ProductArea.query.all()
        formatted_product_areas = make_jsonifiable(ProductArea, product_areas)

        client_list = {}

        for client in clients:
            client_features = client.client_features.order_by(
            FeatureRequest.priority
            ).filter(
            FeatureRequest.id != feature_id
            ).all()
            for feature in client_features:
                feature.target_date = str(feature.target_date)

            formatted_client_list = make_jsonifiable(FeatureRequest, client_features)
            client_list[client.name]= formatted_client_list

        feature = FeatureRequest.query.filter_by(id=feature_id).first()
        if feature is not None:
            feature.target_date = str(feature.target_date)
            formatted_feature = make_jsonifiable(FeatureRequest, feature)

            return {'clients_features':client_list, 'clients': formatted_clients,
                    'product_areas': formatted_product_areas, 'feature': formatted_feature}

    @auth.login_required
    def post(self):
        args = self.reqparse.parse_args()

        features_to_reorder = json.loads(args['submitted_feature_list'])

        for reorder_feature in features_to_reorder:
            feature_id = reorder_feature['id']
            updated_feature = FeatureRequest.query.filter_by(id=feature_id).first()
            updated_feature.priority = reorder_feature['priority']
            db.session.add(updated_feature)
            db.session.commit()

        try:
            feature = FeatureRequest(
                title=args['title'],
                description=args['description'],
                client_id=args['client_id'],
                product_area_id=args['product_area_id'],
                target_date=args['target_date'],
                priority=args['priority'],
                user_id=g.user.id
            )
            db.session.add(feature)
            db.session.commit()
            return {'message': 'created'}
        except Exception:
            return {'error': 'Error saving Feature'}, 400

    @auth.login_required
    def delete(self, feature_id):
        feature = FeatureRequest.query.filter_by(id=feature_id).first()
        if feature is None:
            return {'error':'Feature does not exist'}

        try:
            FeatureRequest.query.filter_by(id=feature_id).delete()
            db.session.commit()
            return {'success': 'Feature deleted'}
        except Exception:
            return {'error': 'Unable to delete feature at this time'}

class RetrieveFeatures(Resource):
    @auth.login_required
    def get(self):
        try:
            features = FeatureRequest.query.all()
            user_features = FeatureRequest.query.join(User).filter(
            FeatureRequest.user_id == g.user.id
            ).order_by(
            FeatureRequest.priority
            ).all()


            formatted_features = format_features(FeatureRequest, features)

            for feature in user_features:
                feature.target_date = str(feature.target_date)

            formatted_user_features = make_jsonifiable(FeatureRequest, user_features);

            return {'features': formatted_features, 'user_features': formatted_user_features,
                    'user_name': g.user.fullname}
        except Exception:
            return {'error': 'Server error'}, 500

class ClientAPI(Resource):
    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        self.reqparse.add_argument('name', type=str, required=True,
                                    help='Name not provided',
                                    location='json')
        super(ClientAPI, self).__init__()

    @auth.login_required
    def post(self):
        args = self.reqparse.parse_args()

        client = Client(
            name=args['name']
        )
        db.session.add(client)
        db.session.commit()

        return {'message': 'Success'}

class ProductAreaAPI(Resource):
    def __init__(self):
        self.reqparse = reqparse.RequestParser()
        self.reqparse.add_argument('name', type=str, required=True,
                                    help='Name not provided',
                                    location='json')
        self.reqparse.add_argument('description', type=str, required=True,
                                    help='Description not provided',
                                    location='json')
        super(ProductAreaAPI, self).__init__()

    @auth.login_required
    def post(self):
        args = self.reqparse.parse_args()

        product_area = ProductArea(
            name=args['name'],
            description=args['description']
        )
        db.session.add(product_area)
        db.session.commit()

        return {'message': 'Success'}

class RetrieveFeatureInfo(Resource):
    @auth.login_required
    def get(self):
        clients = Client.query.all()
        formatted_clients = make_jsonifiable(Client, clients)

        product_areas = ProductArea.query.all()
        formatted_product_areas = make_jsonifiable(ProductArea, product_areas)

        client_list = {}

        for client in clients:
            client_features = client.client_features.order_by(FeatureRequest.priority).all()

            for feature in client_features:
                feature.target_date = str(feature.target_date)

            formatted_client_list = make_jsonifiable(FeatureRequest, client_features)
            client_list[client.name]= formatted_client_list

        return {'clients_features':client_list, 'clients': formatted_clients,
                'product_areas': formatted_product_areas}

api = Api(app)
api.add_resource(UserAPI, '/users/<int:id>', endpoint='user')
api.add_resource(RegisterAPI, '/register', endpoint='register')
api.add_resource(VerifyAuthAPI, '/auth/verify', endpoint='auth')
api.add_resource(LoginAPI, '/login', endpoint='login')
api.add_resource(GoogleLogin, '/login/google', endpoint='google_login')
api.add_resource(RetrieveFeatures, '/', endpoint='home')
api.add_resource(RetrieveFeatureInfo, '/feature-priorities', endpoint='feature_priority')
api.add_resource(FeatureRequestAPI, '/feature', endpoint='feature')
api.add_resource(FeatureRequestAPI, '/feature/<feature_id>')
api.add_resource(ClientAPI, '/client', endpoint='client')
api.add_resource(ProductAreaAPI, '/product_area', endpoint='product_area')

if __name__ == "__main__":
    app.secret_key = app.config['SECRET_KEY']
    app.config['SESSION_TYPE'] = 'filesystem'
    app.run(host="0.0.0.0", port=80, threaded=True)
