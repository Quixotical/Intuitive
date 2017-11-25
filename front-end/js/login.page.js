import api from './api';
import makeToast from './toast_maker';

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

      api.post('/login', {
        email: formFields.email(),
        password: formFields.password(),
      })
        .then((resp)=> {
          window.localStorage.setItem('token', resp.data.token)
          window.localStorage.setItem('intuitiveName', resp.data.username);
          window.localStorage.setItem('intuitiveLogout', 'Logout');
          page('/');
        })
        .catch(({ response }) => {
          for(let errorKey in response.data.message){
            makeToast(`${response.data.message[errorKey]}! `)
          }
        });
    }
  }
  ko.applyBindings(viewModel, container);

  viewModel.dynamicallyLoadScript();
}
