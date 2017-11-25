import api from './api';
import makeToast from './toast_maker';

export default (container) => {

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
      })
      let features;
      if (client){
        viewModel.clientPriorities([]);
        console.log(knockoutFields.newFeature());
        for(let key in knockoutFields.clientsFeatures()){
          key === client.name ? viewModel.clientPriorities(knockoutFields.clientsFeatures()[key]) : null
          key === client.name ? viewModel.currentClient(key): null
        }

        for(let [idx, feature] of viewModel.clientPriorities().entries()){
          feature.priority = idx + 2
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

      }
      for (let formField in data){
        if (typeof data[formField] == 'undefined' || data[formField].length <= 0){
          makeToast(`${formField.replace(/_/, ' ').toUpperCase()} IS REQUIRED`)
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
            makeToast(`${response.data.message[errorKey]}! `)
          }
          console.warn('Error registering user', response.data.message)
        });
    }
  }

  var retrieve = function() {
    api.get('/feature-priorities', {headers:{Authorization: 'Bearer '+ window.localStorage.token}})
      .then((resp)=> {
        viewModel.clientsFeatures(resp.data.clients_features)
        viewModel.clients(resp.data.clients);
        viewModel.productAreas(resp.data.product_areas);
      })
      .catch(({ response }) => {
        makeToast(`Error retrieving feature!`);
      });
  }
  retrieve();
  ko.applyBindings(viewModel, container);
}
