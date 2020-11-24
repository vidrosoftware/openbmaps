/* jshint esversion: 6 */
import RichLogger from '../src/richLogger';
import axios from 'axios';
let _self = null,
  _version = '1.0.0',
  _token = null,
  _events = null,
  _logger = null;

export default class Go2Epa {
  constructor(options) {
    if (typeof options === 'undefined') {
      throw new TypeError('no data');
    }
    if (typeof options.baseHref === 'undefined') {
      throw new TypeError('no options baseHref');
    }
    if (typeof options.token === 'undefined') {
      throw new TypeError('no token');
    }
    _token = options.token;
    _logger = new RichLogger(options.env);
    _self = this;
    _self._fileName = 'go2epa.js';
    _self.options = options;
    _logger.info(_self._fileName, `Module loaded v.${_version}`,options);
  }

	/**
    getgo2epa


      @param  <int>
      @param  <string> geom string

   **/

   getgo2epa(){
     _logger.info(_self._fileName, `getgo2epa()`);
     let dataToSend = {};
     dataToSend.token = _token;

     dataToSend.what = 'GET_GO_2_EPA';
     return _self._sendRequest(dataToSend,'getgo2epa');
   }


   /**
     setgo2epa


       @param  <int>
       @param  <string> geom string

    **/

    setgo2epa(){
      _logger.info(_self._fileName, `setgo2epa()`);
      let dataToSend = {};
      dataToSend.token = _token;

      dataToSend.what = 'SET_GO_2_EPA';
      return _self._sendRequest(dataToSend,'setgo2epa');
    }


   //****************************************************************
   //********************          HELPERS      *********************
   //****************************************************************

   _sendRequest(dataToSend,action){
     _logger.info(_self._fileName, `_sendRequest(${action})`,dataToSend);
     return new Promise((resolve, reject) => {
       axios.post(_self.options.basehref+'/notifications.ajax.php', dataToSend).then(function (response) {
         _logger.success(_self._fileName, `_sendRequest()`,response.data);
         if(response.data.status==="Accepted"){
           resolve(response.data.message);
         }else{
           reject(response.data.message);
         }
       })
       .catch( (error) => {
         _logger.error(_self._fileName, `_sendRequest()`,error);
         reject(error);
       });
     });
   }
   //****************************************************************
   //***********************    END HELPERS    **********************
   //****************************************************************
}
