import api from './api';
import makeToast from './toast_maker';

export default (container) => {

  var viewModel = {
    name: ko.observable(),

    onSubmit (formFields) {

      let data = {
        name: formFields.name()
      }
      for (let formField in data){
        if (typeof data[formField] == 'undefined' || data[formField].length <= 0){
          makeToast(`${formField.replace(/_/, ' ').toUpperCase()} IS REQUIRED`)
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
          console.log('woooo')
          page('/');
        })
        .catch(({ response }) => {
          //TODO display error messages
          console.warn('Error adding client', response.data.message)
        });
    }
  };
  ko.applyBindings(viewModel, container);
}
