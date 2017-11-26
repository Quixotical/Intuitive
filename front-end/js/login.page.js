import api from './api';
import makeToast from './toast_maker';
import Validator from './validator';
import errorHandler from './error_handler';

export default (container) => {
  var viewModel = {

    dynamicallyLoadScript() {
      let oldScript = window.document.getElementById('dynamic-google');
      if(oldScript){
        oldScript.parentNode.removeChild(oldScript);
      }
      let googleDiv = window.document.getElementById('google-button');
      let googleButton = '<div class="g-signin2" data-onsuccess="onSignIn" data-theme="dark"></div>'
      googleDiv.innerHTML = googleButton;

      var script = document.createElement("script");
      script.id = 'dynamic-google';
      script.src = "https://apis.google.com/js/platform.js?onload=onLoadCallback"


      document.head.appendChild(script);
    },

    email: ko.observable(),
    password: ko.observable(),

    onRegisterClick(e){
      page('/register');
    },

    onSubmit (formFields) {

      let data = {
        email: formFields.email(),
        password: formFields.password(),
      }

      let inputValidator = new Validator(data, data, {password:8});
      inputValidator.validate();
      if(inputValidator.error){
        makeToast(`${inputValidator.error}`);
        return;
      }

      api.post('/login', data)
        .then((resp)=> {
          window.localStorage.setItem('token', resp.data.token)
          window.localStorage.setItem('intuitiveName', resp.data.username);
          window.localStorage.setItem('intuitiveLogout', 'Logout');
          page('/');
        })
        .catch(errorHandler);
    }
  }
  ko.applyBindings(viewModel, container);

  viewModel.dynamicallyLoadScript();
}
