import api from './api';
import Validator from './validator';
import makeToast from './toast_maker';
import errorHandler from './error_handler';

export default (container) => {

  var viewModel = {
    fullname: ko.observable(),
    email: ko.observable(),
    password: ko.observable(),

    onSubmit (formFields) {
      let data = {
        fullname: formFields.fullname(),
        email: formFields.email(),
        password: formFields.password(),
      }

      let inputValidator = new Validator(data, data, {password:8, fullname: 6});
      inputValidator.validate();
      if(inputValidator.error){
        makeToast(`${inputValidator.error}`);
        return;
      }

      api.post('/register', {
        fullname: formFields.fullname(),
        email: formFields.email(),
        password: formFields.password(),
      })
        .then((resp)=> {
          window.localStorage.setItem('token', resp.data.token)
          window.localStorage.setItem('intuitiveName', formFields.fullname())
          window.localStorage.setItem('intuitiveLogout', 'Logout')
          page('/');
        })
        .catch(errorHandler)
      }
    }

  ko.applyBindings(viewModel, container);
}
