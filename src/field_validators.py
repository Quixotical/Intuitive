import re

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
