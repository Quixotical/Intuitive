import api from './api';

export default (container) => {
  var viewModel = {
    dynamicallyLoadScript() {
      console.log('woo');
      var script = document.createElement("script");
      script.src = "https://apis.google.com/js/platform.js"

      document.head.appendChild(script);
    },
  }
  viewModel.dynamicallyLoadScript();
}
