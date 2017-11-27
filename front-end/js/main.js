import '../css/style.css';

import registerPage from './register.page'
import loginPage from './login.page'
import featurePage from './feature.page'
import clientPage from './client.page'
import productAreaPage from './product_area.page'
import homePage from './home.page'
import featureEditPage from './feature_edit.page';
import makeToast from './toast_maker';

const verifyUser = (ctx, next) => {
  const token = window.localStorage.token
  const headers = { 'Authorization': `Bearer ${token}` }
  const PORT = 7777

  fetch(`${'http://'}${location.host}:${PORT}` + '/auth/verify', { headers })
    .then(r => r.json())
    .then((result) => {
      console.warn({result})
      ctx.authorized = result.authorized;
      next();
    })
    .catch((error) => {
      console.error({error})
      ctx.authorized = false;
      next();
    });
}

const fetchPage = (templateName, callback, context) => {
  fetch(`/templates/${templateName}.html`)
    .then(response => response.text())
    .then( html => {
      const div = document.createElement('div')
      div.id = 'container'
      let container = document.querySelector('#container')
      container.replaceWith(div);
      div.innerHTML = html;
      callback && callback(div, context)
  })
}

let renderContent = (templateName, callback, ctx, next) => {
  if(ctx.authorized){
    viewModel.logout('Logout')
    viewModel.userName(window.localStorage.intuitiveName)
    page('/');
  }else{
    console.log(viewModel);
    viewModel.logout('');
    viewModel.userName('');
    fetchPage(templateName, callback);
  }
}

let renderAuthContent = (templateName, callback, ctx, next) => {
  if(ctx.authorized){
    viewModel.logout('Logout')
    viewModel.userName(window.localStorage.intuitiveName);
    fetchPage(templateName, callback, ctx)
  }else{
    viewModel.logout('');
    viewModel.userName('');
    page('/login');
  }
}

page('/index', verifyUser, renderAuthContent.bind(null,'home', homePage));

page('/', verifyUser, renderAuthContent.bind(window,'home', homePage));

page('/feature', verifyUser, renderAuthContent.bind(window,'feature', featurePage));
page('/feature/:id', verifyUser, renderAuthContent.bind(window, 'feature_edit', featureEditPage));

page('/client', verifyUser, renderAuthContent.bind(window, 'client', clientPage));

page('/product_area', verifyUser, renderAuthContent.bind(window, 'product_area', productAreaPage))
page('/register', renderContent.bind(window, 'register', registerPage));

page('/login', verifyUser, renderContent.bind(window, 'login', loginPage));

page('*', function(){
  page('/login')
});

window.onSignIn = function(googleUser, e) {
  var profile = googleUser.getBasicProfile();
  var data = {
    'fullname': profile.getName(),
    'email': profile.getEmail(),
    'social_id': 'gogole'+profile.getId(),
  }
  window.localStorage.setItem('googleLogin', true);
  window.localStorage.setItem('intuitiveName', profile.getName())
  window.localStorage.setItem('intuitiveLogout', 'Logout')

  var xml = new XMLHttpRequest();
  xml.open("POST", "http://localhost:7777/login/google", true);
  xml.setRequestHeader("Content-Type", "application/json");
  xml.onreadystatechange = function(){
    if(xml.readyState == XMLHttpRequest.DONE){
      if (xml.status === 200) {
        var response = JSON.parse(xml.responseText);
        window.localStorage.setItem('token', response.token);
        page('/index');
      }else{
        console.warn('oopsie daisie');
      }
    }
  }
  xml.send(JSON.stringify(data));
}

window.logout = function() {

}

var viewModel = {
  userName: ko.observable(''),
  logout: ko.observable(''),
  onAddFeature(e){
    page('/feature');
  },
  onAddClient(e){
    page('/client');
  },
  onAddProductArea(e){
    page('/product_area')
  },
  onLogoutClick () {
    const token = window.localStorage.token
    const headers = { 'Authorization': `Bearer ${token}` }
    const PORT = 7777

    fetch(`${'http://'}${location.host}:${PORT}` + '/logout', { headers })
      .then(r => r.json())
      .then((result) => {
        window.localStorage.clear()
        page('/login')
      })
      .catch((error) => {
        window.localStorage.clear()
        page('/login')
      });
  }
}

function ready(callback) {
  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
    callback();
    ko.applyBindings(viewModel, window.document.getElementById('title-container'));
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      callback(),
      ko.applyBindings(viewModel, window.document.getElementById('title-container'))
    });
  }
}

ready(page)
