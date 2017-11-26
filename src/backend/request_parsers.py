from flask_restful import reqparse
from field_validators import password_length, fullname_length, validate_email,\
validate_non_social, validate_new_email

def set_feature_reqparse(self):
    self.reqparse = reqparse.RequestParser()
    self.reqparse.add_argument('title', type=str, required=True,
                                help='Title not provided',
                                location='json')
    self.reqparse.add_argument('description', type=str, required=True,
                                location='json', help='Description required')
    self.reqparse.add_argument('client', type=str, required=True,
                                help='Client required', location='json')
    self.reqparse.add_argument('product_area', type=str, location='json',
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

def set_register_reqparse(self):
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

def set_login_reqparse(self):
    self.reqparse = reqparse.RequestParser()
    self.reqparse.add_argument('email', type=str, required=True,
                                help='Email is required', location='json')
    self.reqparse.add_argument('password', type=str,
                                location='json', required=True,
                                help="Password is required")
    self.reqparse.add_argument('password', type=password_length,
                                location='json', required=True)
    self.reqparse.add_argument('email', type=validate_email, location='json',
                                        help="Invalid email format")
    self.reqparse.add_argument('email', type=validate_non_social, location='json')

def set_google_reqparse(self):
    self.reqparse = reqparse.RequestParser()
    self.reqparse.add_argument('fullname', type=str, required=True,
                                help='Full name not provided',
                                location='json')
    self.reqparse.add_argument('social_id', type=str,
                                location='json')
    self.reqparse.add_argument('email', type=str, required=True,
                                help='Email is required', location='json')
    self.reqparse.add_argument('email', type=validate_email, location='json')

def set_client_reqparse(self):
    self.reqparse = reqparse.RequestParser()
    self.reqparse.add_argument('name', type=str, required=True,
                                help='Name not provided',
                                location='json')

def set_product_area_reqparse(self):
    self.reqparse = reqparse.RequestParser()
    self.reqparse.add_argument('name', type=str, required=True,
                                help='Name not provided',
                                location='json')
    self.reqparse.add_argument('description', type=str, required=True,
                                help='Description not provided',
                                location='json')

def set_logout_reqparse(self):
    self.reqparse = reqparse.RequestParser()
    self.reqparse.add_argument('Authorization',
                        location='headers')
