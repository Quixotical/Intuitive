from backend import db
from backend import app
from passlib.apps import custom_app_context as pwd_context
import time

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

    @staticmethod
    def reorder_features(features_to_reorder=[]):
        for reorder_feature in features_to_reorder:
            reorder_id = reorder_feature['id']
            updated_feature = FeatureRequest.query.filter_by(id=reorder_id).first()
            updated_feature.priority = reorder_feature['priority']
            db.session.add(updated_feature)

    def set_feature_fields(self, user, feature_args):
        if feature_args is not None:
            self.title = feature_args['title']
            self.description = feature_args['description']
            self.client_id =feature_args['client']
            self.product_area_id = feature_args['product_area']
            self.target_date = feature_args['target_date']
            self.priority = feature_args['priority']
            self.user_id = user.id

    def __repr__(self):
        return str({'id':self.id, 'title':self.title, 'description':self.description,
     'priority':self.priority, 'target_date':self.target_date, 'client_id':self.client_id,
     'product_area_id':self.product_area_id})

class InvalidatedAuthTokens(db.Model):
    __tablename__ = 'invalid_tokens'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    invalid_token = db.Column(db.String(2000))

    def __repr__(self):
        return str({'id':self.id, 'invalid_token': self.token})

with app.app_context():
    loading = True
    wait_time = 0
    try:
        while loading or wait_time > 60:
            try:
                db.create_all()
                db.session.commit()
                loading=False
            except Exception, e:
                time.sleep(5)
                wait_time = wait_time + 5
    except Exception, e:
        raise Exception('Error creating the database PRESS ctrl + c and rerun docker-compose up' + str(e))
