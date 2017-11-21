import '../css/style.css';

import registerPage from './register.page'
import loginPage from './login.page'

const verifyUser = (ctx, next) => {
  let token = window.sessionStorage.token

  let authPromise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:7777/auth/verify", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.onload = () => {
      if(xhr.status > 299){
        resolve(false);
      }
      resolve(true);
    };
    xhr.onerror = () => {console.log('lock out');reject(xhr.statusText);}
    xhr.send();
  });

  authPromise
    .then((authorized) => {
      ctx.authorized = authorized;
      next();
    })
    .catch((error) => {
      console.error('error verifying user', error)
      ctx.authorized = false;
      next();
    });
}

const fetchPage = (templateName, callback) => {
  fetch(`/templates/${templateName}.html`)
    .then(response => response.text())
    .then( html => {
      const div = document.createElement('div')
      div.id = 'container'
      document.querySelector('#container').replaceWith(div);
      div.innerHTML = html;
      callback && callback(div)
  })
}

let renderContent = (templateName, callback) => {
    fetchPage(templateName, callback);
}

let renderAuthContent = (templateName, callback, ctx, next) => {
  if(ctx.authorized){
    fetchPage(templateName, callback)
  }else{
    page('/login');
  }
}

page('home', function(){
  renderContent('home', null, credentials)
});

page('/index', verifyUser, renderAuthContent.bind(window,'feature', null));

page('/', verifyUser, renderAuthContent.bind(window,'feature', null));

page('/feature', function(){
  renderContent('feature')
});

page('/register', function(){
  renderContent('register', registerPage)
});

page('/login', function(){
  renderContent('login', loginPage)
});

page('*', function(){
  page('/login')
});

window.onSignIn = function(googleUser) {

  var profile = googleUser.getBasicProfile();
  var data = {
    'fullname': profile.getName(),
    'email': profile.getEmail(),
    'social_id': 'gogole'+profile.getId(),
  }
  var xml = new XMLHttpRequest();
  xml.open("POST", "http://localhost:7777/login/google", true);
  xml.setRequestHeader("Content-Type", "application/json");
  xml.onreadystatechange = function(){
    if(xml.readyState == XMLHttpRequest.DONE){
      if (xml.status === 200) {
        var response = JSON.parse(xml.responseText);
        window.sessionStorage.setItem('token', response.token);
        console.log(response);
        console.log('woooo');
      }else{
        console.warn('oopsie daisie');
      }
    }
  }
  xml.send(JSON.stringify(data));
}

function ready(callback) {
  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', () => callback());
  }
}

ready(page)
