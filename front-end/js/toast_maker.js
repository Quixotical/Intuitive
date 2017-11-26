export default function makeToast (message) {
  let options = {
    style: {
      main: {
        background: "#5bc0de",
        color: "black"
      }
    },
    settings: {
		    duration: 2000
    }
  };
  iqwerty.toast.Toast(message, options)
}
