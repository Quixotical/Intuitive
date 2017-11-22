import api from './api';

export default (container) => {
  var viewModel = {
    clientsFeatures: ko.observableArray(),
    targetDate:ko.observable(moment().format('YYYY-MM-DD')),
    title: ko.observable(),
    priority: ko.observable(),
    clients: ko.observableArray(),
    productAreas: ko.observableArray(),
    description: ko.observable(),
    selectedClient: ko.observable(),
    selectedProductArea: ko.observable(),
    clientPriorities: ko.observableArray(null),

    testingClick () {

      $( ".box-container" ).on( "sortstop", function( event, ui ) {console.log('weeee')} );
    },
    getFormattedDate (){
      return moment(this.targetDate()).format('MM/DD/YYYY');
    },

    checkPriority(knockoutFields, e) {
      let client = knockoutFields.clients().find((client) => {
        return client.id === +e.target.value
      })
      let features;
      if (client){
        for(let key in knockoutFields.clientsFeatures()){
          key === client.name ? viewModel.clientPriorities(knockoutFields.clientsFeatures()[key]) : null
        }
      }else {
        viewModel.clientPriorities(null);
      }

      $(".box-container").sortable({
        revert: true,
        scroll: true,
        placeholder: "sortable-placeholder",
        stop: function(event,ui){
          console.log(ui);
        },
        change: function( event, ui ) {console.log('hey hey', event, ui)},
        update: function( event, ui ) {console.log('meep')},

      });
    },

    onSubmit (formFields) {

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
        viewModel.clientsFeatures(resp.data.clients_features)
        viewModel.clients(resp.data.clients);
        viewModel.productAreas(resp.data.product_areas);
      })
      .catch(({ response }) => {
        console.log(response)
        console.warn('Error adding client', response.data.message)
      });
  }
  retrieve();




  ko.applyBindings(viewModel, container);
}
