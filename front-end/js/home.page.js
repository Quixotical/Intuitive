import api from './api';

export default (container) => {
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
          feature.target_date = moment(feature.target_date).format('MM/DD/YYYY')
        }
        viewModel.features(resp.data.features);
        viewModel.userFeatures(resp.data.user_features);

      })
      .catch(({ response }) => {
        console.log(response)
        console.warn('Error adding client', response.data.message)
      });
  }
  retrieve();
  ko.applyBindings(viewModel, container);
}
