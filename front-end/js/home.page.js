import api from './api';
import makeToast from './toast_maker';
import errorHandler from './error_handler';

export default (container) => {
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
      })
      viewModel.features(updatedFeatureList);

      api({
        method: 'DELETE',
        url: '/feature/'+ item.id,
        headers: {
          Authorization: 'Bearer '+ window.localStorage.token
        }
      })
        .then((resp)=> {
          makeToast(`Deleted feature request: ${item.title} !`)
        })
        .catch(errorHandler)
    },
  };

  var retrieve = function() {
    api.get('/', {headers:{Authorization: 'Bearer '+ window.localStorage.token}})
      .then((resp)=> {
        let features = resp.data.features;
        for (let feature of features) {
          feature.target_date = moment(feature.target_date).format('MM/DD/YYYY')
        }
        viewModel.features(resp.data.features);
        viewModel.userFeatures(resp.data.user_features);

      })
      .catch(errorHandler)
  }

  if(window.localStorage.googleLogin){
    window.localStorage.removeItem('googleLogin')
    window.location.reload();
  }else{
    retrieve();
  }

  ko.applyBindings(viewModel, container);
}
