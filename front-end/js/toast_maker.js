export default function makeToast (message) {
  let options = {
    style: {
      main: {
        background: "#5bc0de",
        color: "black"
      }
    }
  };
  iqwerty.toast.Toast(message, options)
}
