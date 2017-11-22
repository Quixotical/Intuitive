import api from './api';

export default (container) => {

  var viewModel = {
    name: ko.observable(),

    onSubmit (formFields) {

      let data = {
        name: formFields.name()
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
