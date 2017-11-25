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
          window.localStorage.setItem('intuitiveName', formFields.fullname());
          window.localStorage.setItem('intuitiveLogout', 'Logout');
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
          iqwerty.toast.Toast(`Error registering new user!`, options);
        });
    }
  };
  ko.applyBindings(viewModel, container);
};

function makeToast (message) {
  let options = {
    style: {
      main: {
        background: "#5bc0de",
        color: "black"
      }
    }
  };
  iqwerty.toast.Toast(message, options);
}

var loginPage = (container) => {
  var viewModel = {

    dynamicallyLoadScript() {
      let oldScript = window.document.getElementById('dynamic-google');
      if(oldScript){
        oldScript.parentNode.removeChild(oldScript);
      }
      let googleDiv = window.document.getElementById('google-button');
      let googleButton = '<div class="g-signin2" data-onsuccess="onSignIn" data-theme="dark"></div>';
      googleDiv.innerHTML = googleButton;

      var script = document.createElement("script");
      script.id = 'dynamic-google';
      script.src = "https://apis.google.com/js/platform.js?onload=onLoadCallback";


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
          window.localStorage.setItem('intuitiveName', resp.data.username);
          window.localStorage.setItem('intuitiveLogout', 'Logout');
          page('/');
        })
        .catch(({ response }) => {
          for(let errorKey in response.data.message){
            makeToast(`${response.data.message[errorKey]}! `);
          }
        });
    }
  };
  ko.applyBindings(viewModel, container);

  viewModel.dynamicallyLoadScript();
};

var featurePage = (container) => {

  var viewModel = {
    submittedFeatureList: ko.observableArray(),
    clientsFeatures: ko.observableArray(),
    currentClient: ko.observable(),
    targetDate:ko.observable(moment().format('YYYY-MM-DD')),
    featureTitle: ko.observable(),
    priority: ko.observable(1),
    clients: ko.observableArray(),
    productAreas: ko.observableArray(),
    description: ko.observable(),
    selectedClient: ko.observable(),
    selectedProductArea: ko.observable(),
    clientPriorities: ko.observableArray(null),
    newFeature:ko.observableArray([{id:0, title:'New Title'}]),

    getFormattedDate (){
      return moment(this.targetDate()).format('MM/DD/YYYY');
    },

    checkPriority(knockoutFields, e) {
      let client = knockoutFields.clients().find((client) => {
        return client.id === +e.target.value
      });
      if (client){
        viewModel.clientPriorities([]);
        console.log(knockoutFields.newFeature());
        for(let key in knockoutFields.clientsFeatures()){
          key === client.name ? viewModel.clientPriorities(knockoutFields.clientsFeatures()[key]) : null;
          key === client.name ? viewModel.currentClient(key): null;
        }

        for(let [idx, feature] of viewModel.clientPriorities().entries()){
          feature.priority = idx + 2;
        }

        viewModel.submittedFeatureList(viewModel.clientPriorities());
        viewModel.newFeature([{id:0, title: ''}]);
      }else {
        viewModel.clientPriorities(null);
      }


      $(".box-container").sortable({
        revert: true,
        scroll: true,
        placeholder: "sortable-placeholder",
        stop: function(event,ui){
          let updatedFeatureList = [];
          let priorityBoxes = ui.item[0].parentNode.querySelectorAll('.priority-box');
          for(let [idx, boxObject] of priorityBoxes.entries()){
            let found = false;
            for(let feature of viewModel.clientPriorities()){

              if (feature.id === +boxObject.dataset.feature_id){
                found = true;
                feature.priority = idx + 1;
                updatedFeatureList.push(feature);
              }
            }
            if(found === false){
              viewModel.priority(idx + 1);
            }
          }

          viewModel.submittedFeatureList(updatedFeatureList);
        },
        change: function( event, ui ) {},
        update: function( event, ui ) {},

      });
    },

    onSubmit (formFields) {

      let data = {
        title: formFields.featureTitle(),
        description: formFields.description(),
        priority: formFields.priority(),
        target_date: formFields.targetDate(),
        client: formFields.selectedClient(),
        product_area: formFields.selectedProductArea(),

      };
      for (let formField in data){
        if (typeof data[formField] == 'undefined' || data[formField].length <= 0){
          makeToast(`${formField.replace(/_/, ' ').toUpperCase()} IS REQUIRED`);
          return;
        }
      }
      data['submitted_feature_list']= JSON.stringify(formFields.submittedFeatureList());
      api({
        method: 'POST',
        url: '/feature',
        data: data,
        headers: {
          Authorization: 'Bearer '+ window.localStorage.token
        }
      })
        .then((resp)=> {
          page('/');
        })
        .catch(({ response }) => {
          for(let errorKey in response.data.message){
            makeToast(`${response.data.message[errorKey]}! `);
          }
          console.warn('Error registering user', response.data.message);
        });
    }
  };

  var retrieve = function() {
    api.get('/feature-priorities', {headers:{Authorization: 'Bearer '+ window.localStorage.token}})
      .then((resp)=> {
        viewModel.clientsFeatures(resp.data.clients_features);
        viewModel.clients(resp.data.clients);
        viewModel.productAreas(resp.data.product_areas);
      })
      .catch(({ response }) => {
        makeToast(`Error retrieving feature!`);
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
      for (let formField in data){
        if (typeof data[formField] == 'undefined' || data[formField].length <= 0){
          makeToast(`${formField.replace(/_/, ' ').toUpperCase()} IS REQUIRED`);
          return;
        }
      }
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
      for (let formField in data){
        if (typeof data[formField] == 'undefined' || data[formField].length <= 0){
          iqwerty.toast.Toast(`${formField.replace(/_/, ' ').toUpperCase()} IS REQUIRED`);
          return;
        }
      }
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
          var options = {
            style: {
              main: {
                background: "#5bc0de",
                color: "black"
              }
            }
          };
          iqwerty.toast.Toast(`Error adding client!`, options);
        });
    }
  };
  ko.applyBindings(viewModel, container);
};

