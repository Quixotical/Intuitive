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
          window.localStorage.setItem('token', resp.data.token);
          page('/');
        })
        .catch(({ response }) => {
          //TODO display error messages
          console.warn('Error registering user', response.data.message);
        });
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
          window.localStorage.setItem('token', resp.data.token);
          page('/');
        })
        .catch(({ response }) => {
          //TODO display error messages
          console.warn('Error registering user', response.data.message);
        });
    }
  };
  ko.applyBindings(viewModel, container);
  viewModel.dynamicallyLoadScript();
};

var featurePage = (container) => {
  var viewModel = {
    targetDate:ko.observable(moment().format('YYYY-MM-DD')),
    title: ko.observable(),
    priority: ko.observable(),
    clients: ko.observableArray([
      {id: 1, clientName: "Client A"},
      {id: 2, clientName: "Client B"},
      {id: 3, clientName: "Client C"}
    ]),
    productAreas: ko.observableArray([
      {id: 1, productArea:"Policies"},
      {id: 2, productArea:"Billing"},
      {id: 3, productArea:"Claims"},
      {id: 4, productArea:"Reports"},
    ]),
    description: ko.observable(),
    selectedClient: ko.observable(),
    selectedProductArea: ko.observable(),

    getFormattedDate (){
      return moment(this.targetDate()).format('MM/DD/YYYY');
    },

    onSubmit (formFields) {
      console.log(formFields.targetDate());

      let data = {
        title: formFields.title(),
        description: formFields.description(),
        priority: formFields.priority(),
        target_date: formFields.targetDate(),
        client_id: formFields.selectedClient(),
        product_area_id: formFields.selectedProductArea(),
      };

      api({
        method: 'POST',
        url: '/feature',
        data: data,
        headers: {
          Authorization: 'Bearer '+ window.localStorage.token
        }
      })
        .then((resp)=> {
          console.log(resp);
          // page('/');
        })
        .catch(({ response }) => {
          //TODO display error messages
          console.warn('Error registering user', response.data.message);
        });
    }
  };

  var retrieve = function() {
    api.get('/feature-priorities', {headers:{Authorization: 'Bearer '+ window.localStorage.token}})
      .then((resp)=> {
        console.log(resp);
        // let features = resp.data.features;
        // for (let feature of features) {
        //   feature.target_date = moment(feature.target_date).format('MM/DD/YYYY')
        // }
        // viewModel.features(resp.data.features);
        // viewModel.userFeatures(resp.data.user_features);

      })
      .catch(({ response }) => {
        console.log(response);
        console.warn('Error adding client', response.data.message);
      });
  };
  retrieve();
  ko.applyBindings(viewModel, container);
};

var clientPage = (container) => {

  var viewModel = {
    name: ko.observable(),

    onSubmit (formFields) {

      let data = {
        name: formFields.name()
      };

      api({
        method: 'POST',
        url: '/client',
        data: data,
        headers: {
          Authorization: 'Bearer '+ window.localStorage.token
        }
      })
        .then((resp)=> {
          console.log('woooo');
          page('/');
        })
        .catch(({ response }) => {
          //TODO display error messages
          console.warn('Error adding client', response.data.message);
        });
    }
  };
  ko.applyBindings(viewModel, container);
};

var productAreaPage = (container) => {

  var viewModel = {
    name: ko.observable(),
    description: ko.observable(),

    onSubmit (formFields) {

      let data = {
        name: formFields.name(),
        description: formFields.description(),
      };

      api({
        method: 'POST',
        url: '/product_area',
        data: data,
        headers: {
          Authorization: 'Bearer '+ window.localStorage.token
        }
      })
        .then((resp)=> {
          page('/');
        })
        .catch(({ response }) => {
          //TODO display error messages
          console.warn('Error adding client', response.data.message);
        });
    }
  };
  ko.applyBindings(viewModel, container);
};

var homePage = (container) => {
  var viewModel = {
    features: ko.observableArray(),
    userFeatures: ko.observableArray(),
    loading: ko.observable('Loading')
  };

  var retrieve = function() {
    api.get('/', {headers:{Authorization: 'Bearer '+ window.localStorage.token}})
      .then((resp)=> {
        console.log(resp);
        let features = resp.data.features;
        for (let feature of features) {
          feature.target_date = moment(feature.target_date).format('MM/DD/YYYY');
        }
        viewModel.features(resp.data.features);
        viewModel.userFeatures(resp.data.user_features);

      })
      .catch(({ response }) => {
        console.log(response);
        console.warn('Error adding client', response.data.message);
      });
  };
  retrieve();
  ko.applyBindings(viewModel, container);
};

const verifyUser = (ctx, next) => {
  const token = window.localStorage.token;
  const headers = { 'Authorization': `Bearer ${token}` };
  const PORT = 7777;

  fetch(`${'http://'}${location.host}:${PORT}` + '/auth/verify', { headers })
    .then(r => r.json())
    .then((result) => {
      ctx.authorized = result.authorized;
      next();
    })
    .catch((error) => {
      ctx.authorized = false;
      next();
    });
};

const fetchPage = (templateName, callback) => {
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

let renderContent = (templateName, callback, ctx, next) => {
  if(ctx.authorized){
    page('/');
  }else{
    fetchPage(templateName, callback);
  }
};

let renderAuthContent = (templateName, callback, ctx, next) => {
  if(ctx.authorized){
    fetchPage(templateName, callback);
  }else{
    page('/login');
  }
};

page('/index', verifyUser, renderAuthContent.bind(null,'home', homePage));

page('/', verifyUser, renderAuthContent.bind(window,'home', homePage));

page('/feature', verifyUser, renderAuthContent.bind(window,'feature', featurePage));
page('/feature/:id', verifyUser, renderAuthContent.bind(window, 'feature', featurePage));

page('/client', verifyUser, renderAuthContent.bind(window, 'client', clientPage));

page('/product_area', verifyUser, renderAuthContent.bind(window, 'product_area', productAreaPage));
page('/register', renderContent.bind(window, 'register', registerPage));

page('/login', verifyUser, renderContent.bind(window, 'login', loginPage));

page('*', function(){
  page('/login');
});

window.onSignIn = function(googleUser) {

  var profile = googleUser.getBasicProfile();
  var data = {
    'fullname': profile.getName(),
    'email': profile.getEmail(),
    'social_id': 'gogole'+profile.getId(),
  };
  var xml = new XMLHttpRequest();
  xml.open("POST", "http://localhost:7777/login/google", true);
  xml.setRequestHeader("Content-Type", "application/json");
  xml.onreadystatechange = function(){
    if(xml.readyState == XMLHttpRequest.DONE){
      if (xml.status === 200) {
        var response = JSON.parse(xml.responseText);
        window.localStorage.setItem('token', response.token);
        page('/');
      }else{
        console.warn('oopsie daisie');
      }
    }
  };
  xml.send(JSON.stringify(data));
};

function ready(callback) {
  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', () => callback());
  }
}

ready(page);

}());
