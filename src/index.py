import os
from flask import Flask, jsonify, Markup, render_template, redirect, url_for
from model_helpers import make_jsonifiable, update_model
from flask_login import LoginManager, UserMixin, login_user, logout_user,\
    current_user
from flask_sqlalchemy import SQLAlchemy
from oauth2 import OAuthSignIn
import config
import time
import datetime

app = Flask(__name__)

# Configure MySQL connection.
db = SQLAlchemy()

lm = LoginManager(app)
lm.login_view = 'login'

app.config['SQLALCHEMY_DATABASE_URI'] = config.SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = config.SQLALCHEMY_TRACK_MODIFICATIONS

with app.app_context():
    db.init_app(app)

class User(UserMixin, db.Model):
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

@lm.user_loader
def load_user(id):
    return User.query.get(int(id))

@app.route("/login")
def login():
    return render_template('login.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/')
@app.route('/index')
def index():
    if current_user.is_anonymous:
        return render_template('login.html')
    return render_template('index.html')

@app.route('/auth/google/<user_data>')
def google_signin(user_data):
    if not current_user.is_anonymous:
        return redirect(url_for('index'))


@app.route('/auth/<provider>')
def oauth_authorize(provider):
    if not current_user.is_anonymous:
        return redirect(url_for('index'))
    oauth = OAuthSignIn.get_provider(provider)
    return oauth.authorize()

@app.route('/callback/<provider>')
def oauth_callback(provider):
    if not current_user.is_anonymous:
        return redirect(url_for('login'))
    oauth = OAuthSignIn.get_provider(provider)
    social_id, username, email = oauth.callback()
    if social_id is None:
        return redirect(url_for('login'))
    user = User.query.filter_by(social_id=social_id).first()
    if not user:
        user = User(social_id=social_id, nickname=username, email=email)
        db.session.add(user)
        db.session.commit()
    login_user(user, True)

    return redirect(url_for('index'))

if __name__ == "__main__":
    app.secret_key = 'super secret key'
    app.config['SESSION_TYPE'] = 'filesystem'
    app.run(host="0.0.0.0", port=80)