var homePage = (container) => {
  var viewModel = {
    features: ko.observableArray(),
    userFeatures: ko.observableArray(),
    loading: ko.observable('Loading'),
    onAddFeature(e){
      page('/feature');
    },
    onEditFeature(item, e){
      e.preventDefault();
      page('/feature/'+ item.id);
    },
    onDeleteFeature(item, e){
      e.preventDefault();
      let originalFeatureList = viewModel.features();

      let updatedFeatureList = viewModel.features().filter((feature) => {
        return feature.id !== +item.id
      });
      viewModel.features(updatedFeatureList);

      api({
        method: 'DELETE',
        url: '/feature/'+ item.id,
        headers: {
          Authorization: 'Bearer '+ window.localStorage.token
        }
      })
        .then((resp)=> {
          makeToast(`Deleted feature request: ${item.title} !`);
        })
        .catch(({ response }) => {

          viewModel.features(originalFeatureList);
          makeToast(`Error deleting feature request: ${item.title} !`);
        });
    },
  };

  var retrieve = function() {
    api.get('/', {headers:{Authorization: 'Bearer '+ window.localStorage.token}})
      .then((resp)=> {
        let features = resp.data.features;
        for (let feature of features) {
          feature.target_date = moment(feature.target_date).format('MM/DD/YYYY');
        }
        viewModel.features(resp.data.features);
        viewModel.userFeatures(resp.data.user_features);

      })
      .catch(({ response }) => {
        makeToast(`Error retrieving feature list!`);
      });
  };

  if(window.localStorage.googleLogin){
    window.localStorage.removeItem('googleLogin');
    window.location.reload();
  }else{
    retrieve();
  }

  ko.applyBindings(viewModel, container);
};

