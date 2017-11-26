export default class Validator {

  constructor(allFields, requiredFields, lengthReqFields=null, customReqFields=null){

    this.allFields = allFields;
    this.requiredFields = requiredFields;
    this.lengthReqFields = lengthReqFields;
    this.customReqFields = customReqFields;

    this.error = false;
  }

  validate(){

        if(!this.error){
          for(let key in this.requiredFields){

            let validationError = typeof this.requiredFields[key] === 'undefined' ||
                                          this.requiredFields[key].length === 0 ?
                                          key :
                                          null;
            if(validationError){
              this.error = key.replace(/_/, ' ') + ' is required';
              break;
            }
          }
        }

        if(!this.error){
          for(let key in this.lengthReqFields){
            let validationError = typeof this.allFields[key] !== 'undefined' &&
                    this.allFields[key].length < this.lengthReqFields[key] ?
                                                                      key :
                                                                      null;
            if(validationError){
              this.error = key.replace(/_/, ' ') + ' must be ' + this.lengthReqFields[key] + ' characters long'
              break;
            }
          }
        }
    }
}
