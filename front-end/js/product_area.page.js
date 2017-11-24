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
      for (let formField in data){
        if (typeof data[formField] == 'undefined' || data[formField].length <= 0){
          iqwerty.toast.Toast(`${formField.replace(/_/, ' ').toUpperCase()} IS REQUIRED`)
          return;
        }
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
          var options = {
            style: {
              main: {
                background: "#5bc0de",
                color: "black"
              }
            }
          };
          iqwerty.toast.Toast(`Error adding client!`, options)
        });
    }
  };
  ko.applyBindings(viewModel, container);
}
