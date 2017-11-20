(function () {
'use strict';

var api = axios.create({
  baseURL: 'http://localhost:7777/'
});

var registerPage = (container) => {
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
          window.sessionStorage.token = resp.auth_token;
        })
        .catch(({ response }) => {
          //TODO display error messages
          console.warn('Error registering user', response.data.message);
        });

      console.warn('ayy');
    }
  };
  ko.applyBindings(viewModel, container);
};

var loginPage = (container) => {
  var viewModel = {
    dynamicallyLoadScript() {
      console.log('woo');
      var script = document.createElement("script");
      script.src = "https://apis.google.com/js/platform.js";

      document.head.appendChild(script);
    },
  };
  viewModel.dynamicallyLoadScript();
};

const renderContent = (templateName, callback) => {
  fetch(`/templates/${templateName}.html`)
		.then(response => response.text())
		.then( html => {
      const div = document.createElement('div');
      div.id = 'container';
      document.querySelector('#container').replaceWith(div);
	    div.innerHTML = html;
	    callback && callback(div);
	  });
};

page('/', function(){
  console.log('wows');
});

page('/feature', function(){
  renderContent('feature');
});

page('/register', function(){
  renderContent('register', registerPage);
});

page('/login', function(){
  renderContent('login', loginPage);
});
page(() => {
  console.warn('oops');
  page('/');
});

window.test = function() {
  return 'pants'
};

window.onSignIn = function(googleUser) {

  var profile = googleUser.getBasicProfile();
  console.log("ID: " + profile.getId());
  console.log('Full Name: ' + profile.getName());
  console.log('Given Name: ' + profile.getGivenName());
  console.log('Family Name: ' + profile.getFamilyName());
  console.log("Image URL: " + profile.getImageUrl());
  console.log("Email: " + profile.getEmail());

  var fullname = profile.getName();
  var email = profile.getEmail();
  var social_id = 'gogole'+profile.getId();

  var data = {
    'fullname': fullname,
    'email': email,
    'social_id': social_id,
  };
  var xml = new XMLHttpRequest();
  xml.open("POST", "http://localhost:7777/login/google", true);
  xml.setRequestHeader("Content-Type", "application/json");
  xml.onreadystatechange = function(){
    if(xml.readyState == XMLHttpRequest.DONE){
      if (xml.status === 200) {
        var response = JSON.parse(xml.responseText);
        console.log(response);
        console.log('woooo');
      }else{
        console.warn('oopsie daisie');
      }
    }
  };
  xml.send(JSON.stringify(data));
};
//   api.post('login/google', {
//     'fullname': profile.getName(),
//     'email': profile.getEmail(),
//     'social_id': 'google'+profile.getId()
//   })
//   .then((data) => {
//       console.log('wooo');
//       console.log(data);
//   })
//   .catch((error) => {
//     console.warn('error', error)
//   })
// }

function ready(callback) {
  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
    callback();
    test();
  } else {
    document.addEventListener('DOMContentLoaded', () => callback());
  }
}

ready(page);

}());
