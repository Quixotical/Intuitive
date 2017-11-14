import os
from flask import Flask
from flask import Markup
from flask import render_template
from flask_sqlalchemy import SQLAlchemy

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

class ProductLine(db.Model):
    __tablename__ = 'product_lines'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(64), nullable=False, unique=True)
    description = db.Column(db.String(64), nullable=True, unique=False)

    def __repr__(self):
        return str({'id':self.id, 'name':self.name, 'description':self.description})


with app.app_context():
    db.create_all()
    db.session.commit()


@app.route("/login")
def login():
    return render_template("login.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
