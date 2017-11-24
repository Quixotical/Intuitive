import api from './api';
import makeToast from './toast_maker';

export default (container, context) => {

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
      let client = getClient(knockoutFields.clients(), e.target.value)

      let features;
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
          let updatedFeatureList = []
          let priorityBoxes = ui.item[0].parentNode.querySelectorAll('.priority-box');
          for(let [idx, boxObject] of priorityBoxes.entries()){
            let found = false;
            for(let feature of viewModel.clientPriorities()){

              if (feature.id === +boxObject.dataset.feature_id){
                found = true;
                feature.priority = idx + 1
                updatedFeatureList.push(feature)
              }
            }
            if(found === false){
              viewModel.priority(idx + 1)
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
      }

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
  }

  let setPriorityBoxes = (clientPriorityFields, client) => {
    viewModel.selectedClient(client.id);
    viewModel.selectedProductArea(clientPriorityFields.selectedProductArea())
    viewModel.clientPriorities([]);

    for(let key in clientPriorityFields.clientsFeatures()){
      console.log('woo');
      key === client.name ? viewModel.clientPriorities(clientPriorityFields.clientsFeatures()[key]) : null
      key === client.name ? viewModel.currentClient(key): null
    }

    for(let [idx, feature] of viewModel.clientPriorities().entries()){
      feature.priority = idx + 2
    }

    viewModel.submittedFeatureList(viewModel.clientPriorities());
    viewModel.newFeature([{id:0, title: ''}]);
  }

  let getClient = (clients, selected_client_id) => {
    return clients.find((client) => {
      return client.id === +selected_client_id
    })
  }

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

        viewModel.clientsFeatures(resp.data.clients_features)
        viewModel.clients(resp.data.clients);

        viewModel.productAreas(resp.data.product_areas);

        let client = getClient(resp.data.clients, feature.client_id);
        if(client){
          let clientPriorityFields = {
            'clientsFeatures': viewModel.clientsFeatures,
            'selectedClient':  client,
            'selectedProductArea': selectedProductArea
          }

          setPriorityBoxes(clientPriorityFields, client);
        }
      })
      .catch(( response ) => {
        makeToast(`Error retrieving feature!`);
      });
  }
  retrieve();
  ko.applyBindings(viewModel, container);
}
