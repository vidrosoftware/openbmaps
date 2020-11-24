/**
 * Main app module
 */
var app  = angular.module('app', []);(function() {
'use strict';

/**
 * Main Controller
 
 Author: Leandro Lopez-Guerrero Hirsch
 @Leo_lopezg
 
 Jan/Feb 2016 

 */
var module	= angular.module('app').controller('mainController', Controller);

Controller.$inject = [
    'mapFactory', 
    'loggerService',
    'fileReader',
    '$rootScope',
    '$scope',
    '$http',
    'socketFactory'
];

	function Controller(mapFactory,loggerService, fileReader,$rootScope,$scope,$http,socketFactory) {
		var mc 						= this;
		mc.project_name				= "Searching...";
		mc.epsg						= "Searching...";
		mc.extent					= "Searching...";
		mc.wms_title				= "Searching...";
		mc.wms_name					= "Searching...";
		mc.socket 					= "Connecting...";
		mc.socket_status			= 0;			//flag socket connection status
		mc.layers					= null;			//array containg layers
		mc.projectInfo				= false;		//show hide project info container
		mc.showLayers				= false;		//show hide layers container
		mc.addPointForm				= false;		//flag for display or not form for add point/line/polygon
		mc.canAddPicture 			= false;		//flag for display or not camera button
		mc.typeOfAddedElement		= null;			//type of added element  point/line/polygon
		mc.addedGeometry			= null;			//container for added geometry data
		mc.toolPointSelected		= false;		//flag add point tool selected
		mc.toolPictureSelected		= false;		//flag take picture selected
		mc.toolMeasureLineSelected	= false; 		//flag tool measure line selected
		mc.toolMeasureAreaSelected	= false;		//flag tool measure area selected
		mc.toolSelectArea			= false;		//falg tool select area
		mc.mapError					= false;		//map error container
		mc.pointInfoActive			= false;		//flag for display point info
		mc.LoadingInfoPoint			= false;		//loader container in info point
		mc.pointsInfo				= false;		//flag point info displayed or not
		mc.SinglePointInfo			= false;		//flag for dispay single point info
		mc.pointPhotos				= null;			//array containg photos from a given point
		mc.point_coordinates		= null;			//var containing point clicked coordinates
		mc.ChangeBackground			= false;		//show hide change background select
		mc.backgroundmap			= null;			//background map
		mc.geolocate				= 0;			//flag for use geolocation or not
		mc.max_features				= 30;			//limit of features for queries
		mc.pointlati				= "0",			//addPoint coordinates
		mc.pointlong				= "0",			//addPoint coordinates
		mc.loadingLegend			= true; 		//loading item for legend 
		mc.showLegend				= false;		//show hide legend container
		mc.mapLogo					= null;			//ng-src for map logo
		mc.noInfoToDisplay			= false;		//message no info found in clicked point
	
		mc.available_bg_layers		= Array(
											{"name":"No background","id":'none'},
											{"name":"Open Street maps","id":'OSM'},
											{"name":"CartoDB Light","id":'CartoDBLight'},
											{"name":"CartoDB Dark","id":'CartoDBDark'},
											{"name":"Google Maps","id":'google'},
											{"name":"ICC mtc5m","id":'mtc5m'},
											{"name":"ICC mtc10m","id":'mtc10m'},
											{"name":"ICC mtc25m","id":'mtc25m'},
											{"name":"ICC mtc50m","id":'mtc50m'},
											{"name":"ICC mtc250m","id":'mtc250m'},
											{"name":"ICC mtc500m","id":'mtc500m'},
											{"name":"ICC mtc1000m","id":'mtc1000m'},
											{"name":"ICC orto10c","id":'orto10c'},
											{"name":"ICC orto25c","id":'orto25c'},
											{"name":"ICC orto5m","id":'orto5m'},
											{"name":"ICC orto25m","id":'orto25m'},
											{"name":"ICC ortoi25c","id":'ortoi25c'},
											{"name":"ICC ortoi5m","id":'ortoi5m'},
											{"name":"ICC ortoi25m","id":'ortoi25m'},
											{"name":"ICC sat250m","id":'sat250m'},
											{"name":"ICC mtc1000m","id":'mtc1000m'}
											);	//initial values for background select
		//initial status for tools									
		$scope.addPointDisabled			= true;
		$scope.addLineDisabled			= true;
		$scope.addPopolygonDisabled		= true;
		$scope.toolsDisabled			= true;			//flag for tools disabled if no layer displayed	
		//expose macFactory to directives									
		if(mapFactory){
			mc.mapFactory				= mapFactory;
		}
		//edition/add buttons
		mc.layerAttributes				= Array(); 	//attributes that can be edited on a layer
		mc.editableAttributes 			= {};		//container for attributtes
		mc.editContainer				= false;
		mc.editBt						= false;
		mc.endEditBt					= false;
		mc.cancelEditBt					= false;
		mc.deleteBt						= false;			
		mc.tableIdName					= null;		//name of id field in db table
		var app_name					= "cloudmapsjs",
			file_name					= "Maincontroller.js",
			version						= "1.0.0",			
			ajax_target					= "ajax.projects.php",
			use_layer_auth				= false,
			user_permissions			= Array(),			
			baseHref,
			env,
			project_id,
			token,
			urlWMS,
			urlSocket,
			photoMode,									//"upload" or "attach" photo for uploading on form submit
			touchDevice					= 0,			//0 no touch device, 1 touch device (mobiler or tablet)
			geom_colors					= {},			//object with color customization for select/edit geometries	
			legendTextColor				= "#FFFFFF",	//default legend textColor		
			legendTextSize				= "6",			//default legend textSize		
			currentLegendLayer			= null,			//current legend layer name
			added_images				= Array();		//internal array containing images for upload					
		
		//default colors for select/edit geometries
		geom_colors.select_stroke_color	= "rgba(0,71,252,1)";
		geom_colors.select_fill_color	= "rgba(252,0,0,0.72)";
		geom_colors.edit_stroke_color	= "rgba(0,71,252,1)";
		geom_colors.edit_fill_color		= "rgba(252,0,0,0.72)";
		geom_colors.measure_fill_color	= "rgba(255,230,0,0.24)";
		geom_colors.measure_stroke_color= "rgba(255,0,0,1)";

		mc.version						= version;
		//****************************************************************
		//***********************     INIT APP     ***********************
		//****************************************************************
		
		$rootScope.initApp	= function(_baseHref,_urlWMS,_env,_token,_project_id,_urlSocket,_configJson,_touchDevice){
			baseHref		= _baseHref;
			env				= _env;
			token			= _token;
			project_id		= _project_id;
			urlWMS			= _urlWMS;
			urlSocket		= _urlSocket;
			touchDevice		= parseInt(_touchDevice);
			loggerService.init(env);
			log("initApp("+_baseHref+","+_urlWMS+","+_env+""+_token+","+_project_id+","+_urlSocket+","+_configJson+","+_touchDevice+")");
			getProjectInfo(_configJson);
			if (navigator.onLine) {
				log("app Online");
			}else{
				log("app Offline");
			}	
		}
		
		//****************************************************************
		//***********************   END INIT APP    **********************
		//****************************************************************	
		
		function getProjectInfo(_configJson){
			if(_configJson){
				log("getProjectInfo() from JSON: "+_configJson);
				$http.get(_configJson).success(function (data) {
					log("getProjectInfo() from JSON result:",data);
					use_layer_auth			= Boolean(data.use_layer_auth);
					mc.project_name			= data.project_name;
					mc.backgroundmap 		= data.background;
					data.use_capabilities	= Boolean(data.use_capabilities);
					data.zoom_level			= parseInt(data.zoom_level);
					data.longitude			= parseInt(data.longitude);
					data.latitude			= parseInt(data.latitude);
					data.realTime			= Boolean(data.realTime);
					if(typeof data.select_stroke_color!= 'undefined'){
						geom_colors.select_stroke_color	= data.select_stroke_color;
					}
					if(typeof data.select_fill_color!= 'undefined'){
						geom_colors.select_fill_color	= data.select_fill_color;
					}
					if(typeof data.edit_stroke_color!= 'undefined'){
						geom_colors.edit_stroke_color	= data.edit_stroke_color;
					}
					if(typeof data.edit_fill_color!= 'undefined'){
						geom_colors.edit_fill_color		= data.edit_fill_color;
					}
					if(typeof data.measure_fill_color!= 'undefined'){
						geom_colors.measure_fill_color	= data.measure_fill_color;
					}
					if(typeof data.measure_stroke_color!= 'undefined'){
						geom_colors.measure_stroke_color= data.measure_stroke_color;
					}				
					data.geom_colors		= geom_colors;
					if(typeof data.logo!= 'undefined'){
						setLogo(data.logo);
					}
					if(typeof data.legendTextColor!= 'undefined'){
						legendTextColor	= data.legendTextColor;
					}
					if(typeof data.legendTextSize!= 'undefined'){
						legendTextSize	= data.legendTextSize;
					}
					initModules(data,data.realTime);		
				}).error(function (error) {
					log("error requesting getProjectInfo: "+error);
				});	
			}else{
				var data2send			= {};
				data2send.what			= "GET_PROJECT_INFO";
				data2send.project_id	= project_id;
				data2send.token			= token;
				$http.post(baseHref+ajax_target, data2send).success(function (data) {
				log("getProjectInfo() result:",data);
					if(data.status==="Accepted"){
						use_layer_auth					= Boolean(data.message.use_layer_auth);
						mc.project_name					= data.message.project_name;
						mc.backgroundmap 				= data.message.background;
						//customize colors
						geom_colors.select_stroke_color	= data.message.geom_select_stroke_color;
						geom_colors.select_fill_color	= data.message.geom_select_fill_color;
						geom_colors.edit_stroke_color	= data.message.geom_edit_stroke_color;
						geom_colors.edit_fill_color		= data.message.geom_edit_fill_color;
						geom_colors.measure_fill_color	= data.message.measure_fill_color;
						geom_colors.measure_stroke_color= data.message.measure_stroke_color;
						data.message.geom_colors		= geom_colors;
						if(typeof data.message.maplogo!= 'undefined'){
							setLogo(data.message.maplogo);
						}
						if(typeof data.message.legendtextcolor!= 'undefined'){
							legendTextColor				= data.message.legendtextcolor;
						}
						if(typeof data.message.legendfontsize!= 'undefined'){
							legendTextSize				= data.message.legendfontsize;
						}
						if(use_layer_auth){
							log("request GET_USER_PERMISSIONS");
							var data2send			= {};
							data2send.what			= "GET_USER_PERMISSIONS";
							data2send.project_id	= project_id;
							data2send.token			= token;
							$http.post(baseHref+ajax_target, data2send).success(function (dataPermissions) {
								log("GET_USER_PERMISSIONS result",dataPermissions);
								if(dataPermissions.status==="Accepted"){
									user_permissions			= dataPermissions.message;
									initModules(data.message,data.message.use_realtime);
								}
							}).error(function (error) {
								log("error requesting GET_USER_PERMISSIONS");
								displayMapError({err: "Error requesting GET_USER_PERMISSIONS"});
							});	
						}else{
							initModules(data.message,data.message.use_realtime);
						}
					}
				}).error(function (error) {
					log("error requesting getProjectInfo");
				});		
			}
		}	
		
		function initModules(project,realtime){
			mapFactory.init(env,urlWMS,token,project,app_name,mc.geolocate,mc.max_features,touchDevice);
			//websocket
			if(realtime){
				socketFactory.init(env,token,app_name,urlSocket,project.project_name);
			}
		}
		
		//****************************************************************
		//***********************    UI LISTENERS    *********************
		//****************************************************************
		
		$scope.toggleProjectInfo	= function(){
			if(mc.projectInfo){
				mc.projectInfo	= false;			
			}else{
				mc.projectInfo = true;
			}
		}
		
		$scope.cleanGeometries	= function(){
			mapFactory.cleanGeometries('all');
		}
		
		//*******************  BACKGROUND EVENTS    ******************
		
		$scope.toggleBackGround	= function(){
			if(mc.ChangeBackground){
				mc.ChangeBackground	= false;
			}else{
				mc.ChangeBackground = true;
			}
		}

		$scope.changeBackgroundMap	= function(){
			log("ChangeBackground: ",mc.backgroundmap);
			mapFactory.setBackGroundMap(mc.backgroundmap);
		}

		//***********************  END BACKGROUND EVENTS   ***********
		
		//***********************     GEOLOCATION          ***********

		$scope.toogleGeolocation	= function(){
			log("toogleGeolocation: "+mc.geolocate);
			mapFactory.setUseGeolocation(mc.geolocate);
		}

		//***********************    END GEOLOCATION      ************

		//***********************    FEAUTURES LIMIT      ************

		$scope.setFeatureLimit	= function(){
			log("setFeatureLimit: "+mc.max_features);
			mapFactory.setMaxFeatures(mc.max_features);
		}

		//***********************    END  FEAUTURES LIMIT ************
		
		//***********************  LAYERS EVENTS    ******************
		
		$scope.toggleShowLayers	= function(){
			if(mc.showLayers){
				mc.showLayers	= false;
			}else{
				mc.showLayers = true;
			}
		}
		
		$scope.addRemoveLayer	= function(item,index){
			log("addRemoveLayer: ",item);
			if(!item.isSelected){
				item.isSelected 	= true;	
			}else{
				item.isSelected 	= false;
			}
			mapFactory.addLayer(item.Name);
			if(item.isActiveLayer){
				resetActiveLayer();
				var layer_displayed = mapFactory.getLayersDisplayed();
				markActiveLayer(layer_displayed[0]);
				getLegend(layer_displayed[0]);
			}
			var numberOflayersDisplayed 	= mapFactory.getLayersDisplayed().length;
			//enable/disable tools
			if(numberOflayersDisplayed>0){
				$scope.toolsDisabled			= false;	
			}else{
				$scope.toolsDisabled			= true;	
			}
			//set active layer if only 1 is displayed and this is activeLayer
			if(numberOflayersDisplayed===1 || (typeof mapFactory.getActiveLayerName()==="undefined")){
				//select first layer as active layer
				if((typeof mapFactory.getActiveLayerName()==="undefined")){
					mapFactory.setActiveLayer(item.Name);
				}else{
					var layer_displayed = mapFactory.getLayersDisplayed();
					mapFactory.setTool(null);
					markActiveLayer(layer_displayed[0]);
					getLegend(layer_displayed[0]);						
				}
			}
		}
		
		$scope.setActiveLayer	= function(item,index){
			log("setActiveLayer: ",item);
			if(item.Name!=mapFactory.getActiveLayerName()){
				resetActiveLayer();
				var layer_displayed = mapFactory.getLayersDisplayed();
			
				if(layer_displayed.indexOf(item.Name)==-1){
					if(!item.isSelected){
						item.isSelected 	= true;	
				
					}else{
						item.isSelected 	= false;		
					}
					mapFactory.addLayer(item.Name);		
				}		
				var canEdit	= userCanEditLayer(item.Name);
				if(canEdit){
					mapFactory.getLayerAttributes(item.Name);
				}
				if(!item.isActiveLayer){
					item.isActiveLayer 	= true;	
				}else{
					item.isActiveLayer 	= false;
				}				
				mapFactory.setActiveLayer(item.Name);
				//get legend
				getLegend(item.Name);
				//enable/disable tools
				if(mapFactory.getLayersDisplayed().length>0){
					$scope.toolsDisabled			= false;	
				}else{
					$scope.toolsDisabled			= true;	
				}
			}
		}

		function markActiveLayer(name){
			//first Level
			for (var i=0;i<mc.layers.length;i++){
				if(mc.layers[i].Name===name){
					mc.layers[i].isActiveLayer = true;	
				}
				//second level
				if (typeof mc.layers[i].Layer != 'undefined'){
					for (var s=0;s<mc.layers[i].Layer.length;s++){
						if(mc.layers[i].Layer[s].Name===name){
							mc.layers[i].Layer[s].isActiveLayer = true;
						}
						//third level
						if (typeof mc.layers[i].Layer[s].Layer != 'undefined'){
							for (var t=0;t<mc.layers[i].Layer[s].Layer.length;t++){
								if(mc.layers[i].Layer[s].Layer[t].Name===name){
									mc.layers[i].Layer[s].Layer[t].isActiveLayer = true;
								}
							}				
						}
					}				
				}
			}
			var canEdit	= userCanEditLayer(name);
			if(canEdit){
				mapFactory.getLayerAttributes(name);
			}	
		}

		function resetActiveLayer(){
			log("resetActiveLayer");
			var activeLayer 	= mapFactory.getActiveLayer();
			//first Level
			for (var i=0;i<mc.layers.length;i++){
				mc.layers[i].isActiveLayer = false;	
				//second level
				if (typeof mc.layers[i].Layer != 'undefined'){
					for (var s=0;s<mc.layers[i].Layer.length;s++){
						mc.layers[i].Layer[s].isActiveLayer = false;
						//third level
						if (typeof mc.layers[i].Layer[s].Layer != 'undefined'){
							for (var t=0;t<mc.layers[i].Layer[s].Layer.length;t++){
								mc.layers[i].Layer[s].Layer[t].isActiveLayer = false;
							}				
						}
					}				
				}
			}	
			mc.SinglePointInfo			= false;
			mc.pointsInfo				= false;
			mc.pointInfoActive			= false;
			mc.addPointForm				= false;
			mapFactory.setTool(null);
			//clean geometries added from othe layers
			mapFactory.cleanGeometries('all');					
		}
		
		$scope.$on('notifyNoActiveLayer', function (event, data){
			mc.legend 			= null;
			mc.showLegend		= false;
			if($('#legend').length>0){
				$('#legend').collapse('hide');
				$('#menuLegend').addClass("collapsed");
			}	
		});
		
		$scope.userCanSeeLayer	= function(layer){
			if(use_layer_auth){
				for (var i=0;i<user_permissions.length;i++){
					if(user_permissions[i].qgis_name===layer){
						return true;
					}
				}
			}else{
				return true;
			}
		}

		$scope.userCanEditLayer = function(layer){
			return userCanEditLayer(layer);
		}
		
		function userCanEditLayer(layer){
			//log("userCanEditLayer("+layer+")");
			$scope.addPointDisabled			= true;
			$scope.addLineDisabled			= true;
			$scope.addPopolygonDisabled		= true;
			if(use_layer_auth){
				for (var i=0;i<user_permissions.length;i++){
					if(user_permissions[i].qgis_name===layer && user_permissions[i].edit===1){
						if(user_permissions[i].geometry==="Point"){
							$scope.addPointDisabled	= false;
						}else if(user_permissions[i].geometry==="Polygon" || user_permissions[i].geometry==="MultiPolygon"){
							$rootScope.$broadcast('define_geometryTypeInTools',{toolName:user_permissions[i].geometry});
							$scope.addPopolygonDisabled	= false;
						}else if(user_permissions[i].geometry==="LineString" || user_permissions[i].geometry==="MultiLineString"){
							$rootScope.$broadcast('define_geometryTypeInTools',{toolName:user_permissions[i].geometry});
							$scope.addLineDisabled	= false;
						}
						return true;
					}
				}
			}else{
				return false;
			}
		}
		
		//***********************  END LAYERS EVENTS   **************
		
		$scope.selectArea		= function(){
			log("selectArea: "+mc.toolSelectArea);
			if(!mc.toolSelectArea){
				resetTools();
				mc.toolSelectArea	= true;
				mapFactory.setTool('selectArea');
			}else{
				resetTools();
			}
		}
		
		//***********************     LINES / POINTS EVENTS   *******************

		$scope.CancelPointForm	= function(){
			mc.addPointForm			= false;
			mc.toolPointSelected	= false;
			mc.preview				= null;
			mc.point_name			= "";
			mapFactory.setTool(null,false);
			mapFactory.resetAddTools();
		}
		
		$scope.closePointInfo	= function(){
			log("closePointInfo()");
			if($('#pointclickedinfo').length>0){
				$('#pointclickedinfo').collapse('hide');
			}	
			mc.point_coordinates 		= null;
			mc.pointAttributtes			= Array();
			mc.pol_id					= null;	
			mc.pointInfoActive			= false;
			mc.addImage					= false; 
			mc.SinglePointInfo			= false;
			mc.pointsInfo				= false;
			mapFactory.cleanGeometries('selected');
		}
			
		$scope.submitPoint	= function(){
			log("submitPoint()");
			if(mc.addedGeometry!="" && mc.addedGeometry!=null){
				mc.addPointForm					= false;
				mc.toolPointSelected			= false;
				mapFactory.setTool(null,true);
				var mapData						= mapFactory.getMapData();
				var data2send 					= new FormData();
				data2send.append('epsg', 					mapData.epsg);
				data2send.append('tableIdName', 			mc.tableIdName);
				data2send.append('token', 					token);
				data2send.append('layer',					mapFactory.getActiveLayerName());
				data2send.append('what', 					"ADD_GEOMETRY");
				data2send.append("geom", 					mc.addedGeometry);
				if(mc.preview){
					data2send.append('file', 				mc.preview);
				}
				//dynamic attributes
				for (var k in mc.editableAttributes) {
					if (mc.editableAttributes.hasOwnProperty(k)) {
						data2send.append(k, 	mc.editableAttributes[k]);
					}
        		}	
				$http.post(
							baseHref+'ajax.addInfo.php', 
							data2send,
							{
								transformRequest: angular.identity,
								headers: {'Content-Type': undefined
							}
	    				}).success(function (data) {
					log("submitPoint() result:",data);
					if(data.status==="Accepted"){
						mc.addedGeometry	= "";
						mc.point_name		= "";
						added_images		= Array();
						mc.preview 			= null;
						for (var k in mc.editableAttributes) {
						if (mc.editableAttributes.hasOwnProperty(k)) {
							mc.editableAttributes[k] = "";
							}
        				}	
					}else{
						displayMapError({err: "Error requesting submitPoint"});
					}
				}).error(function (error) {
					log("error requesting submitPoint");
					displayMapError({err: "Error requesting submitPoint"});
				});	
			}else{
				log("No point marked in map");
			}	
		}
		
		//map addingpoint activated
		$scope.$on('addingPoint', function(event,data){
			log("on addingPoint",data);
			if(data.adding){
				mc.preview				= null;
				mc.addPointForm			= true;	
			}else{
				mc.addPointForm			= false;
			}
			mc.typeOfAddedElement		= data.type;
			applyChangesToScope();
		});
		
		//writes added geometry
		$scope.$on("notifyGeometry",function (event, data){
			log("on notifyGeometry",data);
			mc.addedGeometry		= data.geometry;
			mc.point_name			= "";
			added_images			= Array();
			applyChangesToScope();
		});
		
		$scope.isNotId				= function(name){
			if(name!=mc.tableIdName){
				return true;
			}
		}
		
		//receives the attributtes from a layer for create the edit/add form
		$scope.$on('layerAttributesReceived', function(event, data) {
			log("layerAttributesReceived",data);
			mc.tableIdName				= data.idField;
			//remove first element in array, should be table Id
			data.fields.shift();
			mc.layerAttributes 			= data.fields;
			mc.canAddPicture			= data.foto_node_id;
			applyChangesToScope();
		});
		
		//****************      END LINE / POINTS EVENTS   ***************
					
		//****************************************************************
		//***********************   END UI LISTENERS    ******************
		//****************************************************************		
		
		//****************************************************************
    	//******************         POINT INFO        *******************
    	//****************************************************************	
		
		//event received when user clicks on map and select tool is selected
		$scope.$on('featureInfoRequested', function(event, data) {
			log("featureInfoRequested",data);
			mc.SinglePointInfo				= false;
			mc.pointsInfo					= false;
			mc.LoadingInfoPoint				= true;
			mc.pointInfoActive				= true;
			applyChangesToScope();
		});
		
		//event received when feature info from clicked point is received and select tool is selected
		$scope.$on('featureInfoReceived', function(event, data) {
			log("featureInfoReceived",data);
			mc.pointPhotos					= Array();
			mc.LoadingInfoPoint				= false;
			if(data.length===1){
				mc.pointInfoActive			= true;
				mc.addImage					= false; 	//by default add image is hidden
				mc.SinglePointInfo			= true;
				mc.pointsInfo				= false;
				mc.point_coordinates 		= data[0].lat+", "+data[0].lon;
				mc.pointAttributtes			= data[0].Attributes;
				mc.pol_id					= data[0].pol_id;
				if($('#pointclickedinfo').length>0){
					$('#pointclickedinfo').collapse('show');
				}
				if(data[0].foto_node_id){
					parsePhotos(data[0].foto_node_id.value);
				}
				if(userCanEditLayer(data[0].layer)){
					mc.canEditAttributes	= true;
					mc.editContainer		= true;
					mc.editBt				= true;
					mc.deleteBt				= true;
					mc.endEditBt			= false;
					mc.noInfoToDisplay		= false;
					mc.addedGeometry		= data[0].geometryWKT;
					if(data[0].foto_node_id){
						mc.addImage			= true;	//if feature has property foto_node_id show add button
						mc.btAddImage		= true;
						mc.uploadingImage	= false;
					}
				}else{
					mc.canEditAttributes	= false;
					mc.editContainer		= false;
					mc.editBt				= false;
					mc.endEditBt			= false;	
					mc.deleteBt				= false;
					mc.noInfoToDisplay			= false;
				}
			}else if(data.length===0){
				log("featureInfoReceived - no feature selected!!");
				//hide buttons, show no info message
				mc.addImage					= false; 
				mc.SinglePointInfo			= false;
				mc.pointsInfo				= false;
				mc.noInfoToDisplay			= true;
				if($('#pointclickedinfo').length>0){
					$('#pointclickedinfo').collapse('show');
				}
			}else{
				log("featureInfoReceived - Multiple point received");
				mc.pointInfoActive			= true;
				mc.SinglePointInfo			= false;
				mc.multiplePointsSelected	= data;
				mc.pointsInfo				= true;
				mc.noInfoToDisplay			= false;
				applyChangesToScope();
			}		
	    });
		
		//event broadcasted from featuresDirectives.js
		$scope.$on('reset-tools', function(event, data) {
			log("reset-tools",data);
			//hide info if is going to add something
			if(data.tool==="point" || data.tool==="MultiLineString" || data.tool==="LineString" || data.tool==="MultiPolygon" || data.tool==="Polygon"){
				mc.SinglePointInfo	= false;
				mc.pointsInfo		= false;
				mc.pointInfoActive	= false;	
			}
		});
		
		//****************************************************************
    	//******************      END POINT INFO       *******************
    	//****************************************************************	
		
		//****************************************************************
    	//******************       EDIT FEAUTURE        ******************
    	//****************************************************************	
		
		$scope.editGeometry		= function(){
			log("editGeometry()");
			mapFactory.editGeometry();
			mc.endEditBt				= true;
			mc.editBt					= false;
			mc.cancelEditBt				= true;
		}
		
		$scope.endEditGeometry		= function(){
			log("endEditGeometry()");
			mc.endEditBt				= false;
			mc.editBt					= true;
			mc.cancelEditBt				= false;
			mapFactory.endEditGeometry();		
			updateField(mc.pol_id,"geom",mc.addedGeometry);
			//draw temporal geometry
			mapFactory.addSocketGeometry(mc.addedGeometry,mapFactory.epsg,mapFactory.getActiveLayerName(),'local');
		}
		
		$scope.cancelEditGeometry	= function(){
			log("cancelEditGeometry()");
			mc.endEditBt				= false;
			mc.cancelEditBt				= false;
			mc.editBt					= true;
			mapFactory.endEditGeometry();			
		}

		//updates one field
		function updateField(id,fieldName,value){
			var data2send 				= new FormData();
			data2send.append('id', 			id);
			data2send.append('layer', 		mapFactory.getActiveLayerName());
			data2send.append('epsg', 		mc.epsg);
			data2send.append('what', 		"UPDATE_FEATURE");
			data2send.append('token', 		token);
			data2send.append('tableIdName', mc.tableIdName);
			data2send.append(fieldName, 	value);
			$http.post(
				baseHref+'ajax.addInfo.php', 
							data2send,
							{
								transformRequest: angular.identity,
								headers: {'Content-Type': undefined
							}
	    				}).success(function (data) {
					log("updateFeature() result:",data);
					if(data.status==="Accepted"){
						
					}else{
						displayMapError({err: "Error requesting updateFeature"});
					}
				}).error(function (error) {
					log("error requesting updateFeature");
					displayMapError({err: "Error requesting updateFeature"});
				});			
		}

		//event broadcasted from featuresDirectives.js
		$scope.$on('updateAttribute', function(event, data) {
			log("updateAttribute",data);
			updateField(mc.pol_id,data.fieldName,data.fieldValue);
		});
		
		//updates all the feature
		$scope.updateFeature		= function(id){
			log("updateFeature("+id+")");	
			mc.endEditBt				= false;
			mc.editBt					= true;
			mapFactory.endEditGeometry();
			var data2send 				= new FormData();
			data2send.append('id', 			id);
			data2send.append('layer', 		mapFactory.getActiveLayerName());
			data2send.append('geom', 		mc.addedGeometry);
			data2send.append('epsg', 		mc.epsg);
			data2send.append('what', 		"UPDATE_FEATURE");
			data2send.append('token', 		token);
			data2send.append('tableIdName', mc.tableIdName);
			if(mc.preview){
				data2send.append('file', 	mc.preview);
			}
			//dynamic attributes
			for (var k in mc.editableAttributes) {
				if (mc.editableAttributes.hasOwnProperty(k)) {
					data2send.append(k, 	mc.editableAttributes[k]);
				}
        	}

			$http.post(
				baseHref+'ajax.addInfo.php', 
							data2send,
							{
								transformRequest: angular.identity,
								headers: {'Content-Type': undefined
							}
	    				}).success(function (data) {
					log("updateFeature() result:",data);
					if(data.status==="Accepted"){
						
					}else{
						displayMapError({err: "Error requesting updateFeature"});
					}
				}).error(function (error) {
					log("error requesting updateFeature");
					displayMapError({err: "Error requesting updateFeature"});
				});			
		}
				
		//****************************************************************
    	//******************      END EDIT FEAUTURE       ****************
    	//****************************************************************
    	
    	//****************************************************************
    	//******************            PHOTOS            ****************
    	//****************************************************************
    	
    	//show picture preview
		$scope.showContent	= function($fileContent){
			fileReader.readAsDataUrl($scope.file, $scope).then(function(result) {
				mc.showPreview 		= true;
				added_images.push(result);
				mc.preview 			= result;
				mc.addImage			= false;
				if(photoMode==="upload"){
					savePicture();
				}
			});
            applyChangesToScope();
		};
		
		//click on camera icon
		$scope.addPicture			= function (mode){
			log("addPicture("+mode+")");
			mc.btAddImage		= false;
			mc.uploadingImage	= true;
			photoMode			= mode;
			$("#takepicture").click();
			
		}
    	
    	//save picture, called by uploader callback
		function savePicture(){
			log("savePicture())");	
			var data2send 				= new FormData();
			data2send.append('id', 			mc.pol_id);
			data2send.append('layer', 		mapFactory.getActiveLayerName());
			data2send.append('what', 		"ADD_IMAGE");
			data2send.append('token', 		token);
			data2send.append('tableIdName', mc.tableIdName);
			if(mc.preview){
				data2send.append('file', 	mc.preview);
			}
			//dynamic attributes
			for (var k in mc.editableAttributes) {
				if (mc.editableAttributes.hasOwnProperty(k)) {
					data2send.append(k, 	mc.editableAttributes[k]);
				}
        	}

			$http.post(
					baseHref+'ajax.addInfo.php', 
							data2send,
							{
								transformRequest: angular.identity,
								headers: {'Content-Type': undefined
							}
	    				}).success(function (data) {
					log("savePicture() result:",data);
					if(data.status==="Accepted"){
						mc.addImage			= true;
						added_images		= Array();
						mc.btAddImage		= true;
						mc.uploadingImage	= false;
						mc.pointPhotos.push(data.message)
					}else{
						displayMapError({err: "Error requesting savePictur"});
					}
				}).error(function (error) {
					log("error requesting savePicture");
					displayMapError({err: "Error requesting savePicture"});
				});		
		}
    	
    	$scope.deleteImg		= function(_id){
	    	log("deleteImg("+_id+")");
	    	var data2send 				= new FormData();
			data2send.append('feature_id', 	mc.pol_id);
	    	data2send.append('img_id', 		_id);
			data2send.append('layer', 		mapFactory.getActiveLayerName());
			data2send.append('what', 		"REMOVE_IMAGE");
			data2send.append('token', 		token);
			data2send.append('tableIdName', mc.tableIdName);
			$http.post(
				baseHref+'ajax.addInfo.php', 
							data2send,
							{
								transformRequest: angular.identity,
								headers: {'Content-Type': undefined
							}
	    				}).success(function (data) {
					log("deleteImg() result:",data);
					if(data.status==="Accepted"){
						removePhotoFromArray(_id);
					}else{
						displayMapError({err: "Error requesting deleteImg"});
					}
				}).error(function (error) {
					log("error requesting deleteImg");
					displayMapError({err: "Error requesting deleteImg"});					
				}
			);    	
    	}
    	
    	function parsePhotos(data){
			log("parsePhotos()",data);
			if(data!="NULL" && data!="{}"){
				//remove { and }, postgres array format :-(
				data 					= data.replace(/[{}]/g,"");
				mc.pointPhotos			= data.split(",");
			}						
		}
		
		function removePhotoFromArray(_id){
			log("removePhotoFromArray("+_id+")");
			var index = mc.pointPhotos.indexOf(_id);
			mc.pointPhotos.splice(index, 1);
		}
    	
    	$scope.showPhoto	= function(src){
	    	log("showPhoto("+src+")");
	    	var modal 			= $('#previewImageModal');
	    	mc.loadingPhoto		= true;
	    	mc.displayPhoto		= false;
	    	//mc.displayPhotoSrc	= null;
	    	$http.get(
				'show.image.php?img='+src, 
							{
								transformRequest: angular.identity,
								headers: {'Content-Type': undefined
							}
	    		}).success(function (data) {
					mc.displayPhotoSrc 	= data;
					mc.displayPhoto		= true;
					mc.loadingPhoto		= false;
					applyChangesToScope();
					if(data.status==="Failed"){
						displayMapError({err: "Error requesting showPhoto"});
					}
				}).error(function (error) {
					log("error in showPhoto",error);
					displayMapError({err: "Error in showPhoto"});
				});	
			modal.modal('show'); 	
			applyChangesToScope();
    	}
    	
    	$scope.closePhoto = function(){
	    	log("closePhoto()");
	    	var modal 			= $('#previewImageModal');
	    	mc.displayPhoto 	= null;
	    	//mc.displayPhotoSrc	= null;
	    	applyChangesToScope();
	    	modal.modal('hide'); 
	    	
    	}
    	//****************************************************************
    	//******************            END PHOTOS        ****************
    	//****************************************************************
    	
    	//****************************************************************
    	//******************        DELETE FEAUTURE       ****************
    	//****************************************************************
    	
    	$scope.showConfirmDeleteModal	= function(){
	    	log("showConfirmDeleteModal()");
	    	$('#confirmDeleteModal').modal();
    	}
    	
		$scope.deleteFeature		= function(id){
			log("deleteFeature("+id+")");
			var data2send 			= new FormData();
			data2send.append('id', 			id);
			data2send.append('layer', 		mapFactory.getActiveLayerName());
			data2send.append('what', 		"REMOVE_FEATURE");
			data2send.append('token', 		token);
			data2send.append('tableIdName', mc.tableIdName);
			$http.post(
					baseHref+'ajax.addInfo.php', 
							data2send,
							{
								transformRequest: angular.identity,
								headers: {'Content-Type': undefined
							}
	    				}).success(function (data) {
					log("deleteFeature() result:",data);
					if(data.status==="Accepted"){
						$('#confirmDeleteModal').modal('hide');
						mapFactory.featureDeleted(mc.addedGeometry);
						mc.pointInfoActive			= false;
						mc.addImage					= false; 
						mc.SinglePointInfo			= false;
						mc.pointsInfo				= false;
						if($('#pointclickedinfo').length>0){
							$('#pointclickedinfo').collapse('hide');
						}
					}else{
						$('#confirmDeleteModal').modal('hide');
						displayMapError({err: "Error requesting deleteFeature"});
					}
				}).error(function (error) {
					log("error requesting deleteFeature");
					displayMapError({err: "Error requesting deleteFeature"});
				});			
		}
		
    	//****************************************************************
    	//******************      END DELETE FEAUTURE       **************
    	//****************************************************************	
    		
		//****************************************************************
		//***********************        HELPERS     *********************
		//****************************************************************

		//map resized event for responsive features
		$scope.$on('mapResized', function(event, data) {
			mapFactory.resize();
	    });	
	    
	    function getLegend(layer_name){
		    if(currentLegendLayer!=layer_name){
			    mc.loadingLegend	= true;
				var legendUrl 		= urlWMS+"?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphics&FORMAT=image%2Fpng&BOXSPACE=1&LAYERSPACE=2&SYMBOLSPACE=1&SYMBOLHEIGHT=2&LAYERFONTSIZE="+legendTextSize+"&ITEMFONTSIZE="+legendTextSize+"&ICONLABELSPACE=2&LAYERTITLE=FALSE&ITEMFONTCOLOR=%23"+legendTextColor+"&SYMBOLSPACE=2&LAYERTITLESPACE=0&TRANSPARENT=true&LAYERS="+layer_name+"&DPI=96";
				currentLegendLayer	= layer_name;
				mc.legend 			= legendUrl;
				mc.showLegend		= true;
				
				if($('#legend').length>0){
					$('#legend').collapse('show');
					$('#menuLegend').removeClass("collapsed");
				}
				log("getLegend: "+legendUrl);
			}
			
		}
	    
	    $scope.toggleLegend		= function(){
		    log("toggleLegend()");
		    if($('#legend').length>0){
			    if($('#legend').is( ":visible" )){
				    $('#legend').collapse('hide');
				    $('#menuLegend').addClass("collapsed");
			    }else{
				    if(mc.legend){
					    $('#legend').collapse('show');
					    $('#menuLegend').removeClass("collapsed");
					}
			    }	
			}    
	    }
	    
	    //getcapabilities readed
	    $scope.$on('capabilities', function(event, data) {
		    log("on capabilities",data);
			mc.wms_title	= data.Service.Name;
			mc.wms_name		= data.Service.Title;
			mc.layers		= data.Capability.Layer.Layer;	
			var mapData		= mapFactory.getMapData();
			mc.epsg			= mapData.epsg;
			mc.extent		= mapData.extent;
	    });		
		
		//log event
		$scope.$on('logEvent', function (event, data){
			if(data.extradata){
				loggerService.log(app_name+" -> "+data.file,data.evt,data.extradata);
			}else{
				loggerService.log(app_name+" -> "+data.file,data.evt);	
			}			
		});
		
		function log(evt,extradata){
			if(extradata){
				loggerService.log(app_name+"-> "+file_name+" v."+version,evt,extradata);
			}else{
				loggerService.log(app_name+"-> "+file_name+" v."+version,evt);	
			}			
		}	
		
		$scope.$on('displayMapError', function(event,data){
			log("on displayMapError",data);
			displayMapError(data);
		});
		
		function displayMapError(data){
			log("displayMapError()",data);
			mc.mapError	= data.err;
			$('#modalError').modal('show');
			applyChangesToScope();
		}
		
		$scope.$on('hideMapError', function(event,data){
			log("on hideMapError",data);
			if(mc.mapError){
				mc.mapError	= false;
			}
		});
	        	
		function resetTools(){
			mc.toolPictureSelected		= false;
			mc.toolPointSelected		= false;
			mc.toolMeasureLineSelected	= false;
			mc.toolMeasureAreaSelected	= false;
			mc.toolSelectArea			= false;
			mapFactory.setTool(null);
		}
		
		function applyChangesToScope(){
			try{
				if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
					$scope.$apply();
				}
			}catch(e){
				console.warn("error in applyChangesToScope() ",e)
			}
		}
		
		//logo setter
		function setLogo(logo){
			log("setLogo("+logo+")");
			mc.mapLogo = logo;
		}
		
		//socket
		$scope.$on('socketStatus', function(event,data){
			log("on socketStatus",data);
			mc.socket_status			= data.status;	
			mc.socket 					= data.status_str;
			mapFactory.setSocket(data.status);
			applyChangesToScope();
		});
		
		$scope.$on('socket_new_geometry', function(event,data){
			log("on socket_new_geometry",data);
			mapFactory.addSocketGeometry(data.geom,data.epsg,data.layer,'socket');
		});
		
		//****************************************************************
		//***********************    END HELPERS     *********************
		//****************************************************************
	}	
})();(function() {
'use strict';
/**
 * Factory for map 
 
 Author: Leandro Lopez-Guerrero Hirsch
 @Leo_lopezg
 Version: 1.0.0
 March 2016 
 
 	******************************************************************************************************
 	
 	Available methods:
 	
 	- init
 		initializes map module
 		
 		@param _env (string) 'env' or 'prod' -> for logging purposes
 		@param_ urlWMS	(string) url for WMS/WFS requests
 		@param _token	(string) token for cross site injection protection
 		@param _project	(object) JSON object with project properties
 		@param _app_name (string) for logging purposes
 		@param _useGeolocation	(boolean)
 		@param _max_feature	(int) max number of return features in multiple selection
 	
 	- resize
 		Updates map size (for responsive methods)
 	
 	- addLayer
 		Add a layer to map (makes WMS request)
 		
 		@param layer_name (string) layer name
 	
 	- getMapData
 		Returns a JSON with map info (epsg,extent,layers,layersVars,activeLayer)
 		
 	- setTool
 		Select tool for map interaction
 		
 		@param tool (string) tool name: point,LineString,Polygon,selectMore,measureLine,selectArea
 		@param option additional parameters for a tool
 		
 	- setActiveLayer
 		Sets active layer
 		
 		@param layer_name (string) layer name
	
	- getActiveLayer
		returns active layer index
	
	- getActiveLayerName
		returns active layer name
		
	- getLayersDisplayed
		returns array with layers displayed in map
		
	- setBackGroundMap	
		Sets background map
		
		@param map (string) check supported background maps. For example: 'google' for Google maps
	
	- setUseGeolocation
		Activates/desactivates geolocation methos
		
		@param what (boolean)
	
	- setMaxFeatures
		Sets  max number of return features in multiple selection
	
		@param number (int)
	
	- setSocket
		Sets websocket connection status
		
		@param status (int)
	
	- getLayerAttributes
		obtains layer availables attributes names
		@param layer (string)
		
	- addSocketGeometry
		Adds a geometry when websocket event is received
		
		@param geom (string) geometry in ol.format.WKT
		@param geomProjection (string)
		@param layer_name (string)
		@param source (string) - 'socket' or 'local'
	
	- featureDeleted
		Event received when a feature is deleted. Renders in map the geometry
		
		@param geom (string) geometry in ol.format.WKT
	
	- cleanGeometries
		Cleans added geometries
		
		@param what (string) what to clean
		
	- resetAddTools
		Calls mapAddTool resetAddTools for cancel adding element
	
	******************************************************************************************************	
	
	Available properties:
	
	- map (ol.Map object)
	- mapSelectTool (select tools module)
	
	******************************************************************************************************
*/

angular.module('app').factory('mapFactory', ['$http','$rootScope','mapMeasureTools','mapSelectTool','mapAddTool', function ($http,$rootScope,mapMeasureTools,mapSelectTool,mapAddTool) {

	if (!ol) return {};
	
	var map,
		env,
		epsg,
		extent,
		urlWMS,
		token,
		project,
		app_name,
		zoom_level,
		raster						= null,		//background raster
		layers						= Array(),
		layersVars					= Array(),
		activeLayer					= null,
		filename 					= "mapFactory.js",
		version						= "1.0.0",
		viewProjection 				= null,
		viewResolution 				= null,
		useGeolocation				= null,
		geolocation					= null,		//geolocation object for tools
		max_features				= null,		//limit of features for queries
		ws_status					= 0,		//websocket connection status
		clickedCooordinates			= null,
		//tools
		toolSelected				= null,		//tool selected
		toolMode					= null,		//tool mode (for measure "line" or "area")
		vectorSource,							//source for temporal geometry
		vectorLayer,							//layer for temporal geometry
		
		//when add geometries to map, add temporal geoms for avoid page reload and animation effect
		addStyle					= null,		//temporal point
		addFeautureForAnimate		= null,		//feauture added, used in animation
		duration 					= 3000,		//animation duration
		start 						= null,		//mark for init animation
		listenerKey					= null,
		notificationEffect			= false,	//flag for displaying effect in added geometry or not
		measureStyle				= null, 	//style for measureTools
		selectStyle					= null,		//style for selectTools
		touchDevice					= 0,		//0 no touch device, 1 touch device (mobiler or tablet)
		capabilities;				//map capabilities
		
	// public API
	var dataFactory 				= {
					    				map: 				map, // ol.Map
					    				mapSelectTool:		mapSelectTool,
					    				epsg:				epsg,
										init: 				init,
										resize: 			resize,
										addLayer:			addLayer,
										getMapData:			getMapData,
										setTool:			setTool,
										setActiveLayer: 	setActiveLayer,
										getActiveLayer:		getActiveLayer,
										getActiveLayerName:	getActiveLayerName,
										getLayersDisplayed:	getLayersDisplayed,
										setBackGroundMap:	setBackGroundMap,
										setUseGeolocation:	setUseGeolocation,
										setMaxFeatures:		setMaxFeatures,
										setSocket:			setSocket,
										addSocketGeometry:	addSocketGeometry,
										featureDeleted:		featureDeleted,
										getLayerAttributes: getLayerAttributes,
										editGeometry:		editGeometry,
										endEditGeometry:	endEditGeometry,
										cleanGeometries:	cleanGeometries,
										resetAddTools:		resetAddTools
						};
						
	return dataFactory;

	//****************************************************************
	//***********************       INIT       ***********************
    //****************************************************************

	function init(_env,_urlWMS,_token,_project,_app_name,_useGeolocation,_max_features,_touchDevice){	
		env				= _env;
		urlWMS			= _urlWMS;
		token			= _token;
		project			= _project;
		app_name		= _app_name;
		useGeolocation	= _useGeolocation;
		max_features	= _max_features;
		touchDevice		= _touchDevice;
		log("init("+_env+","+_urlWMS+","+_token+","+_project+","+_app_name+","+_useGeolocation+","+_max_features+","+_touchDevice+")");
		

		
		//get Capabilities
		var parser = new ol.format.WMSCapabilities();
		log("GetCapabilities(): "+urlWMS+"?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities");
		$http({method: "GET", url: urlWMS+"?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities"})
			.success(function(data){ 			
				try{
					capabilities = parser.read(data);
					renderMap();
				}catch(e){
					alert(project.project_name+" doesn't exists or is not responding in qgis_mapserv.fcgi");
				}
			}
		);
		
		//keyboard events
		document.addEventListener('keydown', function(evt) {
			var e 			= window.event || evt;
			var key 		= e.which || e.keyCode;
			if(18 == key) {
				log("Alt pressed");
				setTool("selectArea");
			}else if(16 == key) {
				log("Shift pressed");
				setTool("selectMore");
			}
		}, false);
		
		document.addEventListener('keyup', function(evt) {
			var e 			= window.event || evt;
			var key 		= e.which || e.keyCode;
			if(18 == key) {
				log("Alt UNpressed");
				setTool(null);
			}else if(16 == key) {
				log("Shift UNpressed");
				setTool(null);
			}
		}, false);
		//end keyboard events
	}
	
	//****************************************************************
	//***********************      END INIT    ***********************
    //****************************************************************
    
    //****************************************************************
	//***********************     RENDER MAP   ***********************
    //****************************************************************
    
	function renderMap(){
		//sets epsg from capabilities or from db
		if(project.use_capabilities){
			epsg			= capabilities.Capability.Layer.BoundingBox[0].crs
			extent    		= capabilities.Capability.Layer.BoundingBox[0].extent;
		}else{
			epsg			= project.epsg;
			extent    		= project.extent;
		}
		
		var projection 		= ol.proj.get(epsg);
		
		//background raster
		raster 				= new ol.layer.Tile({});
		setBackGroundMap(project.background);

		//zomm level
		if(project.zoom_level){
			zoom_level		= parseInt(project.zoom_level);
		}else{
			zoom_level		= 9;
		}
		
		//sets de view
		var view 			= new ol.View({
								projection: projection,
								extent: 	extent,
								center: 	[extent[0], extent[1]],
								zoom: 		zoom_level
							});	
		
		log("Map epsg:",epsg);
		log("Map zoom: "+zoom_level);

		//sets the map
		map 				= new ol.Map({
								target: 'map',
								layers: layers
				        	});

		//adds background raster
		if(raster){
			map.addLayer(raster);
		}
		
	    map.setView(view);
	    //zoom to extent
	    map.getView().fit(extent, map.getSize());
	   
	    //add control zoom to extent
	    var zoomToExtentControl = new ol.control.ZoomToExtent({
        	extent: extent
      	});
	    map.addControl(zoomToExtentControl);
	    
	    //stores projection&resoultion in global vars
	    viewProjection 		= view.getProjection();
		viewResolution 		= view.getResolution();
	    
	    //map rendered, broadcast capabilities
		$rootScope.$broadcast('capabilities',capabilities);	
		
		//markers & temporal geometry
		vectorSource 		= new ol.source.Vector({});
		vectorLayer 		= new ol.layer.Vector({
								source: vectorSource,
								zIndex : 999,
								opacity: 1
							});
							
		map.addLayer(vectorLayer);
		
		//Set styles for overlay geometries
		setStyles(project.geom_colors);	
		vectorLayer.setStyle(selectStyle);
		//listener for animate points
		vectorSource.on('addfeature', function(e) {
			addFeautureForAnimate	= e.feature
			flash(addFeautureForAnimate);
		});
		
		//define project projection in proj4
		proj4.defs("EPSG:25831","+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
		
		if(useGeolocation===1){
			// create a Geolocation object setup to track the position of the device
			geolocation = new ol.Geolocation({
				tracking: true,
				projection: epsg
			});
		}
		//******* TOOLS initialization
		//measure
		mapMeasureTools.init(map,epsg,viewProjection,vectorSource,vectorLayer,token,app_name,project.geom_colors,touchDevice);
		//select
		mapSelectTool.init(map,epsg,viewProjection,viewResolution,vectorSource,token,app_name,urlWMS,max_features,project.geom_colors);
		//add
		mapAddTool.init(map,epsg,viewProjection,viewResolution,vectorSource,token,app_name,urlWMS,project.geom_colors);
		
		//click event
		map.on('click', function(evt) {
			clickedCooordinates		= evt.coordinate;
			log("click coordinates: "+evt.coordinate);
			log("toolSelected: "+toolSelected)
			//if toolSelected adds point
			if(toolSelected==="point"){
				mapAddTool.addPoint(evt.coordinate);
				
			}else if(toolSelected==="LineString" || toolSelected==="MultiLineString"){
				 mapAddTool.initLine(toolSelected);
			}else if(toolSelected==="Polygon" || toolSelected==="MultiPolygon"){
				 mapAddTool.initPolygon(toolSelected);	 
			}else if(toolSelected==="measureLine" || toolSelected==="measureArea"){
				mapMeasureTools.initMeasure(toolMode);	
				vectorLayer.setStyle(measureStyle);
			}else{
				mapSelectTool.selectPoint(clickedCooordinates,getMapData());
			}				
		});	

	}
	
	//****************************************************************
	//***********************  END RENDER MAP  ***********************
    //****************************************************************
    
	//****************************************************************
	//***********************     ADD LAYER    ***********************
    //****************************************************************
    
	function addLayer(layer_name){
		log("addLayer("+layer_name+")");
		if(layers.indexOf(layer_name)===-1){
			layers.push(layer_name);
			var source 	= new ol.source.TileWMS({
			    					url: 	urlWMS,
			    					params: {
				    							'LAYERS': layer_name
				    						}
	                    			});
	                    			
			var lay		= new ol.layer.Tile({
		    						extent: extent,
									name: layer_name,
									source: source
	                	});     
	        map.addLayer(lay);
	        layersVars.push(lay) 
		}else{
			var index = layers.indexOf(layer_name);
			map.removeLayer(layersVars[index]);
			layersVars.splice(layers.indexOf(layer_name), 1);
			layers.splice(layers.indexOf(layer_name), 1);
			setActiveLayer(false);
		}
		
		//set active layer
		if(layers.length===1){
			setActiveLayer(layers[0])
		}	
		
	}
	
	function getLayerAttributes(layer){
		log("getLayerAttributes("+layer+")");
		try{
			var url		= urlWMS+"?SERVICE=WFS&VERSION=1.0.0&REQUEST=describeFeatureType&typename="+layer;
			log("url",url);
			$.get(url, function(response, status){
				var json = xml2json(response); 
				log("getLayerAttributes("+layer+")",json);
				var attributtes 	= json.schema.complexType.complexContent.extension.sequence.element;
				//if has photos
				var foto_node_id	= false;
				//log("getLayerAttributes("+layer+") - attributes: ",attributtes);
				var retorn 			= Array();
				var idField			= null;
				for(var i=0; i<attributtes.length;i++){
					if(attributtes[i].name==="id" || attributtes[i].name==="arc_id" || attributtes[i].name==="pol_id"){
						idField			= attributtes[i].name;
					}
					if(attributtes[i].name!="foto_node_id"){
						retorn.push(attributtes[i].name);
					}
					if(attributtes[i].name==="foto_node_id"){
						foto_node_id	= true;
					}
				}
				$rootScope.$broadcast('layerAttributesReceived',{"fields":retorn,"idField":idField,"foto_node_id":foto_node_id});	
			});
		}catch(e){
			log("error in getLayerAttributes("+layer+")")
			$rootScope.$broadcast('displayMapError',{err: "error in getLayerAttributes("+layer+")"});
		}
	}
	
	function setActiveLayer(layer_name){
		log("setActiveLayer("+layer_name+")");
		//select first layer of array, if is available in case we remove activeLayer
		if(layers.indexOf(layer_name)===-1){
			if(layers.length>0){
				activeLayer	= layers[0];
				$rootScope.$broadcast('hideMapError',{err: "No error"});
			}else{
				activeLayer	= null;
				$rootScope.$broadcast('notifyNoActiveLayer',{});
			}
		}else{
			activeLayer = layers.indexOf(layer_name);	
			$rootScope.$broadcast('hideMapError',{err: "No error"});
		}	
		if(activeLayer!=null){
			$rootScope.$broadcast('notifyActiveLayer',{});

		}
		
		mapSelectTool.clearHighlight();
	}
	
	function getLayersDisplayed(){
		log("getLayersDisplayed: ",layers);
		return layers;
	}
	
	function getActiveLayer(){
		log("getActiveLayer: "+activeLayer);
		return activeLayer;
	}
	
	function getActiveLayerName(){
		log("getActiveLayerName: "+layers[activeLayer]);
		return layers[activeLayer];
	}
	//****************************************************************
	//***********************   END  ADD LAYER ***********************
    //****************************************************************
	
	//****************************************************************
	//***********************     BACKGROUND   ***********************
    //****************************************************************
										
	function setBackGroundMap(map){
		if(map==="OSM"){
			var source = new ol.source.OSM();
		}else if(map==="CartoDBDark"){
			var source = new ol.source.XYZ({url:'http://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'});			
		}else if(map==="CartoDBLight"){
			var source = new ol.source.XYZ({url:'http://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'});	
		}else if(map==="mtc5m" || map==="mtc10m" || map==="orto25c" || map==="mtc25m" || map==="mtc50m" || map==="mtc250m" || map==="mtc500m" || map==="mtc1000m" || map==="orto10c" || map==="orto25c" || map==="orto5m" || map==="orto25m" || map==="ortoi25c" || map==="ortoi5m" || map==="ortoi25m" || map==="sat250m"){
			var source = new ol.source.TileWMS({url:'http://geoserveis.icc.cat/icc_mapesbase/wms/service?layers='+map+'&srs='+epsg});	
		}else if(map==="google"){
			var  source = new ol.source.OSM({
				            url: 'http://mt{0-3}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
							attributions: [
								new ol.Attribution({ html: '© Google' }),
								new ol.Attribution({ html: '<a href="https://developers.google.com/maps/terms">Terms of Use.</a>' })
							]
        				})
		}else if(map==="none"){
			var source = null;
		}

		raster.setSource(source);		
	}

	//****************************************************************
	//***********************    END BACKGROUND  *********************
    //****************************************************************
			
	//****************************************************************
	//***********************    ADD GEOMETRY   **********************
    //****************************************************************
		
	/* adds temporal geometry to map
	we do this when a user adds a point, line or polygon to db for avoid page reload
	also when socket notifes new geom add
	Params: geometry: ol.geom.*
	Source: 'socket' or 'local'
	*/
	
	function addTemporalGeometry(geometry,source){
		log("addTemporalGeometry("+geometry+","+source+")",geometry);
		notificationEffect	= true;
		var iconFeature 	= new ol.Feature({
        								geometry: geometry 
								});
		var geomType		= iconFeature.getGeometry().getType();
		iconFeature.setStyle(addStyle);
		vectorSource.addFeature(iconFeature);
	}

	//receives geometry from websocket
    function addSocketGeometry(geom,geomProjection,layer_name,source){
	    log("addSocketGeometry("+geom+","+geomProjection+","+layer_name+","+source+")");
	    if(layers.indexOf(layer_name)!=-1){
		    var format			= new ol.format.WKT({});
			var rawGeometry		= format.readGeometry(
										geom,
										{
											dataProjection: geomProjection,
											featureProjection: epsg
										}
									);
		    addTemporalGeometry(rawGeometry,source);
	    }
	}
	
	//animate new added features
	function flash(feature) {
		if(notificationEffect){
			notificationEffect	= false;
			duration 			= 3000;
			start 				= new Date().getTime();	
			listenerKey = map.on('postcompose', animate);
		}
	}
	
	function animate(event) {
		
		var vectorContext 	= event.vectorContext;
		var frameState 		= event.frameState;
		var flashGeom 		= addFeautureForAnimate.getGeometry().clone();
		var elapsed 		= frameState.time - start;
		var elapsedRatio 	= elapsed / duration;
		// radius will be 5 at start and 30 at end.
		var radius 			= ol.easing.easeOut(elapsedRatio) * 25 + 5;
		var opacity 		= ol.easing.easeOut(1 - elapsedRatio);

		var flashStyle 		= new ol.style.Circle({
								radius: radius,
								snapToPixel: false,
								stroke: new ol.style.Stroke({
									color: 'rgba(255, 0, 0, ' + opacity + ')',
									width: 1,
									opacity: opacity
								})
							});

		vectorContext.setImageStyle(flashStyle);
		vectorContext.drawPointGeometry(flashGeom, null);
		if (elapsed > duration) {
			ol.Observable.unByKey(listenerKey);
			return;
		}
		// tell OL3 to continue postcompose animation
		frameState.animate = true;
	}
			
	//****************************************************************
	//***********************  END ADD GEOMETRY   ********************
    //****************************************************************
 
 	//****************************************************************
	//***********************    EDIT GEOMETRY    ********************
    //****************************************************************  
     
	function editGeometry(){
		log("editGeometry()");
		mapAddTool.editGeometry(mapSelectTool.getSelectedFeauture());
	}
	
	function endEditGeometry(){
		log("endEditGeometry()");
		mapAddTool.endEditGeometry();
		mapSelectTool.clearHighlight();
		//mapSelectTool.highLightGeometry(selectedFeature)
		mapSelectTool.selectPoint(clickedCooordinates,getMapData());
	}
	
	//****************************************************************
	//***********************  END EDIT GEOMETRY    ******************
    //****************************************************************  
	
	function featureDeleted(geometry){
		log("featureDeleted()",geometry);
		mapSelectTool.clearHighlight();
		var format			= new ol.format.WKT({});
		var geometryData	= format.readGeometry(
														geometry,
															{
																dataProjection: epsg,
																featureProjection: epsg
															}
														);
   
		var _myStroke = new ol.style.Stroke({
							color : 'rgba(230, 0, 0, 1)',
							width : 2 
						});
			
		var _myFill = new ol.style.Fill({
							color: 'rgba(230, 0, 0, 1)'
						});
			
		var myStyle = new ol.style.Style({
							stroke : _myStroke,
							fill : _myFill
						});
		//************** Highlight selected polygon
		var feature = new ol.Feature({geometry: geometryData});

		feature.setStyle(myStyle);
		vectorSource.addFeature(feature);
	}
	
	//****************************************************************
	//***********************        TOOLS        ********************
    //****************************************************************

	//selects the tool for map edition
	function setTool(tool,option){	
		log("setTool("+tool+","+option+")");
		if(toolSelected==="point" && tool===null){
			//if option, point submitted to database
			if(option){
				var geom = mapAddTool.fixPoint();
				if(ws_status===0){
					addTemporalGeometry(geom,'local');
				} 
            }else{
	            mapAddTool.resetAddTools();
            }
        }else if((toolSelected==="LineString" || toolSelected==="MultiLineString") && tool===null){   
	        var geom = mapAddTool.fixGeometry();
	        if(ws_status===0){
				addTemporalGeometry(geom,'local');
			}  
        }else if((toolSelected==="Polygon" || toolSelected==="MultiPolygon") && tool===null){    
	        var geom = mapAddTool.fixGeometry()
            if(ws_status===0){
				addTemporalGeometry(geom,'local');
			} 
        }else if(toolSelected==="selectMore" && tool===null){
			mapSelectTool.setMultiple(false);
		}else if(toolSelected==="measureLine" || toolSelected==="measureArea"){
			mapMeasureTools.endMeasure();
		}else if(toolSelected==="selectArea" && tool===null){
			var dragPan = new ol.interaction.DragPan({kinetic: false});
            map.addInteraction(dragPan);
            mapSelectTool.removeSelectArea();
		}

		if(layersVars.length>0){
			if(tool==="selectArea"){
				mapSelectTool.selectArea(getMapData());
			}else if(tool==="selectMore"){
				mapSelectTool.setMultiple(true);
			}else if(tool==="point"){
				if(useGeolocation===1){
					mapAddTool.addPoint(geolocation.getPosition());
				}
			}else if(tool==="LineString" || tool==="MultiLineString" || tool==="Polygon"){
				mapAddTool.resetAddTools();
			}
		}else{
			tool = null;
			//$rootScope.$broadcast('displayMapError',{err: "You must select a layer"});
		}
		toolSelected	= tool;
		toolMode		= option;		//set toolMode if is defined
		$rootScope.$broadcast('reset-tools',{tool:toolSelected});	
	}
	//****************************************************************
	//***********************      END TOOLS      ********************
    //****************************************************************
	
	//****************************************************************
	//***********************      HELPERS      **********************
    //****************************************************************
	
	//gets map info for displaying it	
	function getMapData(){
		var mapData				= {}
		mapData.epsg			= epsg;
		mapData.extent			= extent;
		mapData.layers			= layers;
		mapData.layersVars		= layersVars;
		mapData.activeLayer		= activeLayer;
		return mapData;
	}
	 
	//activate/desactivate geolocation
	function setUseGeolocation(what){
		log("setUseGeolocation("+what+")");
		useGeolocation 	= what;
		if(geolocation===null){
			// create a Geolocation object setup to track the position of the device
			geolocation = new ol.Geolocation({
				tracking: true,
				projection: epsg
			});
		}
	}
	
	//sets maxinum selectable number of features
	function setMaxFeatures(number){
		log("setMaxFeatures("+number+")");
		if(!isNaN(number)){
			max_features = number;
			mapSelectTool.setMaxFeatures(max_features);
		}
	}
	
	//sets websocket connection status
	function setSocket(status){
		log("setSocket("+status+")");
		ws_status	= status;
	}
	
	function resize(){
		log("resize()");
		if(map){
			map.updateSize();
		}
	}
	
	function cleanGeometries(what){
		log("cleanGeometries("+what+")");
		if(what==="all"){
			vectorSource.clear();
			mapSelectTool.clearHighlight();
			map.getOverlays().forEach(function (lyr) {
				map.removeOverlay(lyr);
			});
		}else if(what==="selected"){
			mapSelectTool.clearHighlight();
		}
		
	}
	
	function resetAddTools(){
		mapAddTool.resetAddTools();
	}
	
	//fix styles for geometric overlays
	function setStyles(geom_colors){
		log("setStyles()",geom_colors);
		measureStyle		= new ol.style.Style({
										fill: new ol.style.Fill({
												color: geom_colors.measure_fill_color
										}),
										stroke: new ol.style.Stroke({
												color: geom_colors.measure_stroke_color,
												lineDash: [10, 10],
												width: 2
											})
							});

		selectStyle			= new ol.style.Style({
										fill: new ol.style.Fill({
												color: geom_colors.select_stroke_color,
												width: 2
										}),
										stroke: new ol.style.Stroke({
												color: geom_colors.select_fill_color
										})						
							});
				
		addStyle			= new ol.style.Style({
												fill: new ol.style.Fill({
													color: geom_colors.edit_fill_color
												}),
												stroke: new ol.style.Stroke({
													color: geom_colors.edit_stroke_color,
													//lineDash: [10, 10],
													width: 2
												}),
												image: new ol.style.Icon(({
													anchor: [0.5, 0.5],
													anchorXUnits: 'fraction',
													anchorYUnits: 'pixels',
													opacity: 1,
													src: 'tpl/default/img/point.png'
												}))				
    						});
	}
	
	//log function
	function log(evt,data){
		$rootScope.$broadcast('logEvent',{evt:evt,extradata:data,file:filename+" v."+version});
	}
		
	//****************************************************************
	//***********************    END HELPERS    **********************
    //****************************************************************
}])
})();(function() {
'use strict';
/**
 * Factory measure tools for map 
 
 Author: Leandro Lopez-Guerrero Hirsch
 @Leo_lopezg
 
 Jan/Feb 2016 
*/

angular.module('app').factory('mapMeasureTools', ['$http','$rootScope', function ($http,$rootScope) {
//function mapService($http,$rootScope){
	if (!ol) return {};
	
	var filename 				= "mapMeasureTool.js",
		app_name				= null,
		viewProjection 			= null,
		map 					= null,
		epsg					= null,
		//tools
		vectorSource,
		vectorLayer,
		draw,					//draw interaction
		drawStyle,
		sketch,					//draw feature for measuring
		pointerMoveListener,	//listener pointer move
		helpTooltipElement,		//The help tooltip element
		helpTooltip,			//Overlay to show the help messages
		measureTooltipElement,	//The measure tooltip element
		measureTooltip,			//Overlay to show the measurement,
		continuePolygonMsg		= "Click  continue drawing the polygon",		//Message to show when a user is drawing a polygon
		continueLineMsg			= 'Click to continue drawing the line',			//Message to show when the user is drawing a line.
		initialMsg 				= 'Click to start drawing',
		helpMsg,
		//continuePolygonMsg	= 'Click to continue drawing the polygon'			//Message to show when the user is drawing a polygon.
		isMeasuring				= false,	//flag for know if is measuring or not
		drawStartEvent			= null,
		drawEndEvent			= null,
		geom_colors				= null,
		touchDevice				= 0,
		token					= null;

	// public API
	var dataFactory 				= {
										init: 				init,
										initMeasure:		initMeasure,
										endMeasure:			endMeasure
									
						};
	return dataFactory;

	//****************************************************************
	//***********************       INIT       ***********************
    //****************************************************************

	function init(_map,_epsg,_viewProjection,_vectorSource,_vectorLayer,_token,_app_name,_geom_colors,_touchDevice){	
		map					= _map;
		viewProjection		= _viewProjection;
		token				= _token;
		vectorSource		= _vectorSource;
		vectorLayer			= _vectorLayer;
		app_name			= _app_name;
		epsg				= epsg;
		geom_colors			= _geom_colors;
		touchDevice			= _touchDevice;
		continuePolygonMsg	= $('#STR_CLICK_TO_CONTINUE_DRAWING_POLYGON').val();
		continueLineMsg		= $('#STR_CLICK_TO_CONTINUE_DRAWING_LINE').val();
		initialMsg			= $('#STR_CLICK_TO_START_DRAWING').val();
		helpMsg				= initialMsg;
		drawStyle			= new ol.style.Style({
											fill: new ol.style.Fill({
													color: geom_colors.measure_fill_color
											}),
											stroke: new ol.style.Stroke({
													color: geom_colors.measure_stroke_color,
													lineDash: [10, 10],
													width: 2
												})
    						});
	}
	
	//****************************************************************
	//***********************      END INIT    ***********************
    //****************************************************************

    function initMeasure(mode){
	    log("initMeasure("+mode+") - isMeasuring: "+isMeasuring);

	    if(!isMeasuring){
		    
		    if(touchDevice===1){
			    //register event pointer move if is mobile	
				pointerMoveListener 	= map.on('click', pointerMoveHandler);
		    }else{
			    //register event pointer move if is desktop
			   pointerMoveListener 	= map.on('pointermove', pointerMoveHandler); 
		    }
			addInteraction(mode);
			isMeasuring	= true;
		}

    }

    function endMeasure(){
	    log("endMeasure()");
	    map.unByKey(pointerMoveListener);
	    if(drawStartEvent){
	    	draw.unByKey(drawStartEvent);
	    }
	    if(draw){
	    	map.removeInteraction(draw);
	    }

	    map.removeOverlay(measureTooltipElement);
	    map.removeOverlay(helpTooltipElement);
		sketch					= null;
		drawStartEvent			= null;
		drawEndEvent			= null;
	    isMeasuring 			= false;
	    draw					= null;
	    pointerMoveListener		= null; 
		if (measureTooltipElement) {
	    	measureTooltipElement.parentNode.removeChild(measureTooltipElement);
		}
		if (helpTooltipElement) {
    		helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    	}	
	    helpTooltipElement		= null;
	    measureTooltipElement	= null;
    }
    
    //****************************************************************
	//***********************   	 MEASURE        ******************
    //****************************************************************	  
    
	/**
	 * Handle pointer move.
	 * @param {ol.MapBrowserEvent} evt
	 */
	function pointerMoveHandler(evt) {
		//log("pointerMoveHandler",evt);
		if (evt.dragging) {
	    	return;
	    }
	   
	    var tooltipCoord 	= evt.coordinate;
	    if (sketch) {
	    	var output;
			var geom 		= (sketch.getGeometry());
			if (geom instanceof ol.geom.Polygon) {
				output 			= formatArea((geom));			// @type {ol.geom.Polygon}
				helpMsg 		= continuePolygonMsg;
				tooltipCoord 	= geom.getInteriorPoint().getCoordinates();
	    	} else if (geom instanceof ol.geom.LineString) {
		    	output 			= formatLength((geom));			// @type {ol.geom.LineString} 
				helpMsg 		= continueLineMsg;
				tooltipCoord 	= geom.getLastCoordinate();
			}
			measureTooltipElement.innerHTML = output;
			measureTooltip.setPosition(tooltipCoord);
	    }
	    
		helpTooltipElement.innerHTML = helpMsg;
		helpTooltip.setPosition(evt.coordinate);
	};
    
    function addInteraction(type) {
		draw 		= new ol.interaction.Draw({
											source: vectorSource,
											type: /** @type {ol.geom.GeometryType} */ (type),
											style: drawStyle
					});
		
	    map.addInteraction(draw);
		createMeasureTooltip();
		createHelpTooltip();
		
		drawStartEvent	= draw.on('drawstart',function(evt) {
			log('drawstart')
	        // set sketch
	        sketch = evt.feature;
	    }, this);
	    
	    drawEndEvent = draw.on('drawend',function(evt) {
		    	log('drawend');
	        	measureTooltipElement.className = 'tooltipbase tooltip-static';
				measureTooltip.setOffset([0, -7]);
				//unset sketch
				sketch 							= null;
				// unset tooltip so that a new one can be created
				if (helpTooltipElement) {
					map.removeOverlay(helpTooltipElement);	
					helpTooltipElement.parentNode.removeChild(helpTooltipElement);
					helpTooltipElement = null;
					helpMsg				= initialMsg;
    			}
				map.unByKey(pointerMoveListener);
			    if(drawStartEvent){
			    	draw.unByKey(drawStartEvent);
			    } 
			    if(drawEndEvent){
			    	draw.unByKey(drawEndEvent);
			    } 
			    map.removeInteraction(draw);
				isMeasuring	= false; 		
			}, this);	
	}
    
    
    /**
	* format length output
	* @param {ol.geom.LineString} line
	* @return {string}
	*/
	function formatLength(line) {		
		var length = Math.round(line.getLength() * 100) / 100;
		var output;
		if (length > 100) {
			output = (Math.round(length / 1000 * 100) / 100) +' ' + 'km';
		} else {
			output = (Math.round(length * 100) / 100) +' ' + 'm';
		}
		return output;
	};
    
    /**
		* format length output
		* @param {ol.geom.Polygon} polygon
		* @return {string}
	*/
	function formatArea(polygon) {
		var area 				= polygon.getArea();
		var output;
		if (area > 10000) {
			output 				= (Math.round(area / 1000000 * 100) / 100) + ' ' + 'km<sup>2</sup>';
		} else {
			output 				= (Math.round(area * 100) / 100) + ' ' + 'm<sup>2</sup>';
		}
		return output;
	};
	
    //****************************************************************
	//***********************      END MEASURE      ******************
    //****************************************************************	
		
	//****************************************************************
	//***********************      HELPERS      **********************
    //****************************************************************
    
	//log function
	function log(evt,data){
		$rootScope.$broadcast('logEvent',{evt:evt,extradata:data,file:filename});
	}	
	
	/**
	* Creates a new help tooltip
	*/
	
	function createHelpTooltip() {
		if (!helpTooltipElement) {
    		//helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    	}
    	helpTooltipElement 				= document.createElement('div');
    	helpTooltipElement.className 	= 'tooltipbase';
		helpTooltip 					= new ol.Overlay({
											element: helpTooltipElement,
											offset: [15, 0],
											positioning: 'center-left'
										});
		map.addOverlay(helpTooltip);
	}

	/**
	 * Creates a new measure tooltip
	 */
	 
	function createMeasureTooltip() {
		if (measureTooltipElement) {
	    	map.removeOverlay(helpTooltipElement);
		}
		measureTooltipElement 			= document.createElement('div');
		measureTooltipElement.className = 'tooltipbase tooltip-measure';
		measureTooltip 					= new ol.Overlay({
										    element: measureTooltipElement,
											offset: [0, -15],
											positioning: 'bottom-center'
										});
		
		map.addOverlay(measureTooltip);
	}
		
	//****************************************************************
	//***********************    END HELPERS    **********************
    //****************************************************************
}])

})();
(function() {
'use strict';
/**
 * Factory, select tools for map 
 
 Author: Leandro Lopez-Guerrero Hirsch
 @Leo_lopezg
 
 Jan/Feb 2016 
*/

angular.module('app').factory('mapSelectTool', ['$http','$rootScope', function ($http,$rootScope) {
//function mapService($http,$rootScope){
	if (!ol) return {};
	
	var filename 				= "mapSelectTool.js",
		app_name				= null,
		viewProjection 			= null,
		viewResolution			= null,
		vectorSource			= null,
		map 					= null,
		epsg					= null,
		canAddPoint				= true,
		dragBox					= null,  	//drag box for select area
		urlWMS					= null,
		vectorSourceForPoints	= null,
		vectorLayerForPoints	= null,
		pointCoordinates		= null,
		highLightLayer			= null,		//layer for highlighted town
		highLightSource			= null,		//source for highlifgted polygon
		multipleSelection		= null,
		highlightedLayers		= Array(),
		selectedFeatures		= Array(),	//array with selected features info
		max_features			= null,		//limit of features for queries
		token					= null,
		geom_colors				= {},		//object with color customization for select/edit geometries
		selectedFeauture		= null;		//selected feauture for edit/delete methods
	// public API
	var dataFactory 				= {
										init: 					init,
										selectPoint:			selectPoint,
										selectArea:				selectArea,
										removeSelectArea:		removeSelectArea,
										setMultiple:			setMultiple,
										highLightGeometry:		highLightGeometry,
										clearHighlight:			clearHighlight,
										setMaxFeatures:			setMaxFeatures,
										getSelectedFeauture: 	getSelectedFeauture		
						};
	return dataFactory;

	//****************************************************************
	//***********************       INIT       ***********************
    //****************************************************************

	function init(_map,_epsg,_viewProjection,_viewResolution,_vectorSource,_token,_app_name,_urlWMS,_max_features,_geom_colors){	
		map				= _map;
		epsg			= _epsg;
		viewProjection	= _viewProjection;
		viewResolution	= _viewResolution;
		vectorSource	= _vectorSource;
		token			= _token;
		app_name		= _app_name;
		urlWMS			= _urlWMS;
		max_features	= _max_features;
		geom_colors		= _geom_colors;
						
		log("init("+_map+","+_epsg+","+_token+","+_app_name+","+_geom_colors+")");
		
		vectorSourceForPoints 	= new ol.source.Vector({});
		vectorLayerForPoints 	= new ol.layer.Vector({
												source: vectorSourceForPoints
								});	
														
		map.addLayer(vectorLayerForPoints);	

		
		highLightSource = new ol.source.Vector();
		highLightLayer = new ol.layer.Vector({source: highLightSource,zIndex : 999});
		// Add the vector layer to the map.
		map.addLayer(highLightLayer);
	}
	
	//****************************************************************
	//***********************      END INIT    ***********************
    //****************************************************************
  
    //****************************************************************
	//***********************    SELECT AREA    **********************
    //****************************************************************
    
	function selectArea(mapData){
		log("selectArea()",mapData);

		if(mapData.layersVars.length>0){
			
			var dragPan;
			map.getInteractions().forEach(function(interaction) {
				if (interaction instanceof ol.interaction.DragPan) {
					dragPan = interaction;
				}
			}, this);
			if (dragPan) {
				map.removeInteraction(dragPan);
			}	
			
			
			dragBox 	= new ol.interaction.DragBox({
									//condition: ol.events.condition.shiftKeyOnly,
									style: new ol.style.Style({
										stroke: new ol.style.Stroke({
												color: [0, 0, 255, 1]
												})
									})
						});
	
			map.addInteraction(dragBox);
	
			dragBox.on('boxend', function(e) {
				$rootScope.$broadcast('featureInfoRequested',{});
				var dragBoxExtent 	= dragBox.getGeometry().getExtent();
				var etrs89_31N		= new ol.proj.Projection({
										code: 'EPSG:25831',
										extent: dragBoxExtent,
										units: 'm'
									});
				ol.proj.addProjection(etrs89_31N);
				log("selectArea Extent:",dragBoxExtent)
				log("MAP EPSG:",epsg)
				var extent = ol.proj.transformExtent(dragBoxExtent, epsg, 'EPSG:25831');
				log("selectArea Extent transformed:",extent);						
				var url		= urlWMS+"?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&typeName="+mapData.layers[mapData.activeLayer]+"&bbox="+ extent.join(',') + "&outputFormat=GeoJSON&maxFeatures="+max_features;
				log("url",url);

		
				$.get(url, function(response, status){
					//clean anti slash
					response 	= response.replace(/[/\\*]/g, "|");
					response	= JSON.parse(response);
					log("geoJSON",response);
					selectedFeatures	= Array();
					clearHighlight();
					multipleSelection	= true;
		
					var geojsonFormat = new ol.format.GeoJSON();
					var newFeatures = geojsonFormat.readFeatures(response);
					
					log("WFS features",newFeatures)
					for(var i=0;i<newFeatures.length;i++){
						log("Feature",response.features[i]);
						var returnData			= {}
						returnData.Attributes	= false;
						if(typeof response.features[i].geometry!== 'undefined'){
							if(typeof response.features[i].properties!== 'undefined'){
								var output 		= Array();
								for (var key in response.features[i].properties) {
									// must create a temp object to set the key using a variable
									var tempObj 	= {};
									tempObj.name 	= key;
									tempObj.value 	= response.features[i].properties[key];
									output.push(tempObj);
								}

							returnData.Attributes		= output;

							var pol_id					= response.features[i].id;
							var item = {
												"pol_id"		: pol_id,
												"Attributes"	: returnData.Attributes,
												"lat"			: extent[0],
												"lon"			: extent[1]
							}
							selectedFeatures.push(item);
							//log("Feature: ",item);

							
							//generate geometry 
							try{
								var format			= new ol.format.WKT({});
								var raw_geometry	= format.writeGeometry(
														newFeatures[i].getGeometry()
													);
								var geom2Hightlight	= format.readGeometry(
														raw_geometry,
															{
																dataProjection: 'EPSG:25831',
																featureProjection: epsg
															}
														);
								highLightGeometry(geom2Hightlight);
							}catch(e){
								log("Couldn't find geometry in feature attributes");  
							}
						}}	
					}
					
					$rootScope.$broadcast('featureInfoReceived',selectedFeatures);
					multipleSelection	= false;			
					map.getView().fit(dragBoxExtent, map.getSize());	
				});
			
			});
	
			// clear selection when drawing a new box and when clicking on the map
			dragBox.on('boxstart', function(e) {
				clearHighlight();
			});
			
		}else{
			log("selectArea no layer rendered");
	        $rootScope.$broadcast('displayMapError',{err: "You must select a layer"});
	        multipleSelection	= false;
		}
	}	
	
	function removeSelectArea(){
		log("removeSelectArea()");
		var box;
		map.getInteractions().forEach(function(interaction) {
			if (interaction instanceof ol.interaction.DragBox) {
				box = interaction;
			}
		}, this);
		if (box) {
			map.removeInteraction(box);
		}
	}

    //****************************************************************
	//*********************** END SELECT AREA    *********************
    //****************************************************************

	//****************************************************************
	//***********************   SELECT POINT    **********************
    //****************************************************************
    
	function selectPoint(coordinates,mapData){
		log("selectPoint() multipleSelection: "+multipleSelection,coordinates);
		
		if(!multipleSelection){
			clearHighlight();
		}
		if(mapData.layersVars.length>0){
			$rootScope.$broadcast('featureInfoRequested',{});
		    var selectableLayer = mapData.layersVars[mapData.activeLayer];
			var url = selectableLayer.getSource().getGetFeatureInfoUrl(
											coordinates, viewResolution, viewProjection,
											{'INFO_FORMAT': 'text/xml'}
			);

			if (url) {
			   log("url",url);
			    var parser = new ol.format.GeoJSON();
			    $http.get(url).success(function(response){
				    //log("raw xml",response);
				    var json = xml2json(response); 
					log("xml2json",json); 
		
				    //Broadcast event for data rendering
				    var returnData			= {}
					returnData.Attributes	= false;

				    if(typeof json.GetFeatureInfoResponse!== 'undefined'){
					    if(typeof json.GetFeatureInfoResponse.Layer.Feature != 'undefined'){
						    if(typeof json.GetFeatureInfoResponse.Layer.Feature.Attribute != 'undefined'){
							    returnData.Attributes		= json.GetFeatureInfoResponse.Layer.Feature.Attribute;
						
								var pol_id					= returnData.Attributes[0].value;
							    var featureAlreadySelected	= featureIsSelected(pol_id);

								//if is not selected, add the feature to array and map
								if(featureAlreadySelected===-1){
									
									var item = {
													"pol_id"		: pol_id,
													"Attributes"	: returnData.Attributes,
													"lat"			: coordinates[0],
													"lon"			: coordinates[1],
													"layer"			: json.GetFeatureInfoResponse.Layer.name,
													"foto_node_id"	: null			
									}
									//If exists add foto_node_id (object with features photos)
									var foto_node_id	= findByName(returnData.Attributes, "foto_node_id");	
									if(typeof foto_node_id != 'undefined'){
										item.foto_node_id = foto_node_id;
									}
									
								    try{
									    var raw_geometry 	= findByName(returnData.Attributes, "geometry")
										//generate geometry 
									    var format			= new ol.format.WKT({});
									    var geom2Hightlight	= format.readGeometry(
											raw_geometry.value,
											{
												dataProjection: 	epsg,
												featureProjection: 	epsg
											}
										);
										item.geometryWKT 		= raw_geometry.value;
										
									    highLightGeometry(geom2Hightlight);
								    }catch(e){
									  log("Couldn't find geometry in feature attributes");  
								    }
								    selectedFeatures.push(item);
							    }else{
								    //if is already selected, remove it
								    if(multipleSelection){
									    selectedFeatures.splice(featureAlreadySelected, 1);
									    removeGeometryFromMap(highlightedLayers[featureAlreadySelected],featureAlreadySelected);
								    }
							    }							    
							}
						}
					}
					//************** Send data to DOM
					$rootScope.$broadcast('featureInfoReceived',selectedFeatures);
				});
        	}	
    	}else{
        	log("selectPoint no layer rendered");
        	$rootScope.$broadcast('displayMapError',{err: "You must select a layer"});
    	}
	}	
	

	function setMultiple(mode){
		log("setMultiple("+mode+")");
		multipleSelection = mode;
	}
	//****************************************************************
	//***********************   END SELECT POINT    ******************
    //****************************************************************
       		
	//****************************************************************
	//***********************      HELPERS      **********************
    //****************************************************************
	
	function clearHighlight(){
		highLightSource.clear();
		highlightedLayers	= Array();
		selectedFeatures	= Array();
	}
    
	/*
		highLightGeometry
			renders in map selected features
		param geometryData: ol.geom.*
	*/
    function highLightGeometry(geometryData,geometryType){
		var _myStroke = new ol.style.Stroke({
							color : geom_colors.select_stroke_color,
							width : 2  
						});
			
		var _myFill = new ol.style.Fill({
							color: geom_colors.select_fill_color
						});

		var myStyle = new ol.style.Style({
							stroke : _myStroke,
							fill : _myFill
						});
		//************** Highlight selected polygon
		var feature = new ol.Feature({geometry: geometryData});

		feature.setStyle(myStyle);
		highLightSource.addFeature(feature);
		highlightedLayers.push(feature);
	   //************** END Highlight 
		selectedFeauture 	= feature;
    }
    
    //removes a geometry from the map
    function removeGeometryFromMap(feature,index){
	    highLightSource.removeFeature(feature);
	    highlightedLayers.splice(index, 1);
    }
    
    //checks if a feature is already selected
    function featureIsSelected(pol_id){
	    for(var i=0;i<selectedFeatures.length;i++){
		    if(selectedFeatures[i].pol_id===pol_id){
			    return i;
		    }
	    }
	    return -1;
    }

	//finds a property by name in feature object
	function findByName(source, name) {
		for (var i = 0; i < source.length; i++) {
			if (source[i].name === name) {
				return source[i];
    		}
    	}		
	}
	
	function setMaxFeatures(number){
		log("setMaxFeatures("+number+")");
		if(!isNaN(number)){
			max_features = number;
		}
	}
	
	//return selectedfeature
	function getSelectedFeauture(){
		return selectedFeauture;
	}
	//log function
	function log(evt,data){
		$rootScope.$broadcast('logEvent',{evt:evt,extradata:data,file:filename});
	}	

	//****************************************************************
	//***********************    END HELPERS    **********************
    //****************************************************************
}])

})();
(function() {
'use strict';
/**
 * Factory add elements for map 
 
 Author: Leandro Lopez-Guerrero Hirsch
 @Leo_lopezg
 
 Jan/Feb 2016 
*/

angular.module('app').factory('mapAddTool', ['$http','$rootScope', function ($http,$rootScope) {
	if (!ol) return {};
	
	var filename 				= "mapAddTool.js",
		app_name				= null,
		viewProjection 			= null,
		viewResolution			= null,
		vectorSource			= null,
		map 					= null,
		epsg					= null,
		canAddPoint				= true,
		iconStyle				= null,		//icon displayed when adding point
		urlWMS					= null,
		pointCoordinates		= null,
		isDrawing				= false,
		pointerMoveListener,				//listener pointer move
		drawStyle,
		draw,								//draw interaction
		sketch,								//draw feature for measuring
		helpTooltipElement,					//The help tooltip element
		helpTooltip,						//Overlay to show the help messages
		continuePolygonMsg		= 'Click to continue drawing the polygon',		//Message to show when a user is drawing a polygon
		continueLineMsg			= 'Click to continue drawing the line',			//Message to show when the user is drawing a line.
		helpMsg 				= 'Click to start drawing',

		drawStartEvent			= null,
		drawEndEvent			= null,
		geom_colors				= {},
		editSelect				= null,		//edit interactions
		modify					= null,		//edit interactions
		modifiedGeometry		= null,		//feature modified geometry
		token					= null;

	// public API
	var dataFactory 				= {
										init: 				init,
										addPoint:			addPoint,
										clearAddPoint:		clearAddPoint,
										fixPoint:			fixPoint,
										initLine:			initLine,
										initPolygon:		initPolygon,
										fixGeometry:		fixGeometry,
										resetAddTools:		resetAddTools,
										editGeometry:		editGeometry,
										endEditGeometry:	endEditGeometry			
						};
	return dataFactory;

	//****************************************************************
	//***********************       INIT       ***********************
    //****************************************************************

	function init(_map,_epsg,_viewProjection,_viewResolution,_vectorSource,_token,_app_name,_urlWMS,_geom_colors){	
		map						= _map;
		epsg					= _epsg;
		viewProjection			= _viewProjection;
		viewResolution			= _viewResolution;
		vectorSource			= _vectorSource;
		token					= _token;
		app_name				= _app_name;
		urlWMS					= _urlWMS;
		geom_colors				= _geom_colors;
		iconStyle 				= new ol.style.Style({
									image: new ol.style.Icon(({
										anchor: [0.5, 16],
										anchorXUnits: 'fraction',
										anchorYUnits: 'pixels',
										opacity: 1,
										src: 'tpl/default/img/marker.png'
									}))
								});
						
						
		log("init("+_map+","+_epsg+","+_token+","+_app_name+")");
		continuePolygonMsg		= $('#STR_CLICK_TO_CONTINUE_DRAWING_POLYGON').val();
		continueLineMsg			= $('#STR_CLICK_TO_CONTINUE_DRAWING_LINE').val();
		helpMsg					= $('#STR_CLICK_TO_START_DRAWING').val();
		drawStyle				= new ol.style.Style({
												fill: new ol.style.Fill({
													color: geom_colors.edit_fill_color
												}),
												stroke: new ol.style.Stroke({
													color: geom_colors.edit_stroke_color,
													lineDash: [10, 10],
													width: 2
												}),
												image: new ol.style.Icon(({
													anchor: [0.5, 0.5],
													anchorXUnits: 'fraction',
													anchorYUnits: 'pixels',
													opacity: 1,
													src: 'tpl/default/img/point.png'
												}))		
    						});
   
		//register event pointer move
		pointerMoveListener 	= map.on('pointermove', pointerMoveHandler);	

	}
	
	//****************************************************************
	//***********************      END INIT    ***********************
    //****************************************************************
    
    //****************************************************************
	//***********************     ADD POINT    ***********************
    //****************************************************************
    
	function addPoint(coordinates){
		log("addPoint: "+coordinates+", canAddPoint: "+canAddPoint);
		if(canAddPoint){
			pointCoordinates	= coordinates;
			$rootScope.$broadcast('addPointCoordinates',{coord: pointCoordinates});
		
			var iconFeature = new ol.Feature({
        						geometry: new ol.geom.Point(coordinates),
							});
			iconFeature.setStyle(iconStyle);
	
			//add icon to vector source
			vectorSource.addFeature(iconFeature);
			notifyGeometry(iconFeature.getGeometry());
			
			canAddPoint 	= false;
			$rootScope.$broadcast('addingPoint',{adding:true,type:"point"});	
			//remove drapan interaction
			var dragPan;
	
			map.getInteractions().forEach(function(interaction) {
				if (interaction instanceof ol.interaction.DragPan) {
					dragPan = interaction;
				}
			}, this);
			
			if (dragPan) {
				map.removeInteraction(dragPan);
			}

			var dragInteraction = new ol.interaction.Modify({
										features: new ol.Collection([iconFeature]),
										style: null
								});
			
			if(dragInteraction){
				map.addInteraction(dragInteraction);
			}
			iconFeature.on('change',function(){
				notifyGeometry(this.getGeometry());
	    	},iconFeature);
    	}	
	}
	
	//returns point geometry and reset tools
	function fixPoint(){
		log("fixPoint()");
		var geometry		= new ol.geom.Point(pointCoordinates);
		resetAddTools();
		pointCoordinates	= null;	
		return geometry;
	}
	
	//clears addPoint tool
	function clearAddPoint(){
		log("clearAddPoint()");
		vectorSource.clear();
		var dragPan;
		map.getInteractions().forEach(function(interaction) {
			if (interaction instanceof ol.interaction.DragPan) {
				dragPan = interaction;
			}
		}, this);
		if (!dragPan) {
			var adddragPan = new ol.interaction.DragPan({kinetic: false});
			map.addInteraction(adddragPan);
		}
		canAddPoint = true;
	}	
	
	//****************************************************************
	//***********************   END ADD POINT    *********************
    //****************************************************************

    //****************************************************************
	//**********************    ADD LINE/POLYIGON    *****************
    //****************************************************************  
    		
    function initPolygon(type){
	    log("initPolygon("+type+")");
	    if(!isDrawing){
		    resetAddTools();
			addInteraction(type);
			isDrawing	= true;
			$rootScope.$broadcast('addingPoint',{adding:true,type:type});	
		}
    } 
			
    function initLine(type){
	    log("initLine("+type+")");
	    if(!isDrawing){
		    resetAddTools();	
			addInteraction(type);
			isDrawing	= true;
			$rootScope.$broadcast('addingPoint',{adding:true,type:type});	
		}
    }  		
 
    function addInteraction(type) {
		draw 		= new ol.interaction.Draw({
						source: vectorSource,
						type: /** @type {ol.geom.GeometryType} */ (type),
						style: drawStyle
					});
		
	    map.addInteraction(draw);

		createHelpTooltip();
		
		drawStartEvent	= draw.on('drawstart',function(evt) {
			log('drawstart')
	        // set sketch
	        sketch = evt.feature;
	    }, this);
	    
	    drawEndEvent = draw.on('drawend',function(evt) {
		    log('drawend');
		    notifyGeometry(sketch.getGeometry());
			if(draw){
				map.removeInteraction(draw);
				draw		= null;
			}
		}, this);
	}
	
	//returns line/polygon geometry and reset tools
	function fixGeometry(){
		log('fixGeometry()');
		if(sketch){
			var geometry	= sketch.getGeometry();
			//unset sketch
			sketch = null;
			resetAddTools();
			return geometry;
		}	
	}
       
    //****************************************************************
	//******************  	END ADD LINE/POLYIGON    *****************
    //****************************************************************   		

    //****************************************************************
	//*******************       GEOMETRY EDITION      ****************
    //****************************************************************
    
    function editGeometry(feature){
	    log("editGeometry()",feature);
		if(feature.getGeometry().getType()==="Point"){
			feature.setStyle(iconStyle);
		}else{
			feature.setStyle(drawStyle);	
		}	  
		modifiedGeometry	= null;
		editSelect 			= new ol.interaction.Select({
								wrapX: false
							});			
		var features 		= new ol.Collection();    
		features.push(feature);
		modify 				= new ol.interaction.Modify({
									features:	features
							});
		
		map.getInteractions().extend([editSelect, modify]);
		
		modify.on('modifystart', function (evt) {
			evt.features.forEach(function (feature) {
				modifiedGeometry		= feature.getGeometry();
				log("modifiedGeometry",modifiedGeometry);
				notifyGeometry(modifiedGeometry);
    		});
		}); 
		modify.on('modifyend', function (evt) {
			evt.features.forEach(function (feature) {
				modifiedGeometry		= feature.getGeometry();
				log("modifiedGeometry",modifiedGeometry);
				notifyGeometry(modifiedGeometry);
    		});
		});  
    }

	function endEditGeometry(){
		log("endEditGeometry()");
		map.removeInteraction(editSelect);
		map.removeInteraction(modify); 
		editSelect			= null;
		modify				= null;
		modifiedGeometry	= null;
	}
	
	//****************************************************************
	//*******************     END GEOMETRY EDITION      **************
    //****************************************************************  
     
	//****************************************************************
	//***********************      HELPERS      **********************
    //****************************************************************
  
	/**
	 * Handle pointer move.
	 * @param {ol.MapBrowserEvent} evt
	 */
	function pointerMoveHandler(evt) {
		//log("pointerMoveHandler",evt);
		if (evt.dragging) {
	    	return;
	    }
	   
	    var tooltipCoord 	= evt.coordinate;
	    if (sketch) {
	    	var output;
			var geom 		= (sketch.getGeometry());
			if (geom instanceof ol.geom.Polygon) {
				helpMsg 		= continuePolygonMsg;
				tooltipCoord 	= geom.getInteriorPoint().getCoordinates();
	    	} else if (geom instanceof ol.geom.LineString || geom instanceof ol.geom.MultiLineString) {

				helpMsg 		= continueLineMsg;
				tooltipCoord 	= geom.getLastCoordinate();
			}
	    }
	    if (helpTooltipElement) {
			helpTooltipElement.innerHTML = helpMsg;
			helpTooltip.setPosition(evt.coordinate);
		}
	};
     
    /**
	* Creates a new help tooltip
	*/
	function createHelpTooltip() {
		if (helpTooltipElement) {
    		helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    	}
    	helpTooltipElement 				= document.createElement('div');
    	helpTooltipElement.className 	= 'tooltipbase';
		helpTooltip 					= new ol.Overlay({
											element: helpTooltipElement,
											offset: [15, 0],
											positioning: 'center-left'
										});
		map.addOverlay(helpTooltip);
	}
	
	function resetAddTools(){
		log("resetAddTools()");
	    if(draw){
		    map.removeInteraction(draw);
		    draw	= null;
	    }
	    if (helpTooltipElement) {
			helpTooltipElement.parentNode.removeChild(helpTooltipElement);
			helpTooltipElement = null;
    	}
    	if(vectorSource){
    		vectorSource.clear();
    	}
		var dragPan;
		if(map.getInteractions().getLength()>0){
			map.getInteractions().forEach(function(interaction) {
				if (interaction instanceof ol.interaction.DragPan) {
					dragPan = interaction;
				}
			}, this);
			if (!dragPan) {
				var adddragPan = new ol.interaction.DragPan({kinetic: false});
				map.addInteraction(adddragPan);
			}
		}
		canAddPoint = true;
		isDrawing	= false; 	
	}
	
	/*
		Notifies geometry
		param geometry: ol.geom.*
	*/
    function notifyGeometry(geometry){
	    log("notifyGeometry()",geometry);
	    var format			= new ol.format.WKT({});
		var rawGeometry		= format.writeGeometry(geometry);
		$rootScope.$broadcast('notifyGeometry',{geometry:rawGeometry,type:geometry.getType()});  
    }
	
	//log function
	function log(evt,data){
		$rootScope.$broadcast('logEvent',{evt:evt,extradata:data,file:filename});
	}	

	//****************************************************************
	//***********************    END HELPERS    **********************
    //****************************************************************
}])

})();
$(function () {
  $('[data-toggle="tooltip"]').tooltip()
});
app.directive('selectMore', function($rootScope) {
	var state		= false,
		toolName	= "selectMore",
		elem 		= null,
	
		_template 	= '<button class="btn btn-default-custom tool-more" ng-disabled="toolsDisabled" data-toggle="tooltip" data-placement="left" data-container="body" title="{{tooltipselectMore}}"></button>';

	function setState(_st){
		if(_st){
			state = false;
			elem.removeClass("tool-selected");
		}else{
			state	= true;
			elem.addClass("tool-selected");
		}
	}
	
	//reset button
	$rootScope.$on('reset-tools',  function(event,data){
		if(data.tool!=toolName){
			setState(true);
		}else{
			setState(false);
		}
	});
	
	return {
		restrict: 		'E',
		replace: 		'true',
		template: 		_template,
		link: 			function(scope, _elem, attrs) {
							scope.tooltipselectMore	= attrs.tooltip;
							elem 	= _elem;
							elem.bind('click', function() {
							
							setState(state);
							
							if(state){
								scope.mc.mapFactory.setTool(toolName);
							}else{
								scope.mc.mapFactory.setTool(null);
							}
							
							scope.$apply(function() {
								
							});
							

						})
    	}
    }
});

app.directive('selectArea', function($rootScope) {
	var state		= false,
		toolName	= "selectArea",
		elem 		= null;
		
	var _template 	= '<button type="button" class="btn btn-default" data-toggle="tooltip" data-placement="left" data-container="body" title="{{tooltipselectArea}}"><i class="fa fa-square-o"></i> </button>'

	function setState(_st){
		if(_st){
			state = false;
			elem.removeClass("tool-selected");
		}else{
			state	= true;
			elem.addClass("tool-selected");
		}
	}
	//reset button
	$rootScope.$on('reset-tools',  function(event,data){
		if(data.tool!=toolName){
			setState(true);
		}else{
			setState(false);
		}
	});
	return {
		restrict: 		'E',
		replace: 		'true',
		template: 		_template,
		link: 			function(scope, _elem, attrs) {
							scope.selectArea	= attrs.tooltip;
							elem 	= _elem;
							elem.bind('click', function() {
							
							setState(state);
							
							if(state){
								scope.mc.mapFactory.setTool(toolName);
							}else{
								scope.mc.mapFactory.setTool(null);
							}
							
							scope.$apply(function() {
								
							});
							//reset button
							$rootScope.$on('reset-tools',  function(event,data){
								console.log(data.tool,toolName)
								if(data.tool!=toolName){
									setState(true);
								}
            				});
						})
    	}
    }
});

app.directive('addPoint', function($rootScope) {
	var state		= false,
		toolName	= "point",
		elem 		= null,
		_template 	= '<button class="btn btn-default-custom tool-point" ng-disabled="addPointDisabled" data-toggle="tooltip" data-placement="left" data-container="body" title="{{tooltipaddPoint}}"></button>'

	function setState(_st){
		if(_st){
			state = false;
			elem.removeClass("tool-selected");
		}else{
			state	= true;
			elem.addClass("tool-selected");
		}
	}

	//reset button 
	$rootScope.$on('reset-tools',  function(event,data){
		if(data.tool!=toolName){
			setState(true);
		}
    });
    
	return {
		restrict: 		'E',
		replace: 		'true',
		template: 		_template,
		//templateUrl: '/demo/tpl/addPoint.htm', 
		link: 			function(scope, _elem, attrs) {
							scope.tooltipaddPoint	= attrs.tooltip;
							elem 	= _elem;
							elem.bind('click', function() {
							
							setState(state);
							
							if(state){
								scope.mc.mapFactory.setTool(toolName);
							}else{
								scope.mc.mapFactory.setTool(null);
							}

							scope.$apply(function() {
								
							});

						})
    	}
    }
});

app.directive('addPolygon', function($rootScope) {
	var state		= false,
		toolName	= "Polygon",
		elem 		= null;
		
	var _template 	= '<button class="btn btn-default-custom tool-polygon" ng-disabled="addPopolygonDisabled" data-toggle="tooltip" data-placement="left" data-container="body" title="{{tooltipaddPolygon}}"></button>'

	function setState(_st){
		if(_st){
			state = false;
			elem.removeClass("tool-selected");
		}else{
			state	= true;
			elem.addClass("tool-selected");
		}
	}

	//reset button 
	$rootScope.$on('reset-tools',  function(event,data){
		if(data.tool!=toolName){
			setState(true);
		}
    });
    $rootScope.$on('define_geometryTypeInTools',  function(event,data){
		toolName 	= data.toolName;
    });
	return {
		restrict: 		'E',
		replace: 		'true',
		template: 		_template,
		link: 			function(scope, _elem, attrs) {
							scope.tooltipaddPolygon	= attrs.tooltip;
							elem 	= _elem;
							elem.bind('click', function() {
							
							setState(state);
							
							if(state){
								scope.mc.mapFactory.setTool(toolName);
							}else{
								scope.mc.mapFactory.setTool(null);
							}

							scope.$apply(function() {
								
							});

						})
    	}
    }
});

app.directive('addLine', function($rootScope) {
	var state		= false,
		toolName	= "LineString",
		elem 		= null;
		
	var _template 	= '<button class="btn btn-default-custom tool-add" ng-disabled="addLineDisabled" data-toggle="tooltip" data-placement="left" data-container="body" title="{{tooltipaddLine}}"></button>'

	function setState(_st){
		if(_st){
			state = false;
			elem.removeClass("tool-selected");
		}else{
			state	= true;
			elem.addClass("tool-selected");
		}
	}

	//reset button 
	$rootScope.$on('reset-tools',  function(event,data){
		if(data.tool!=toolName){
			setState(true);
		}
    });
    //reset button 
	$rootScope.$on('define_geometryTypeInTools',  function(event,data){
		toolName 	= data.toolName;
    });
    
	return {
		restrict: 		'E',
		replace: 		'true',
		template: 		_template,
		link: 			function(scope, _elem, attrs) {
							scope.tooltipaddLine	= attrs.tooltip;
							elem 	= _elem;
							elem.bind('click', function() {
							
							setState(state);
							
							if(state){
								scope.mc.mapFactory.setTool(toolName);
							}else{
								scope.mc.mapFactory.setTool(null);
							}

							scope.$apply(function() {
								
							});

						})
    	}
    }
});

app.directive('measureLine', function($rootScope) {
	var state		= false,
		toolName	= "measureLine",
		elem 		= null
		_template 	= '<button class="btn btn-default-custom tool-regla" ng-disabled="toolsDisabled" data-toggle="tooltip" data-placement="left" data-container="body" title="{{tooltipmeasure}}"></button>'

	function setState(_st){
		if(_st){
			state = false;
			elem.removeClass("tool-selected");
		}else{
			state	= true;
			elem.addClass("tool-selected");
		}
	}

	return {
		restrict: 		'E',
		replace: 		'true',
		template: 		_template,
		link: 			function(scope, _elem, attrs) {
							scope.tooltipmeasure	= attrs.tooltip;
					
							elem 	= _elem;
							elem.bind('click', function() {
							
							setState(state);
							
							if(state){
								scope.mc.mapFactory.setTool(toolName,'LineString');
							}else{
								scope.mc.mapFactory.setTool(null);
							}

							scope.$apply(function() {
								
							});
							//reset button 
							$rootScope.$on('reset-tools',  function(event,data){
								if(data.tool!=toolName){
									setState(true);
								}
            				});
						})
    	}
    }
});

app.directive('measureArea', function($rootScope) {
	var state		= false,
		toolName	= "measureArea",
		elem 		= null;
		
	var _template 	= '<button class="btn btn-default-custom tool-area" ng-disabled="toolsDisabled" data-toggle="tooltip" data-placement="left" data-container="body" title="{{tooltipmeasureArea}}"></button>'

	function setState(_st){
		if(_st){
			state = false;
			elem.removeClass("tool-selected");
		}else{
			state	= true;
			elem.addClass("tool-selected");
		}
	}

	return {
		restrict: 		'E',
		replace: 		'true',
		template: 		_template,
		link: 			function(scope, _elem, attrs) {
							scope.tooltipmeasureArea	= attrs.tooltip;
							elem 	= _elem;
							elem.bind('click', function() {
							
							setState(state);
							
							if(state){
								scope.mc.mapFactory.setTool(toolName,'Polygon');
							}else{
								scope.mc.mapFactory.setTool(null);
							}

							
				
							scope.$apply(function() {
								
							});
							//reset button 
							$rootScope.$on('reset-tools',  function(event,data){
								if(data.tool!=toolName){

									setState(true);
								}
            				});
						})
    	}
    }
});






app.directive("featureAttribute",function($rootScope){
	var elem 			= null;
	//var _template 	= '<span><b>{{datasource.name}}:</b> {{datasource.value}}</span>E: {{editable}}<span ng-show="editable">EDITA</span></span>';

	var _template 	= '<span ng-show="datasource.name != \'geometry\' && datasource.name != \'foto_node_id\'">';
		_template 	+= '<span><span class="fieldname">{{datasource.name}}:</span> <span ng-show="showLabel && fieldValue!=\'NULL\'">{{fieldValue}}</span></span>';
		
		_template 	+= ' <span ng-show="canEdit && datasource.name!=\'id\' && datasource.name!=\'pol_id\' && datasource.name!=\'arc_id\' ">';
		_template 	+= ' <button ng-show="editBt" ng-click="edit()" class="btn btn-xs btn-primary-custom pull-right"><i class="fa fa-pencil"></i></button>';
		_template 	+= ' <button ng-show="actionBt" class="btn btn-xs btn-danger-custom pull-right"><i class="fa fa-times" ng-click="cancelEdit()"></i></button> <button ng-show="actionBt" class="btn btn-xs btn-success-custom pull-right"><i class="fa fa-check" ng-click="update()"></i></button> ';
		
		_template 	+= '<span ng-show="showInput" class="pull-right"><input type="text" ng-model="fieldValue"></span>';
		
		_template 	+= '</span>';
		_template 	+= '</span>';

	return {
		restrict: 		'E',
		replace: 		'true',
		scope: 			{ 
							datasource			: '=',
							canEdit				: '=',
							updateAction		:'&'
						},
		template: 		_template,
		
		link: 			function(scope, _elem, attrs) {
							scope.showInput		= false;
							scope.showLabel		= true;
							scope.editBt		= true;
							scope.actionBt		= false;
							scope.fieldName		= scope.datasource.name;
							scope.fieldValue	= scope.datasource.value;
							scope.edit = function(){
								scope.showInput		= true;
								scope.showLabel		= false;
								scope.editBt		= false;
								scope.actionBt		= true;
							}
							
							scope.cancelEdit = function(){
								scope.showInput		= false;
								scope.showLabel		= true;
								scope.editBt		= true;
								scope.actionBt		= false;
							}
							
							scope.update	= function(){
								scope.showInput			= false;
								scope.showLabel			= true;
								scope.editBt			= true;
								scope.actionBt			= false;
								var data2Update			= {};
								data2Update.fieldName	= scope.fieldName;
								data2Update.fieldValue	= scope.fieldValue;
								$rootScope.$broadcast('updateAttribute',data2Update);	
							}
							
							elem 	= _elem;
							elem.bind('click', function() {
								scope.$apply(function() {
								});
						
						})
    	}
    	

    }
    
    	
});


//directive, on add picture show preview
app.directive("ngFileSelect",function(){
	return {
		link: function($scope,el){
			el.bind("change", function(e){
					$scope.file = (e.srcElement || e.target).files[0];
					$scope.showContent();
				})
		}
	}
});
//directive for show loading until legend image is loaded
app.directive('legendload', function($rootScope) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('load', function() {
               scope.mc.loadingLegend = false;
			   scope.$apply();     
            });
            element.bind('error', function(){
                //alert('image could not be loaded');
            });
        }
    };
});(function() {
'use strict';

	/**
	 * Logger Service
	 */
	 
	angular.module('app').factory('loggerService', ['$http', function ($http) {
		
		var env;
		
		function init(_env){
			if(_env!="prod"){
				env 	= true;
			}
			log("loggerService","init("+_env+")");
		}
		
		function log(emitter, msg,json){
			if(env){
				if(json){
					console.log(emitter,"->",msg,json);
				}else{
					console.log(emitter,"->",msg);
				}
				
			}
		}
	
		function warn(emitter, msg){
			if(env){
				console.warn(emitter,"->",msg);
			}
		}
		
		function error(emitter, msg){
			if(env){
				console.error(emitter,"->",msg);
			}
		}
	
		var dataFactory = {
			init		: init,
			log			: log,
			warn		: warn,
			error		: error	
		};

	
		return dataFactory;
		
		
	}])

})();
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
		token,
		socket,
		socket_id;
	
	// public API
	var dataFactory 				= {
					    				
										init: 				init
										
						};
	return dataFactory;


	function init(_env,_token,_app_name,_urlSocket,_project_name){	
		env				= _env;	
		token			= _token;
		urlSocket		= _urlSocket;
		app_name		= _app_name;
		project_name	= _project_name;
		
		log("init("+_env+","+_token+","+_app_name+","+_urlSocket+")");
		socket = io(urlSocket,{reconnection:false});
		
		socket.on('connect', function () {
			log("Socket succesfully connected");
			var user_data				= {};
			user_data.roomName			= project_name;
			socket.emit('user_connect', user_data);
			$rootScope.$broadcast('socketStatus',{status_str:"Connected",status:1});
			
		});	
		
		socket.on('connection_accepted', function (data) {
			log("Socket connection_accepted",data);
			socket_id		= data.socket_id;
			
		});	
		
		socket.on('connect_error', function () {
			log("Socket connection error");
			$rootScope.$broadcast('socketStatus',{status_str:"Connection error",status:0});
		});	
		
		/*so.on('ping', function (data){
			//logger.log("JS [Socket]","ping: "+data.beat);
			so.emit('pong', {tipo:config.tipo,roomName:config.roomName});

		});*/
		
		socket.on('new_geometry', function (data) {
			log("Socket new_geometry",data);
			try{
				var payload 	= data.payload.split(";");
				$rootScope.$broadcast('socket_new_geometry',{id:parseInt(payload[2]),geom:payload[4],epsg:payload[5]+":"+payload[6],layer:payload[0]});
			}catch(err) {
				log("Socket new_geometry error parsing: "+err);
			}
		});	
		
		
		//disconnection event
		socket.on('disconnect', function () {
			log("Socket - disconnected");
			$rootScope.$broadcast('socketStatus',{status_str:"Disconnected",status:0});				
		});
		
		socket.on( 'reconnect', function() {
			log("Socket - reconnected");
		});	
		
	}
	
	
	
	//****************************************************************
	//***********************      HELPERS      **********************
    //****************************************************************
    
	//log function
	function log(evt,data){
		$rootScope.$broadcast('logEvent',{evt:evt,extradata:data,file:filename});
	}
	
	//****************************************************************
	//***********************      HELPERS      **********************
    //****************************************************************
	
}])
	
})();(function (module) {
     
    var fileReader = function ($q, $log) {
 
        var onLoad = function(reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.resolve(reader.result);
                });
            };
        };
 
        var onError = function (reader, deferred, scope) {
            return function () {
                scope.$apply(function () {
                    deferred.reject(reader.result);
                });
            };
        };
 
        var onProgress = function(reader, scope) {
            return function (event) {
                scope.$broadcast("fileProgress",
                    {
                        total: event.total,
                        loaded: event.loaded
                    });
            };
        };
 
        var getReader = function(deferred, scope) {
            var reader = new FileReader();
            reader.onload = onLoad(reader, deferred, scope);
            reader.onerror = onError(reader, deferred, scope);
            reader.onprogress = onProgress(reader, scope);
            return reader;
        };
 
        var readAsDataURL = function (file, scope) {
            var deferred = $q.defer();
             
            var reader = getReader(deferred, scope);         
            reader.readAsDataURL(file);
             
            return deferred.promise;
        };
 
        return {
            readAsDataUrl: readAsDataURL  
        };
    };
 
    module.factory("fileReader",
                   ["$q", "$log", fileReader]);
 
}(angular.module("app")));angular.module('app').service('fileUpload', ['$http', function ($http) {
	this.uploadFileToUrl = function(file, uploadUrl){
	    var fd = new FormData();
	    fd.append('file', file);
	    $http.post(uploadUrl, fd, {
	        transformRequest: angular.identity,
	        headers: {'Content-Type': undefined}
	    })
	    .success(function(){
	    })
	    .error(function(){
	    });
	}
}]);