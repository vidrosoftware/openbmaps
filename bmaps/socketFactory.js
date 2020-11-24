(function() {
'use strict';

	/**
	 * Socket Factory
	 */

angular.module('app').factory('socketFactory', ['$rootScope', function ($rootScope) {
	var filename 		= "common/socketFactory.js",
		env,
		app_name,
		urlSocket,
		project_name,
		project_id,
		ws_token,
		baseHref,
		token,
		socket,
		socket_id;

	// public API
	var dataFactory 				= {

										init: 				init

						};
	return dataFactory;


	function init(_env,_token,_app_name,_urlSocket,_project_name,_project_id,_ws_token,_baseHref){
		env							= _env;
		token						= _token;
		urlSocket				= _urlSocket;
		app_name				= _app_name;
		project_name		= _project_name;
		project_id      = _project_id;
		ws_token        = _ws_token;
		baseHref        = _baseHref;

		log("init("+_env+","+_token+","+_app_name+","+_urlSocket+","+_project_id+","+_ws_token+","+_baseHref+")");
		socket = io(urlSocket,{
						secure:true,
						reconnection:true,
						reconnectionDelay: 1000,
						reconnectionDelayMax : 5000,
						reconnectionAttempts: 5,
						timeout: 5000
		});

		socket.on('connect', function () {
			log("Socket succesfully connected","success");
			var user_data								= {};
			user_data.roomName					= project_name;
			user_data.ws_token					= ws_token;
			user_data.project_id				= project_id;
			user_data.baseHref					= baseHref;
			socket.emit('user_connect', user_data);
			log("Socket succesfully connected","info",user_data);
			$rootScope.$broadcast('socketStatus',{status_str:"Connected",status:1});

		});

		socket.on('connection_accepted', function (data) {
			log("Socket connection_accepted","success",data);
			socket_id		= data.socket_id;

		});

		socket.on('connect_error', function () {
			log("Socket connection error","error");
			$rootScope.$broadcast('socketStatus',{status_str:"Connection error",status:0});
		});

		/*so.on('ping', function (data){
			//logger.log("JS [Socket]","ping: "+data.beat);
			so.emit('pong', {tipo:config.tipo,roomName:config.roomName});

		});*/
    socket.on('connection_rejected', function (data) {
			log("Socket connection_rejected","error",data);
		});

		socket.on('new_geometry', function (data) {
			log("Socket new_geometry","info",data);
			try{
//				var payload 	= data.payload.split(";");
				var payload 	= data;
				$rootScope.$broadcast('socket_new_geometry',{id:parseInt(payload.id),geom:payload.geom,epsg:"EPSG:"+payload.epsg,layer:payload.layer});
			}catch(err) {
				log("Socket new_geometry error parsing: "+err,"warn");
			}
		});
		socket.on('externalEvent', function (data) {
			log("External event","info",data);
			$rootScope.$broadcast('externalEvent',{msg:data.msg,value:data.value});
        });
		//disconnection event
		socket.on('disconnect', function () {
			log("Socket - disconnected","warn");
			$rootScope.$broadcast('socketStatus',{status_str:"Disconnected",status:0});
		});

		socket.on( 'reconnect', function() {
			log("Socket - reconnected","success");
		});

	}



	//****************************************************************
	//***********************      HELPERS      **********************
    //****************************************************************

	//log function
	function log(evt,level,data){
		$rootScope.$broadcast('logEvent',{evt:evt,extradata:data,file:filename,level:level});
	}

	//****************************************************************
	//***********************      HELPERS      **********************
    //****************************************************************

}])

})();
