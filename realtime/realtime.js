/*jshint es_this.version: 6 */
'use strict';
import {EventEmitter} from 'events';
import io from 'socket.io-client';
const RichLogger 	= require('@pw2016/logger');
let so 									= null;
let _userData						= null;
let localSocketid 						= null;
let _options 						= null;
let _events 						= new EventEmitter();
let _self 							= null;
let _logger							= null;
let _users 							= [];

export class RealTimeBmaps extends EventEmitter{
	constructor(options){
		super();
		if (typeof options === 'undefined') throw new TypeError('no data');
		if (typeof options.baseHref === 'undefined') throw new TypeError('no options baseHref');
		if (typeof options.env === 'undefined'){
			options.env = 'prod';
		}

		_self 					= this;
		_self._version 	= '1.0.0';
		_self._fileName = 'realTime.js';
		_self._options 	= options;
		_self._logger = new RichLogger(options.env);
		_self._logger.log(_self._fileName,'Realtime '+_self._version+' initiated',options);
		_self.init();
	}

	init(){
		so = io(_self._options.urlSocket,{
						secure:true,
						reconnection:true,
						reconnectionDelay: 1000,
						reconnectionDelayMax : 5000,
						reconnectionAttempts: 5,
						timeout: 5000
		});

		so.on('connect', function () {
			_self._logger.log(_self._fileName,'Realtime '+this._version+' initiated');
			var user_data								= {};
			user_data.roomName					= _self._options.project_name;
			user_data.ws_token					= _self._options.ws_token;
			user_data.project_id				= _self._options.project_id;
			user_data.baseHref					= _self._options.baseHref;
			user_data.userName					= _self._options.userName;
			so.emit('user_connect', user_data);
			_self._logger.log(_self._fileName,'Socket succesfully connected',user_data);
			let outComing = {
				status_str: 'Connected',
				status: 1
			};
			_self.emit('socketStatus',outComing);
		});

		so.on('connection_accepted', function (data) {
			_self._logger.success(_self._fileName,'Socket connection_accepted',data);
			localSocketid		= data.socket_id;
			_users					= [];
			for(let i=0;i<data.users.length;i++){

				let us = {
					nick: data.users[i].userName,
					socket_id: data.users[i].socket_id,
					localized: false,
					coordinates: null
				}
				_self._addUserToList(us);
			}

		});

		so.on('connect_error', function (err) {
			_self._logger.error(_self._fileName,'Socket connection error',err);
			let outComing = {
				status_str: 'Connection error',
				status: 0
			};
			_self.emit('socketStatus',outComing);
		});

		/*so.on('ping', function (data){
			//logger.log("JS [Socket]","ping: "+data.beat);
			so.emit('pong', {tipo:config.tipo,roomName:config.roomName});

		});*/
		so.on('connection_rejected', function (data) {
			_self._logger.log(_self._fileName,'Socket connection_rejected',data);
		});

		so.on('new_geometry', function (data) {
			_self._logger.info(_self._fileName,'Socket new_geometry',data);
			try{
				var payload 	= data;
				let outComing = {
					//id:payload.id,
					geom:payload.geom,
					epsg:"EPSG:"+payload.epsg,
					db_table:payload.db_table
				};
				_self.emit('socket_new_geometry',outComing);
			}catch(err) {
				_self._logger.warn(_self._fileName,'Socket new_geometry error parsing',err);
			}
		});

		so.on('users', function (data) {
			_self._logger.log(_self._fileName,'users',data);
			let affectedUser 	= data.affectedUser;
			_users 						= data.users;
			let outComing 		= {
													status: data.status,
													requester: data.requester,
													affectedUser: affectedUser,
													users: _users,
													me: localSocketid
												};
			_self.emit('socket_user',outComing);
		});

		so.on('externalEvent', function (data) {
			_self._logger.log(_self._fileName,'External event',data);

			//$rootScope.$broadcast('externalEvent',{msg:data.msg,value:data.value});
		});


		//disconnection event
		so.on('disconnect', function () {
			_self._logger.warn(_self._fileName,'Socket - disconnected');
			//$rootScope.$broadcast('socketStatus',{status_str:"Disconnected",status:0});
		});

		so.on('reconnect', function() {
			_self._logger.success(_self._fileName,'Socket - reconnected');
		});

		so.on('localizeUser',function(data){
			_self._logger.info(_self._fileName,'localizeUser',data);
			_self.emit('socket_localizeUser',{evt:'startTracking',requester:data.requester});
		});

		so.on('stopRemoteLocalizeUser',function(){
			_self._logger.info(_self._fileName,'localizeUser');
			_self.emit('socket_localizeUser',{evt:'stopTracking'});
		});

	}

	sendLocalCoordindates(data,mode){
		_self._logger.info(_self._fileName,'sendLocalCoordindates',mode);
		if(so){
			let outComing = {
				socket_id: localSocketid,
				roomName: _self._options.project_name,
				coordinates: data.coordinates,
				requester: data.requester,
				mode: mode
			};
			_self._logger.info(_self._fileName,'sendLocalCoordindates',outComing);
			so.emit('sendLocalCoordindates',outComing);
		}
	}

	remoteLocalizeUser(socket_id,what){
		_self._logger.info(_self._fileName,'remoteLocalizeUser('+socket_id+','+what+') me: '+localSocketid);
		let affectedUser	= null;
		let actionName		= null;
		if(what==="start"){
			actionName	= 'remoteLocalizeUser';
		}else{
			actionName	= 'stopRemoteLocalizeUser';
		}
		if(localSocketid===socket_id){
			_self.emit('socket_localizeUser',{evt:'ERROR',msg:'local user cannot be remotecally localized'});
		}else{
			for(let i=0;i<_users.length;i++){
				if(_users[i].socket_id===socket_id){
					affectedUser				= _users[i];
					break;
				}
			}
			if(so){
				let outComing = {
					socket_id: socket_id,
					requester: {
												'socket_id': localSocketid,
												'userName': _self._options.userName
											}
				};
				so.emit(actionName,outComing);
			}

			let outComing = {
				status: actionName,
				affectedUser: affectedUser,
				users: _users,
				me: localSocketid
			};
			_self.emit('socket_user',outComing);
		}
	}
	
	getSocketId(){
		return localSocketid;
	}

	_addUserToList(newUser){
		let canAdd = true;
		for (let us in _users){
			if(newUser.socket_id===_users[us].socket_id){
				canAdd = false;
			}
		}
		if(canAdd){
			_users.push(newUser);
		}
	}

}
window.RealTimeBmaps = RealTimeBmaps;
