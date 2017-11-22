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
          window.localStorage.setItem('token', resp.data.token)
          page('/');
        })
        .catch(({ response }) => {
          //TODO display error messages
          console.warn('Error registering user', response.data.message)
        });
    }
  };
  ko.applyBindings(viewModel, container);
}
