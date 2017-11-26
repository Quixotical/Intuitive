import makeToast from './toast_maker';

export default function errorHandler(error) {
  try {
    let messages = error.response.data.message;

    for(let errorKey in messages){
      makeToast(`${messages[errorKey]}! `)
    }
  } catch (e) {
    if(e instanceof Error){
      makeToast(e.message)
    }else{
      makeToast('Error with server');
    }
  }
}
