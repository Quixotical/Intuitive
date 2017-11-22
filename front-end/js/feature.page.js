import api from './api';

export default (container) => {
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
      }

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
          console.warn('Error registering user', response.data.message)
        });
    }
  }

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
        console.log(response)
        console.warn('Error adding client', response.data.message)
      });
  }
  retrieve();
  ko.applyBindings(viewModel, container);
}
