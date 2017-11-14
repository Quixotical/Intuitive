import os
from flask import Flask
from flask import Markup
from flask import render_template
from flask_sqlalchemy import SQLAlchemy
import random

app = Flask(__name__)

# Configure MySQL connection.
db = SQLAlchemy()

db_uri = 'mysql://root:supersecure@db/feature_db'
app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

with app.app_context():
    db.init_app(app)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