var featureEditPage = (container, context) => {

  var viewModel = {
    submittedFeatureList: ko.observableArray(),
    clientsFeatures: ko.observableArray(),
    currentClient: ko.observable(),
    targetDate:ko.observable(moment().format('YYYY-MM-DD')),
    featureTitle: ko.observable(),
    priority: ko.observable(1),
    clients: ko.observableArray(),
    productAreas: ko.observableArray(),
    description: ko.observable(),
    selectedClient: ko.observable(),
    selectedProductArea: ko.observable(),
    clientPriorities: ko.observableArray(null),
    newFeature:ko.observableArray([{id:0, title:'New Title'}]),

    getFormattedDate (){
      return moment(this.targetDate()).format('MM/DD/YYYY');
    },

    checkPriority(knockoutFields, e) {
      console.log('woo');
      console.log(knockoutFields);
      let client = getClient(knockoutFields.clients(), e.target.value);

      if (client){
        setPriorityBoxes(knockoutFields, client);

      }else {
        viewModel.clientPriorities(null);
      }


      $(".box-container").sortable({
        revert: true,
        scroll: true,
        placeholder: "sortable-placeholder",
        stop: function(event,ui){
          let updatedFeatureList = [];
          let priorityBoxes = ui.item[0].parentNode.querySelectorAll('.priority-box');
          for(let [idx, boxObject] of priorityBoxes.entries()){
            let found = false;
            for(let feature of viewModel.clientPriorities()){

              if (feature.id === +boxObject.dataset.feature_id){
                found = true;
                feature.priority = idx + 1;
                updatedFeatureList.push(feature);
              }
            }
            if(found === false){
              viewModel.priority(idx + 1);
            }
          }

          viewModel.submittedFeatureList(updatedFeatureList);
        },
      });
    },

    onSubmit (formFields) {

      let data = {
        title: formFields.featureTitle(),
        description: formFields.description(),
        priority: formFields.priority(),
        target_date: formFields.targetDate(),
        client: formFields.selectedClient(),
        product_area: formFields.selectedProductArea(),
      };

      for (let formField in data){
        if (typeof data[formField] == 'undefined' || data[formField].length <= 0){
          makeToast(`${formField.replace(/_/, ' ').toUpperCase()} IS REQUIRED`);
          return;
        }
      }

      data['submitted_feature_list']= JSON.stringify(formFields.submittedFeatureList());

      api({
        method: 'PUT',
        url: '/feature',
        data: data,
        headers: {
          Authorization: 'Bearer '+ window.localStorage.token
        }
      })
        .then((resp)=> {
          page('/');
        })
        .catch(({ response }) => {

          for(let errorKey in response.data.message){
            makeToast(`${response.data.message[errorKey]}!`);
          }
        });
    }
  };

  let setPriorityBoxes = (clientPriorityFields, client) => {
    viewModel.selectedClient(client.id);
    viewModel.selectedProductArea(clientPriorityFields.selectedProductArea());
    viewModel.clientPriorities([]);

    for(let key in clientPriorityFields.clientsFeatures()){
      console.log('woo');
      key === client.name ? viewModel.clientPriorities(clientPriorityFields.clientsFeatures()[key]) : null;
      key === client.name ? viewModel.currentClient(key): null;
    }

    for(let [idx, feature] of viewModel.clientPriorities().entries()){
      feature.priority = idx + 2;
    }

    viewModel.submittedFeatureList(viewModel.clientPriorities());
    viewModel.newFeature([{id:0, title: ''}]);
  };

  let getClient = (clients, selected_client_id) => {
    return clients.find((client) => {
      return client.id === +selected_client_id
    })
  };

  var retrieve = function() {
    api.get('/feature/'+context.params.id, {headers:{Authorization: 'Bearer '+ window.localStorage.token}})
      .then((resp)=> {

        let feature = resp.data.feature[0];

        viewModel.featureTitle(feature.title);
        viewModel.description(feature.description);
        viewModel.targetDate(feature.target_date.substr(0,10));
        viewModel.selectedClient(feature.client_id.toString());
        viewModel.selectedProductArea(feature.product_area_id);
        let selectedProductArea = ko.observable(feature.product_area_id);

        viewModel.clientsFeatures(resp.data.clients_features);
        viewModel.clients(resp.data.clients);

        viewModel.productAreas(resp.data.product_areas);

        let client = getClient(resp.data.clients, feature.client_id);
        if(client){
          let clientPriorityFields = {
            'clientsFeatures': viewModel.clientsFeatures,
            'selectedClient':  client,
            'selectedProductArea': selectedProductArea
          };

          setPriorityBoxes(clientPriorityFields, client);
        }
      })
      .catch(( response ) => {
        makeToast(`Error retrieving feature!`);
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
      console.warn({result});
      ctx.authorized = result.authorized;
      next();
    })
    .catch((error) => {
      console.error({error});
      ctx.authorized = false;
      next();
    });
};

const fetchPage = (templateName, callback, context) => {
  fetch(`/templates/${templateName}.html`)
    .then(response => response.text())
    .then( html => {
      const div = document.createElement('div');
      div.id = 'container';
      document.querySelector('#container').replaceWith(div);
      div.innerHTML = html;
      callback && callback(div, context);
  });
};

let renderContent = (templateName, callback, ctx, next) => {
  if(ctx.authorized){
    viewModel.logout('Logout');
    // viewModel.userName(window.localStorage.intuitiveName)
    page('/');
  }else{
    console.log(viewModel);
    viewModel.logout('');
    // viewModel.userName('');
    fetchPage(templateName, callback);
  }
};

let renderAuthContent = (templateName, callback, ctx, next) => {
  if(ctx.authorized){
    console.log('happy', viewModel);
    viewModel.logout('Logout');
    viewModel.userName(window.localStorage.intuitiveName);
    fetchPage(templateName, callback, ctx);
  }else{
    viewModel.logout('');
    // viewModel.userName('');
    page('/login');
  }
};

page('/index', verifyUser, renderAuthContent.bind(null,'home', homePage));

page('/', verifyUser, renderAuthContent.bind(window,'home', homePage));

page('/feature', verifyUser, renderAuthContent.bind(window,'feature', featurePage));
page('/feature/:id', verifyUser, renderAuthContent.bind(window, 'feature_edit', featureEditPage));

page('/client', verifyUser, renderAuthContent.bind(window, 'client', clientPage));

page('/product_area', verifyUser, renderAuthContent.bind(window, 'product_area', productAreaPage));
page('/register', renderContent.bind(window, 'register', registerPage));

page('/login', verifyUser, renderContent.bind(window, 'login', loginPage));

page('*', function(){
  page('/login');
});

window.onSignIn = function(googleUser, e) {
  var profile = googleUser.getBasicProfile();
  var data = {
    'fullname': profile.getName(),
    'email': profile.getEmail(),
    'social_id': 'gogole'+profile.getId(),
  };
  window.localStorage.setItem('googleLogin', true);
  window.localStorage.setItem('intuitiveName', profile.getName());
  window.localStorage.setItem('intuitiveLogout', 'Logout');

  viewModel.userName = profile.getName();
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
  };
  xml.send(JSON.stringify(data));
};

window.logout = function() {

};

var viewModel = {
  userName: ko.observable(''),
  logout: ko.observable(''),
  onLogoutClick () {
    const token = window.localStorage.token;
    const headers = { 'Authorization': `Bearer ${token}` };
    const PORT = 7777;

    fetch(`${'http://'}${location.host}:${PORT}` + '/logout', { headers })
      .then(r => r.json())
      .then((result) => {
        window.localStorage.clear();
        page('/login');
      })
      .catch((error) => {
        window.localStorage.clear();
        page('/login');
      });
  }
};

function ready(callback) {
  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
    callback();
    ko.applyBindings(viewModel, window.document.getElementById('title-container'));
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      callback(), ko.applyBindings(viewModel, window.document.getElementById('title-container'));
    });
  }
}

ready(page);

}());
