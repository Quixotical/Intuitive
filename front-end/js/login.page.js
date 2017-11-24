import api from './api';
import makeToast from './toast_maker';

export default (container) => {
  var viewModel = {
    dynamicallyLoadScript() {
      console.log('woo');
      var script = document.createElement("script");
      script.src = "https://apis.google.com/js/platform.js"

      document.head.appendChild(script);
    },

    email: ko.observable(),
    password: ko.observable(),

    onRegisterClick(e){
      page('/register');
    },

    onSubmit (formFields) {

      api.post('/login', {
        email: formFields.email(),
        password: formFields.password(),
      })
        .then((resp)=> {
          window.localStorage.setItem('token', resp.data.token)
          page('/');
        })
        .catch(({ response }) => {
          makeToast(`Error logging user in!`);
        });
    }
  }
  ko.applyBindings(viewModel, container);
  viewModel.dynamicallyLoadScript();
}
