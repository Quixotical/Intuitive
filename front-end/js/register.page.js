import api from './api';

export default (container) => {
  var viewModel = {
    fullname: ko.observable(),
    email: ko.observable(),
    password: ko.observable(),
    onSubmit (formFields) {
      api.post('/register', {
        fullname: formFields.fullname(),
        email: formFields.email(),
        password: formFields.password(),
      })
        .then((resp)=> {
          window.sessionStorage.setItem('token', resp.data.auth_token)
        })
        .catch(({ response }) => {
          //TODO display error messages
          console.warn('Error registering user', response.data.message)
        });

      console.warn('ayy')
    }
  };
  ko.applyBindings(viewModel, container);
}
