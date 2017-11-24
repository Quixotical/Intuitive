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
          var options = {
            style: {
              main: {
                background: "#5bc0de",
                color: "black"
              }
            }
          };
          iqwerty.toast.Toast(`Error registering new user!`, options)
        });
    }
  };
  ko.applyBindings(viewModel, container);
}
