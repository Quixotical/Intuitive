import api from './api';
import makeToast from './toast_maker';
import Validator from './validator';
import errorHandler from './error_handler';

export default (container) => {

  var viewModel = {
    name: ko.observable(),

    onSubmit (formFields) {

      let data = {
        name: formFields.name()
      }

      let inputValidator = new Validator(data, data);
      inputValidator.validate();
      if(inputValidator.error){
        makeToast(`${inputValidator.error}`);
        return;
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
        .catch(errorHandler)
    }
  };
  ko.applyBindings(viewModel, container);
}
