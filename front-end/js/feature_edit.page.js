import api from './api';
import makeToast from './toast_maker';
import Validator from './validator';
import errorHandler from './error_handler';

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
    onHomeClick(e) {
      page('/')
    },
    checkPriority(knockoutFields, e) {
      let client = getClient(knockoutFields.clients(), e.target.value)

      let features;
      if (client){
        setPriorityBoxes(knockoutFields, client);
        setSortableBoxes();
      }else {
        viewModel.clientPriorities(null);
      }
    },
    onSubmit (formFields) {

      let data = {
        title: formFields.featureTitle(),
        description: formFields.description(),
        priority: formFields.priority(),
        target_date: moment(formFields.targetDate(), ['MMMM Do YYYY']).format('YYYY/MM/DD'),
        client: formFields.selectedClient(),
        product_area: formFields.selectedProductArea(),
      }

      let context_id = context.params.id;

      let inputValidator = new Validator(data, data);
      inputValidator.validate();
      if(inputValidator.error){
        makeToast(`${inputValidator.error}`);
        return;
      }

      data['submitted_feature_list']= JSON.stringify(formFields.submittedFeatureList());

      api({
        method: 'PUT',
        url: '/feature/' + context_id,
        data: data,
        headers: {
          Authorization: 'Bearer '+ window.localStorage.token
        }
      })
        .then((resp)=> {
          page('/');
        })
        .catch(errorHandler);
    }
  }

  let setSortableBoxes = () => {
    $(".box-container").sortable({
      revert: true,
      scroll: true,
      placeholder: "sortable-placeholder",
      stop: onStopSorting
    });
  }

  let onStopSorting = (event,ui) => {
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
  }

  let setPriorityBoxes = (clientPriorityFields, client) => {
    viewModel.selectedClient(client.id);
    viewModel.selectedProductArea(clientPriorityFields.selectedProductArea())
    viewModel.clientPriorities([]);

    for(let key in clientPriorityFields.clientsFeatures()){
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
        viewModel.targetDate(moment(feature.target_date).format('MMMM Do YYYY'));
        viewModel.selectedClient(feature.client_id.toString());
        viewModel.selectedProductArea(feature.product_area_id.toString());
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
        setSortableBoxes()

        $( "#datepicker" ).datepicker({
          onSelect: function getFormattedDate(date, instance) {
            viewModel.targetDate(moment(date, ['MM/DD/YYYY']).format('MMMM Do YYYY'));
          }
        });
      })
      .catch(errorHandler);
  }
  retrieve();
  ko.applyBindings(viewModel, container);
}
