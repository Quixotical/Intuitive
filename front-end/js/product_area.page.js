import api from './api';

export default (container) => {

  var viewModel = {
    name: ko.observable(),
    description: ko.observable(),

    onSubmit (formFields) {

      let data = {
        name: formFields.name(),
        description: formFields.description(),
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
        .catch(({ response }) => {
          //TODO display error messages
          console.warn('Error adding client', response.data.message)
        });
    }
  };
  ko.applyBindings(viewModel, container);
}
