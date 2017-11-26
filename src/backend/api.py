from flask import Flask, g
from flask_restful import Api, Resource, reqparse, fields, abort
from flask_sqlalchemy import SQLAlchemy
import time, datetime, random, string, json, re
from passlib.apps import custom_app_context as pwd_context
from model_helpers import make_jsonifiable, update_model, format_features
from models import User, ProductArea, Client, FeatureRequest, InvalidatedAuthTokens
from backend import auth, app, jwt, db
from request_parsers import set_feature_reqparse, set_register_reqparse,\
set_login_reqparse, set_google_reqparse, set_client_reqparse,\
set_product_area_reqparse, set_logout_reqparse

@auth.verify_token
def verify_token(token):
    g.user = None
    invalidToken = InvalidatedAuthTokens.query.filter_by(invalid_token=token).first()
    if invalidToken is not None:
        return False
    try:
        data = jwt.loads(token)
    except:
        abort(401, authorized=False)
    if 'user' in data:
        social_id = data['user']
        g.user = User.query.filter_by(social_id=social_id).first()
        return True
    abort(401, authorized=False)

class RegisterAPI(Resource):
    def __init__(self):
        set_register_reqparse(self)
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

        token = jwt.dumps({'user':user.social_id})
        return {'token': token}, 201

class LoginAPI(Resource):
    def __init__(self):
        set_login_reqparse(self)
        super(LoginAPI, self).__init__()

    def post(self):
        args = self.reqparse.parse_args()
        email = args['email']
        password = args['password']

        user = User.query.filter_by(email=email).first()
        if not user.verify_password(password):
            return {'message': {'login_error': 'Invalid email or password'}}, 400

        token = jwt.dumps({'user':user.social_id})
        return {'token': token, 'username': user.fullname}

class GoogleLogin(Resource):
    def __init__(self):
        set_google_reqparse(self)
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

        token = jwt.dumps({'user':user.social_id})
        return {'token': token}

class VerifyAuthAPI(Resource):
    @auth.login_required
    def get(self):
        return {'authorized': True}

class FeatureRequestAPI(Resource):
    def __init__(self):
        set_feature_reqparse(self)
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
            FeatureRequest.priority).filter(FeatureRequest.id != feature_id).all()
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

        try:
            FeatureRequest.reorder_features(features_to_reorder)
        except Exception:
            return {'message': {'error': 'Unable to update feature request at this time'}}, 400

        if features_to_reorder is not None:
            db.session.commit()

        try:
            feature = FeatureRequest(title=args['title'],description=args['description'],
                client_id=args['client'], product_area_id=args['product_area'],
                target_date=args['target_date'],priority=args['priority'],
                user_id=g.user.id)
            db.session.add(feature)
            db.session.commit()
            return {'message': 'created'}
        except Exception:
            return {'message': {'error': 'Error saving Feature'}}, 400

    @auth.login_required
    def put(self, feature_id):
        args = self.reqparse.parse_args()
        features_to_reorder = json.loads(args['submitted_feature_list'])
        try:
            FeatureRequest.reorder_features(features_to_reorder)
        except Exception:
            return {'message': {'error': 'Error updating client features'}}, 400
        if features_to_reorder is not None:
            db.session.commit()

        update_feature = FeatureRequest.query.filter_by(id=feature_id).first()
        try:
            update_feature.priority = args['priority']
            db.session.add(update_feature)
            db.session.commit()
            return {'message': 'updated'}
        except Exception:
            return {'message': {'error': 'Error saving Feature'}}, 400

    @auth.login_required
    def delete(self, feature_id):
        feature = FeatureRequest.query.filter_by(id=feature_id).first()
        if feature is None:
            return {'message' :{'error':'Feature does not exist'}}, 400

        try:
            FeatureRequest.query.filter_by(id=feature_id).delete()
            db.session.commit()
            return {'success': 'Feature deleted'}
        except Exception:
            return {'message': {'error': 'Unable to delete feature at this time'}}, 400

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
            return {'message': {'error': 'Server error'}}, 400

class ClientAPI(Resource):
    def __init__(self):
        set_client_reqparse(self)
        super(ClientAPI, self).__init__()

    @auth.login_required
    def post(self):
        args = self.reqparse.parse_args()
        try:
            client = Client(
                name=args['name']
            )
            db.session.add(client)
            db.session.commit()
            return {'message': 'Success'}
        except Exception:
            return {'message': {'error': 'Unable to save client at this time'}}, 400

class ProductAreaAPI(Resource):
    def __init__(self):
        set_product_area_reqparse(self)
        super(ProductAreaAPI, self).__init__()

    @auth.login_required
    def post(self):
        args = self.reqparse.parse_args()
        try:
            product_area = ProductArea(
                name=args['name'],
                description=args['description']
            )
            db.session.add(product_area)
            db.session.commit()
            return {'message': 'Success'}
        except Exception:
            return {'message': {'error':'Unable to save product area at this time'}}, 400

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

class LogoutAPI(Resource):
    def __init__(self):
        set_logout_reqparse(self)
        super(LogoutAPI, self).__init__()

    @auth.login_required
    def get(self):
        args = self.reqparse.parse_args()
        try:
            token = re.sub('Bearer ', '', args['Authorization'])
            invalid_token = InvalidatedAuthTokens(invalid_token=token)
            db.session.add(invalid_token)
            db.session.commit()
            return {'success': 'logged out'}
        except Exception:
            return {'message': {'error': 'Unable to invalidate User token'}}, 400

api = Api(app)
api.add_resource(RegisterAPI, '/register', endpoint='register')
api.add_resource(VerifyAuthAPI, '/auth/verify', endpoint='auth')
api.add_resource(LoginAPI, '/login', endpoint='login')
api.add_resource(GoogleLogin, '/login/google', endpoint='google_login')
api.add_resource(RetrieveFeatures, '/', endpoint='home')
api.add_resource(RetrieveFeatureInfo, '/feature-priorities', endpoint='feature_priority')
api.add_resource(FeatureRequestAPI, '/feature', endpoint='feature')
api.add_resource(FeatureRequestAPI, '/feature/<string:feature_id>')
api.add_resource(ClientAPI, '/client', endpoint='client')
api.add_resource(ProductAreaAPI, '/product_area', endpoint='product_area')
api.add_resource(LogoutAPI, '/logout');
