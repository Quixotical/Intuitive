import re
from models import User

def password_length(value):
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters")

    return value

def fullname_length(value):
    if len(value) < 5:
        raise ValueError("Full Name must be at least 5 characters")

    return value

def validate_email(value):
    if not re.match(r"[^@]+@[^@]+\.[^@]+", value):
        raise ValueError("Email must be in 'example@domain.value' and you gave us the value {}".format(value))

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
        raise ValueError('User already exist for this email')
    return value
