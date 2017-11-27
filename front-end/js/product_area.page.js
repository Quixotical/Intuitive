import api from './api';
import Validator from './validator';
import errorHandler from './error_handler';

export default (container) => {

  var viewModel = {
    name: ko.observable(),
    description: ko.observable(),
    onHomeClick(e) {
      page('/')
    },
    onSubmit (formFields) {

      let data = {
        name: formFields.name(),
        description: formFields.description(),
      }

      let inputValidator = new Validator(data, data);
      inputValidator.validate();
      if(inputValidator.error){
        makeToast(`${inputValidator.error}`);
        return;
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
        .catch(errorHandler)
    }
  };
  ko.applyBindings(viewModel, container);
}
