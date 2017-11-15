import os
from flask import Flask, jsonify
from flask import Markup
from model_helpers import make_jsonifiable, update_model
from flask import render_template
from flask_sqlalchemy import SQLAlchemy
import time
import datetime

app = Flask(__name__)

# Configure MySQL connection.
db = SQLAlchemy()

db_uri = 'mysql://root:supersecure@db/feature_db'
app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

with app.app_context():
    db.init_app(app)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    social_id = db.Column(db.String(64), nullable=False, unique=True)
    nickname = db.Column(db.String(64), nullable=False)
    email = db.Column(db.String(64), nullable=False)

    def __repr__(self):
        return str({'id':self.id, 'social_id':self.social_id, 'nickname':self.nickname, 'email':self.email})

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
    while loading or wait_time > 60:
        try:
            db.create_all()
            db.session.commit()
            loading=False
        except Exception:
            time.sleep(5)
            wait_time = wait_time + 5

@app.route("/login")
def login():
    return jsonify({'receiving':'Hello'})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
