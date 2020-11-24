/**
 * Main app module
 */
var app  = angular.module('app', ['ui.bootstrap','angular-loading-bar', 'ngAnimate']);(function() {
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
				@param _urlWMS  (string) url for WMS/WFS requests
				@param _token  (string) token for cross site injection protection
				@param _project  (object) JSON object with project properties
				@param _app_name (string) for logging purposes
				@param _useGeolocation  (boolean)
				@param _max_feature  (int) max number of return features in multiple selection
				@param touchDevice (int)
				@param notifications_strings (Object) localized strings
	- resize
			Updates map size (for responsive methods)

	- addLayer
			Add a layer to map (makes WMS request)
				@param layer_name (string) layer name

	- removeLayer
			Removes a layer from map
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

	- reloadLayer
			reloads a layer
				@param layer_name (string) layer name

		- reloadDisplayedLayers
			reloads all displayed layers

	- getLayersDisplayed
			returns array with layers displayed in map

	- setBackGroundMap
			Sets background map
				@param map (string) check supported background maps. For example: 'google' for Google maps

	- setUseGeolocation
			Activates/desactivates geolocation method
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

	- doInfoFromCoordinates
			Simulates a select point from given coordinates
				@param coordinates (Array(float x, float y))
				@param feauture_id (string) OPTIONAL
				@param layers (string) OPTIONAL - list of all layers in toc, for filtering query
	- featureDeleted
			Event received when a feature is deleted. Renders in map the geometry
				@param geom (string) geometry in ol.format.WKT

	- cleanGeometries
			Cleans added geometries
				@param what (string) what to clean

	- resetAddTools
			Calls mapAddTool resetAddTools for cancel adding element

	- setInitEndDates
			sets initial and end date for WMS/WFS quert
				@param initDate
				@param endDate

	- getFormatedFilterDates
				@returns a JSON with initDate and endDate properties

	- getPostgresFieldName
			gets postgres field name of an attribute
				@param position (int) array position

	- trackPosition
			tracks user position

	- getHeading
			gets heading from geolocation

	- zoomToExtend
		zoom map to original extend

	- offlineDownloadGeoJsonLayer
			downloads geojson layer
				@param layer (string)

	- clearOfflineVisits
			removes offline stored visits

	- offlineDumpData
			dumps stored data to db

	- getLocalizedStringValue
			returns localized string value
			@param constant (string)- constant name
			@return string
	******************************************************************************************************

	Available properties:

	- map (ol.Map object)
	- mapSelectTool (select tools module)

	******************************************************************************************************
*/

angular.module('app').factory('mapFactory', ['$http','$rootScope','mapMeasureTools','mapSelectTool','mapAddTool','mapOffline','mapAjaxOperations','mapStorage','mapPhotos', function ($http,$rootScope,mapMeasureTools,mapSelectTool,mapAddTool,mapOffline,mapAjaxOperations,mapStorage,mapPhotos) {

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
		localized_strings				= {},				//obj containining localized strings
		appOnline								= false,		//flag detecting if app is online or offline
		raster									= null,			//background raster
		layers									= Array(),
		layersVars							= Array(),
		activeLayer							= null,
		filename								= "mapFactory.js",
		version									= "1.1.0",
		viewProjection					= null,
		viewResolution					= null,
		useGeolocation					= null,
		geolocation							= null,		//geolocation object for tools
		max_features						= null,		//limit of features for queries
		ws_status								= 0,			//websocket connection status
		onlineBackgroundsource	= null,		//ol.layer.Tile for background
		clickedCooordinates			= null,
		editing									= false,	//flag for knowing if is editing or not
		offlineForced						= false,	//flag for detecting if oflline is forced
		//tools
		toolSelected						= null,		//tool selected
		toolMode								= null,		//tool mode (for measure "line" or "area")
		vectorSource, 										//source for temporal geometry
		vectorLayer,											//layer for temporal geometry
		//geolocatization & tracking position
		trackVectorSource				= null,		//source for trackincg position marker
		trackVectorLayer				= null,		//layer for trackincg position marker
		trackingPosition				= null,		//ol.Geolocation for tracking position
		geoLocalizedNotificate	= false,	//flag for notificate geolocated only once

		//when add geometries to map, add temporal geoms for avoid page reload and animation effect
		addStyle								= null,		//temporal point
		addFeautureForAnimate 	= null,		//feauture added, used in animation
		duration								= 3000,		//animation duration
		start										= null,		//mark for init animation
		listenerKey							= null,
		notificationEffect			= false,	//flag for displaying effect in added geometry or not
		measureStyle						= null,		//style for measureTools
		selectStyle							= null,		//style for selectTools
		touchDevice							= 0,			//0 no touch device, 1 touch device (mobiler or tablet)
		initDate								= null,		//filter initial date for WMS/WFS
		endDate									= null,		//filter end date for WMS/WFS
		layerFieldNames					= null,		//postgres field names used for edition
		mapToc									= null,		//mapToc module
		capabilities;											//map capabilities

	// public API
	var dataFactory   = {
										map:                            map, // ol.Map
										mapSelectTool:                  mapSelectTool,
										epsg:                           epsg,
										init:                           init,
										resize:                         resize,
										injectDependency:               injectDependency,
										addLayer:                       addLayer,
										removeLayer:                    removeLayer,
										getMapData:                     getMapData,
										setTool:                        setTool,
										zoomToExtend:                   zoomToExtend,
										setActiveLayer:                 setActiveLayer,
										resetActiveLayer:               resetActiveLayer,
										getActiveLayer:                 getActiveLayer,
										getActiveLayerName:             getActiveLayerName,
										reloadLayer:                    reloadLayer,
										reloadDisplayedLayers:          reloadDisplayedLayers,
										getLayersDisplayed:             getLayersDisplayed,
										setBackGroundMap:               setBackGroundMap,
										setUseGeolocation:              setUseGeolocation,
										setMaxFeatures:                 setMaxFeatures,
										setSocket:                      setSocket,
										addSocketGeometry:              addSocketGeometry,
										doInfoFromCoordinates:					doInfoFromCoordinates,
										featureDeleted:                 featureDeleted,
										getLayerAttributes:             getLayerAttributes,
										editGeometry:                   editGeometry,
										endEditGeometry:                endEditGeometry,
										cleanGeometries:                cleanGeometries,
										resetAddTools:                  resetAddTools,
										//offline module
										offlineConfigure:               offlineConfigure,
										offlineReset:										offlineReset,
										offlineStartDownload:           offlineStartDownload,
										offlineSelectAreaToDownload:		offlineSelectAreaToDownload,
										OfllineGetAvailableGeoJson:     OfllineGetAvailableGeoJson,
										offlineGetVisitsPendingDump:    getVisitsPendingDump,
										forceOffline:                   forceOffline,
										clearOfflineVisits:             clearOfflineVisits,
										offlineDumpData:                offlineDumpData,
										getOnlineStatus:                getOnlineStatus,
										offlineShowSavedAreas:					offlineShowSavedAreas,
										offlineHideSavedAreas:					offlineHideSavedAreas,
										offlineGetInfo:									getOfflineInfo,
										//end offline module
										getclickedCooordinates:         getclickedCooordinates,
										setInitEndDates:                setInitEndDates,
										getFormatedFilterDates:					getFormatedFilterDates,
										getPostgresFieldName:           getPostgresFieldName,
										ajaxGetFormDataForVisitForm:    ajaxGetFormDataForVisitForm,
										ajaxGetProjectInfo:             ajaxGetProjectInfo,
										ajaxAddGeometry:                ajaxAddGeometry,
										ajaxUpdateFeatureField:         ajaxUpdateFeatureField,
										ajaxDeleteElement:              ajaxDeleteElement,
										ajaxAddVisit:                   ajaxAddVisit,
										ajaxAddVisitInfo:               ajaxAddVisitInfo,
										ajaxGetVisit:                   ajaxGetVisit,
										ajaxRemoveVisit:                ajaxRemoveVisit,
										ajaxRemoveEvent:                ajaxRemoveEvent,
										ajaxGetVisitInfo:               ajaxGetVisitInfo,
										//photos module
										photosSavePicture:              photosSavePicture,
										photosAddPhoto:                 photosAddPhoto,
										photosShowPhoto:                photosShowPhoto,
										photosDeletePhoto:              photosDeletePhoto,
										photosGetLists:									photosGetLists,
										photosReset:										photosReset,
										//end photos modules
										//geolocation
										trackPosition:                  trackPosition,
										getHeading:											getHeading,
										//end geolocation
										getLocalizedStringValue:				getLocalizedStringValue
						};

	return dataFactory;

	//****************************************************************
	//***********************       INIT       ***********************
	//****************************************************************

	function init(_env,_urlWMS,_token,_project,_app_name,_useGeolocation,_max_features,_touchDevice){
		env                      = _env;
		urlWMS                  = _urlWMS;
		token                    = _token;
		project                  = _project;
		app_name                = _app_name;
		useGeolocation          = _useGeolocation;
		max_features            = _max_features;
		touchDevice              = _touchDevice;
		log("init("+_env+","+_urlWMS+","+_token+","+_project+","+_app_name+","+_useGeolocation+","+_max_features+","+_touchDevice+")","info");
		if(navigator.onLine){
			log("App online","info");
			appOnline       = true;
		}else{
			log("App offline","info");
			appOnline       = false;
			$rootScope.$broadcast('appOnline',{status: appOnline});
		}
		window.addEventListener('online',  updateOnlineStatus);
		window.addEventListener('offline', updateOfflineStatus);
		//ajax operations
		mapAjaxOperations.init(token,_app_name);
		//load strings
		mapAjaxOperations.getLocalizedStrings(function(e,data){
			if(e===null){
				log("getLocalizedStrings()","success",data);
				localized_strings = data;
			}else{
				log("getLocalizedStrings()","error: "+e,data);
			}
			//offline init
			mapOffline.init(urlWMS,touchDevice,localized_strings);
			//send strings to controller
			$rootScope.$broadcast('stringsLoaded',localized_strings);
		});

		//photos init
		mapPhotos.init(token,_app_name);

		//get Capabilities
		var parser     = new ol.format.WMSCapabilities();
		log("GetCapabilities(): "+urlWMS+"?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities","info");
		$http({method: "GET", url: urlWMS+"?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities"})
			.success(function(data){
					//try{
						capabilities = parser.read(data);
						if(document.getElementById("map")){
							log("GetCapabilities()","success",capabilities);
							renderMap();
						}else{
							alert("No DOM element id='map' present!")
						}

			/*  }catch(e){
					alert(project.project_name+" doesn't exists or is not responding in qgis_mapserv.fcgi or there's an error parsing xml:\n"+e);
				}*/
			}
		);

		//keyboard events
		document.addEventListener('keydown', function(evt) {
			var e       = window.event || evt;
			var key     = e.which || e.keyCode;
			if(18 == key) {
				log("Alt pressed","info");
				setTool("selectArea");
			}else if(16 == key) {
				log("Shift pressed","info");
				setTool("selectMore");
			}
		}, false);

		document.addEventListener('keyup', function(evt) {
			var e       = window.event || evt;
			var key     = e.which || e.keyCode;
			if(18 == key) {
				log("Alt UNpressed","info");
				setTool(null);
			}else if(16 == key) {
				log("Shift UNpressed","info");
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
			log("Using capabilities","info")
			epsg      = capabilities.Capability.Layer.BoundingBox[0].crs
			extent    = capabilities.Capability.Layer.BoundingBox[0].extent;
		}else{
			log("Not using capabilities","info")
			epsg      = project.epsg;
			extent    = project.extent;
		}

		log("Extension:","info",extent)

		var projection	= ol.proj.get(epsg);

		//background raster
		raster         = new ol.layer.Tile({});
		setBackGroundMap(project.background);

		//zomm level
		if(project.zoom_level){
			zoom_level    = parseInt(project.zoom_level);
		}else{
			zoom_level    = 9;
		}

		log("Map projection:","info",projection);
		//sets de view
		var view       = new ol.View({
								projection: projection,
								extent:   	extent,
								center:   	[extent[0], extent[1]],
								zoom:     	zoom_level,
								minZoom:    9
							});

		log("Map epsg:","info",epsg);
		log("Map zoom: "+zoom_level,"info");

		//remove rotation interactions
		var interactions = ol.interaction.defaults({altShiftDragRotate:false, pinchRotate:false});
		//sets the map
		map   = new ol.Map({
								target: 			'map',
								layers: 			layers,
								interactions: interactions,
								renderer: 		'canvas'
								//renderer: 		'webgl'

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
		viewProjection     = view.getProjection();
		viewResolution     = view.getResolution();

		//map rendered, broadcast capabilities
		$rootScope.$broadcast('capabilities',capabilities);

		//markers & temporal geometry
		vectorSource     	= new ol.source.Vector({});
		vectorLayer     	= new ol.layer.Vector({
								source: vectorSource,
								zIndex : 999,
								opacity: 1
							});

		map.addLayer(vectorLayer);

		//Set styles for overlay geometries
		if(project.geom_colors==undefined){
			project.geom_colors = {};
			//default colors for select/edit geometries
			project.geom_colors.select_stroke_color  	= "rgba(0,71,252,1)";
			project.geom_colors.select_fill_color 	 	= "rgba(252,0,0,0.72)";
			project.geom_colors.edit_stroke_color  		= "rgba(0,71,252,1)";
			project.geom_colors.edit_fill_color    		= "rgba(252,0,0,0.72)";
			project.geom_colors.measure_fill_color  	= "rgba(255,230,0,0.24)";
			project.geom_colors.measure_stroke_color	= "rgba(255,0,0,1)";
		}
		setStyles(project.geom_colors);
		vectorLayer.setStyle(selectStyle);
		//listener for animate points
		vectorSource.on('addfeature', function(e) {
			addFeautureForAnimate  = e.feature
			flash(addFeautureForAnimate);
		});

		//define project projection in proj4
		//proj4.defs("EPSG:25831","+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

		if(useGeolocation===1){
			// create a Geolocation object setup to track the position of the device
			geolocation = new ol.Geolocation({
				tracking: true,
				projection: epsg
			});
		}
		//******* TOOLS initialization
		//measure
		mapMeasureTools.init(map,epsg,viewProjection,vectorSource,vectorLayer,token,app_name,project.geom_colors,touchDevice,localized_strings);
		//select
		mapSelectTool.init(map,epsg,viewProjection,viewResolution,vectorSource,token,app_name,urlWMS,max_features,project.geom_colors,touchDevice);
		//add
		mapAddTool.init(map,epsg,viewProjection,viewResolution,vectorSource,token,app_name,urlWMS,project.geom_colors);

		//click event
		map.on('click', function(evt) {
			clickedCooordinates    = evt.coordinate;
			log("click coordinates: "+evt.coordinate,"info");
			log("toolSelected: "+toolSelected,"info");
			if(editing){
				endEditGeometry();
			}
			//if toolSelected adds point
			if(toolSelected==="point"  || toolSelected==="MultiPoint" || toolSelected==="Point"){
				mapAddTool.addPoint(evt.coordinate,toolSelected);
			}else if(toolSelected==="LineString" || toolSelected==="MultiLineString"){
				 mapAddTool.initLine(toolSelected);
			}else if(toolSelected==="Polygon" || toolSelected==="MultiPolygon"){
				 mapAddTool.initPolygon(toolSelected);
			}else if(toolSelected==="measureLine" || toolSelected==="measureArea"){
				if(mapMeasureTools.getMeasureCount()>0){
					mapMeasureTools.initMeasure(toolMode);
					vectorLayer.setStyle(measureStyle);
				}
			}else{
				if(appOnline){
					mapSelectTool.selectPoint(clickedCooordinates,getMapData(),view.getResolution());
				}else{
					mapSelectTool.selectPointOffline(evt.pixel,clickedCooordinates,getActiveLayerName());
				}
			}
		});
	}

	//****************************************************************
	//***********************  END RENDER MAP  ***********************
	//****************************************************************

	//****************************************************************
	//***********************     ADD LAYER    ***********************
	//****************************************************************

	function addLayer(item,index){
		var legend_event;
		if(typeof item=="object"){
			var layer_name = item.Name;
		}else{
			var layer_name = item;
		}
		log("addLayer("+layer_name+")","info");
		if(layers.indexOf(layer_name)===-1){
			legend_event = 'show';
			displayLayer(layer_name,false,item,index);
		}else{
			legend_event = 'hide';
			removeLayer(layer_name);
		}
		$rootScope.$broadcast('legendEvent',{item:item,event:legend_event});
	}

	function removeLayer(layer_name){
		log("removeLayer("+layer_name+")","info");
		var index = layers.indexOf(layer_name);
		map.removeLayer(layersVars[index]);
		layersVars.splice(layers.indexOf(layer_name), 1);
		layers.splice(layers.indexOf(layer_name), 1);
		if(layers.indexOf(layer_name)===activeLayer){
			setActiveLayer(false);
		}
	}

	//displays
	function displayLayer(layer_name,reload,item,index){
		log("displayLayer("+layer_name+","+reload+")","info");
		var lay     = null;
		var source   = null;
		if(layers.indexOf(layer_name)>-1){
			if(reload && appOnline){
				layersVars[layers.indexOf(layer_name)].getSource().updateParams({"time": Date.now()});
			}
		}else{
			if(appOnline){
				source   = new ol.source.TileWMS({
												url:   urlWMS,

												params: {
															'LAYERS': layer_name,
															'FILTER': layer_name+':\"startdate\"  > \''+initDate+'\'  AND \"startdate\" < \''+endDate+'\''
														}
												});

				lay    = new ol.layer.Tile({
											extent: extent,
											name: layer_name,
											source: source
				});
				if(lay){
					layersVars.push(lay);
					layers.push(layer_name);
					map.addLayer(lay);
					//nofify toc active layer
					if(typeof item!="undefined" && item!="undefined" && typeof index!="undefined" && index!="undefined"){
						mapToc.setActiveLayer(item,index);
						mapToc.markActiveLayer(getActiveLayerName());
					}
				}else{
					log("displayLayer error","error");
				}
			}else{
				/****** render offline layer *******/
				if(mapOffline.offlineDataAvailable()){
					//read geojson from local storage
					$rootScope.$broadcast('offlineEvent',{evt:"renderingEvent",name:layer_name});
					mapOffline.readOfflineGeoJSON(project.project_name+"_"+layer_name+".json",function(err,storedGeoJSON){
						if(err){
							log("readOfflineGeoJSON: "+err,storedGeoJSON,"error");
						}
						if(storedGeoJSON){
							var features   = (new ol.format.GeoJSON()).readFeatures(storedGeoJSON);
							source         = new ol.source.Vector({
															features: features,
															useSpatialIndex: true
														});
														//style layers by geometryType
							var geometryType   = features[0].getGeometry().getType();
							log("Offline layer geometry type: "+geometryType,"info");
							var style = null;
							if(geometryType==="LineString" || geometryType==="MultiLineString"){
								style = new ol.style.Style({
																		fill: new ol.style.Fill({
																			color: 'rgba(97, 215, 123, 0.6)'
																		}),
																		stroke: new ol.style.Stroke({
																			color: '#30d263',
																			width: 5
																		}),
																		text: new ol.style.Text({
																			font: '12px Calibri,sans-serif',
																			fill: new ol.style.Fill({
																				color: '#000'
																			}),
																		stroke: new ol.style.Stroke({
																			color: '#3ac82e',
																			width: 3
																		}),
																	})
																})
							}else if(geometryType==="Point" || geometryType==="MultiPoint"){
								style = new ol.style.Style({
														image: new ol.style.Circle({
														radius: 3,
														fill: new ol.style.Fill({
																	color: '#32CD32'
																})
														})
												});
							}

							lay      = new ol.layer.Vector({
													extent: extent,
													name: layer_name,
													source: source,
											});

							if(style){
								lay.setStyle(style);
							}

							//end render offline layer
							layersVars.push(lay);
							layers.push(layer_name);
							map.addLayer(lay);
							$rootScope.$broadcast('offlineEvent',{evt:"renderEvent",name:layer_name});
							//nofify toc active layer
							if(typeof item!="undefined" && item!="undefined" && typeof index!="undefined" && index!="undefined"){
								mapToc.setActiveLayer(item,index);
								mapToc.markActiveLayer(getActiveLayerName());
							}
						}else{
							$rootScope.$broadcast('offlineEvent',{evt:"no_offline_data",name:layer_name});
							lay = null;
						}
					});
				}else{
					$rootScope.$broadcast('offlineEvent',{evt:"no_offline_data",name:"all"});
				}
			}
		}
	}

	function reloadLayer(layer_name){
		log("reloadLayer("+layer_name+")","info");
		if(appOnline){
			removeLayer(layer_name);
			displayLayer(layer_name);
		}else{
			setTimeout(function(){
				removeLayer(layer_name);
				displayLayer(layer_name);
			},500);
		}
	}

	function reloadDisplayedLayers(){
		log("reloadDisplayedLayers()","info",layers.length);
		for(var i=0;i<layers.length;i++){
			reloadLayer(layers[i]);
		}
	}

	function getPostgresFieldName(alias){
		log("getPostgresFieldName("+alias+")","info");
		for(var i=0;i<layerFieldNames.length;i++){
				if(layerFieldNames[i].alias===alias){
						return {name: layerFieldNames[i].name,type: layerFieldNames[i].type};
						break;
				}
		}
	}

	function getLayerAttributes(layer){
		log("getLayerAttributes("+layer+")","info");
		//replace spaces with _ when WFS version 1.0.0 spaces aren't allowed
		layer = layer.replace(/\s+/g, '_');
		try{
			var url    = urlWMS+"?SERVICE=WFS&VERSION=1.0.0&REQUEST=describeFeatureType&typename="+layer+"&initDate="+initDate+"&endDate="+endDate;
			log("url","info",url);
			$.get(url, function(response, status){
								var json = xml2json(response);
								log("getLayerAttributes("+layer+")","info",json);
								if(json.schema.complexType!=undefined && json.schema.complexType!="undefined"){
						var attributtes   = json.schema.complexType.complexContent.extension.sequence.element;
						//if has photos
						var foto_node_id  = false;
						var retorn       = Array();
						layerFieldNames     = Array();
						var idField      = null;
						for(var i=0; i<attributtes.length;i++){
							if(attributtes[i].name==="id" || attributtes[i].name==="arc_id" || attributtes[i].name==="pol_id" || attributtes[i].name==="node_id"){
								idField      = attributtes[i].name;
							}
							if(attributtes[i].name!="foto_node_id"){
								retorn.push(attributtes[i].name);

							}
							if(attributtes[i].name==="foto_node_id"){
								foto_node_id  = true;
							}
							layerFieldNames.push({name:attributtes[i].name,alias:attributtes[i].alias,type:attributtes[i].type});
						}


						$rootScope.$broadcast('layerAttributesReceived',{"fields":retorn,"idField":idField,"foto_node_id":foto_node_id});
				}else{
						log("Error in getLayerAttributes json doesn't contain schema.complexType node","warn");
				}
			});
		}catch(e){
			log("error in getLayerAttributes("+layer+")","warn")
			$rootScope.$broadcast('displayMapError',{err: "error in getLayerAttributes("+layer+")"});
		}
	}

	function setActiveLayer(layer_name){
		log("setActiveLayer("+layer_name+")","info");
		//select first layer of array, if is available in case we remove activeLayer
		if(layers.indexOf(layer_name)===-1){
			if(layers.length>0){
				activeLayer  = layers[0];
				$rootScope.$broadcast('hideMapError',{err: "No error"});
			}else{
				activeLayer  = null;
				$rootScope.$broadcast('notifyNoActiveLayer',{});
			}
		}else{
			activeLayer = layers.indexOf(layer_name);
			$rootScope.$broadcast('hideMapError',{err: "No error"});
		}

		if(activeLayer!=null){
			$rootScope.$broadcast('notifyActiveLayer',{'activeLayer':activeLayer,"activaLayerName":getActiveLayerName()});
		}
		mapSelectTool.clearHighlight();
	}

	function resetActiveLayer(){
		log("resetActiveLayer() "+ activeLayer,"info");
		activeLayer  = null;
	}
	function getLayersDisplayed(){
		log("getLayersDisplayed: ","info",layers);
		return layers;
	}

	function getActiveLayer(){
		log("getActiveLayer: "+activeLayer,"info");
		return activeLayer;
	}

	function getActiveLayerName(){
		log("getActiveLayerName: activeLayer: "+activeLayer+", name: "+layers[activeLayer],"info");
		return layers[activeLayer];
	}
	//****************************************************************
	//***********************   END  ADD LAYER ***********************
	//****************************************************************

	//****************************************************************
	//***********************     BACKGROUND   ***********************
	//****************************************************************

	function setBackGroundMap(mapname){
		if(mapname==="OSM"){
			onlineBackgroundsource = new ol.source.OSM();
		}else if(mapname==="CartoDBDark"){
			onlineBackgroundsource = new ol.source.XYZ({url:'http://{1-4}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'});
		}else if(mapname==="CartoDBLight"){
			//source = new ol.source.XYZ({url:'http://{1-4}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'});
			onlineBackgroundsource = new ol.source.XYZ({url:'https://cartodb-basemaps-b.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'});
		}else if(mapname==="mtc5m" || mapname==="mtc10m" || mapname==="orto25c" || mapname==="mtc25m" || mapname==="mtc50m" || mapname==="mtc250m" || mapname==="mtc500m" || mapname==="mtc1000m" || mapname==="orto10c" || mapname==="orto25c" || mapname==="orto5m" || mapname==="orto25m" || mapname==="ortoi25c" || mapname==="ortoi5m" || mapname==="ortoi25m" || mapname==="sat250m"){
			onlineBackgroundsource = new ol.source.TileWMS({url:'http://geoserveis.icc.cat/icc_mapesbase/wms/service?layers='+mapname+'&srs='+epsg});
		}else if(map==="google"){
			onlineBackgroundsource = new ol.source.OSM({
										url: 'https://mt{0-3}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
							attributions: [
								new ol.Attribution({ html: '© Google' }),
								new ol.Attribution({ html: '<a href="https://developers.google.com/maps/terms">Terms of Use.</a>' })
							]
								})
		}else if(mapname==="none"){
			onlineBackgroundsource = null;
		}else if(mapname==="topo" || mapname==="orto"){
			onlineBackgroundsource = new ol.source.TileWMS({url:'https://mapcache.icc.cat/map/bases/service?layers='+mapname+'&srs='+epsg});
		}else if(mapname==="iccwmts"){
				$http({method: "GET", url:"https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wmts/service?service=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities"})
					.success(function(data){
							//try{
							var parser = new ol.format.WMTSCapabilities();
							var result = parser.read(data);
							var options = ol.source.WMTS.optionsFromCapabilities(result, {
								layer:"topogris",
								matrixSet: 'UTM25831',

							});
							options.urls[0] = "https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wmts/service";
							onlineBackgroundsource                   = new ol.source.WMTS(/** @type {!olx.source.WMTSOptions} */ (options));
							raster.setSource(onlineBackgroundsource);

					/*  }catch(e){
							alert(project.project_name+" doesn't exists or is not responding in qgis_mapserv.fcgi or there's an error parsing xml:\n"+e);
						}*/
					}
				);


		}else if(mapname==="pnoawmts"){
			var parser = new ol.format.WMTSCapabilities();
			fetch('https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wmts/service?').then(function(response) {
				return response.text();
			}).then(function(text) {
				var result = parser.read(text);
				var options = ol.source.WMTS.optionsFromCapabilities(result, {
					layer: 'orto',
					matrixSet: 'UTM25831'
				});
			});
			onlineBackgroundsource = new ol.source.WMTS((options));
		}
		raster.setSource(onlineBackgroundsource);
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
		log("addTemporalGeometry("+geometry+","+source+")","info",geometry);
		if(typeof geometry!="undefined"){
			notificationEffect  = true;
			var iconFeature   = new ol.Feature({
													geometry: geometry
									});
			var geomType    = iconFeature.getGeometry().getType();
			iconFeature.setStyle(addStyle);
			vectorSource.addFeature(iconFeature);
			if(typeof activeLayer!="undefined"){
				displayLayer(getActiveLayerName(activeLayer),true);
			}
			//after 5 seconds I remove the added geometry
			setTimeout(function(){
				vectorSource.removeFeature(iconFeature);
			}, 5000);
		}
	}

	//receives geometry from websocket
	function addSocketGeometry(geom,geomProjection,layer_name,source){
		log("addSocketGeometry("+geom+","+geomProjection+","+layer_name+","+source+")","info");
		if(layers.indexOf(layer_name)!=-1){
			var format      = new ol.format.WKT({});
			var rawGeometry    = format.readGeometry(
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
			notificationEffect  = false;
			duration       = 3000;
			start         = new Date().getTime();
			listenerKey = map.on('postcompose', animate);
		}
	}

	function animate(event) {
		var vectorContext   = event.vectorContext;
		var frameState     	= event.frameState;
		var flashGeom     	= addFeautureForAnimate.getGeometry().clone();
		var elapsed     		= frameState.time - start;
		var elapsedRatio   	= elapsed / duration;
		// radius will be 5 at start and 30 at end.
		var radius       		= ol.easing.easeOut(elapsedRatio) * 25 + 5;
		var opacity     		= ol.easing.easeOut(1 - elapsedRatio);
		var flashStyle     	= new ol.style.Style({
														image: new ol.style.Circle({
														radius: radius,
														snapToPixel: false,
														stroke: new ol.style.Stroke({
															color: 'rgba(255, 0, 0, ' + opacity + ')',
															width: 1,
															opacity: opacity
														})
													})
												});

		vectorContext.setStyle(flashStyle);
		vectorContext.drawGeometry(flashGeom, null);
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
		log("editGeometry(), editing: "+editing,"info");
		if(!editing){
			editing = true;
			mapAddTool.editGeometry(mapSelectTool.getSelectedFeauture());
		}
	}

	function endEditGeometry(){
		if(editing){
			log("endEditGeometry()","info");
			mapAddTool.endEditGeometry();
			mapSelectTool.clearHighlight();
			editing  = false;
		}
	}

	//****************************************************************
	//***********************  END EDIT GEOMETRY    ******************
		//****************************************************************

	function featureDeleted(geometry){
		log("featureDeleted()","info",geometry);
		mapSelectTool.clearHighlight();
		if(typeof activeLayer!="undefined"){
			displayLayer(getActiveLayerName(activeLayer),true);
		}
	}

	//****************************************************************
	//***********************        TOOLS        ********************
	//****************************************************************

	//simulate a click on the map for selecting a point
	function doInfoFromCoordinates(clickedCooordinates,feauture_id,layers){
		log("doInfoFromCoordinates()","info",clickedCooordinates);
		mapSelectTool.selectPoint(clickedCooordinates,getMapData(),map.getView().getResolution(),layers,feauture_id);
	}

	//selects the tool for map edition
	function setTool(tool,option){
		log("setTool("+tool+","+option+"), toolSelected: "+toolSelected,"info");

		if((toolSelected==="point" || toolSelected==="MultiPoint" || toolSelected==="Point") && tool===null){
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
			}else if(tool==="point" || tool==="Point"){
				if(useGeolocation===1){
					$rootScope.$broadcast('reset-tools',{tool:tool});
					mapAddTool.addPoint(geolocation.getPosition(),tool);
				}
			}else if(tool==="LineString" || tool==="MultiLineString" || tool==="Polygon"){
				mapAddTool.resetAddTools();
			}else if(tool==="measureLine" || tool==="measureArea"){
				mapMeasureTools.initMeasure(option);
				vectorLayer.setStyle(measureStyle);
			}
		}else{
			tool = null;

		}
		toolSelected  = tool;
		toolMode    	= option;    //set toolMode if is defined
		if(useGeolocation!==1){
			$rootScope.$broadcast('reset-tools',{tool:toolSelected});
		}
		if(!appOnline){
			$rootScope.addPointDisabled			= true;
			$rootScope.addLineDisabled			= true;
			$rootScope.addPopolygonDisabled	= true;
		}


	}
	//****************************************************************
	//***********************      END TOOLS      ********************
		//****************************************************************

	//****************************************************************
	//***************         GEOLOCATION TOOL       *****************
	//****************************************************************

	function trackPosition(){
		log("trackPosition() -","info",trackingPosition);
		if(trackingPosition===null){
			log("trackPosition() Initializing","info");
			$rootScope.$broadcast('geoLocalizeEvent',{evt:'GEOLOCATING'});
			trackingPosition = new ol.Geolocation({
				projection: map.getView().getProjection()
			});

			trackingPosition.setTracking(true);
			var accuracyFeature = new ol.Feature();
			trackingPosition.on('change:accuracyGeometry', function() {
				accuracyFeature.setGeometry(trackingPosition.getAccuracyGeometry());
			});

			var positionFeature = new ol.Feature();
			positionFeature.setStyle(new ol.style.Style({
																image: new ol.style.Circle({
																radius: 6,
																fill: new ol.style.Fill({
																	color: '#3399CC'
																}),
																stroke: new ol.style.Stroke({
																	color: '#fff',
																	width: 2
																})
															})
														})
													);

			trackingPosition.on('change:position', function() {
				log("trackPosition() -> geolocaction change:position","info");
				var coordinates = trackingPosition.getPosition();
				positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
				if(!geoLocalizedNotificate){
					$rootScope.$broadcast('geoLocalizeEvent',{evt:'GEOLOCATED'});
					geoLocalizedNotificate = true;
				}
			});

			trackingPosition.on('change', function() {
				log("trackPosition() -> geolocaction change()","info");
			});

			trackingPosition.on('error', function(error) {
				$rootScope.$broadcast('geoLocalizeEvent',{evt:'GEOLOCATION_ERROR'});
				log("trackPosition() -> geolocaction error: "+error.message),"warn";
			});

			//markers & temporal geometry
			trackVectorSource    = new ol.source.Vector({});
			trackVectorLayer     = new ol.layer.Vector({
															source: trackVectorSource
														});
			trackVectorSource.addFeature(positionFeature);
			trackVectorSource.addFeature(accuracyFeature);
			map.addLayer(trackVectorLayer);
		}else{
			log("trackPosition() stopping","info");
				trackingPosition.setTracking(false);
				trackingPosition     = null;
				map.removeLayer(trackVectorLayer);
				trackVectorSource    = null;
				trackVectorSource    = null;
				geoLocalizedNotificate  = false;
			}
	}

	function getHeading(){
		log("getHeading()","info");
		if(trackingPosition!==null){
			if(typeof trackingPosition.getHeading()!="undefined"){
				log("getHeading() geolocated: ","info",trackingPosition.getHeading());
				return trackingPosition.getHeading();
			}else{
				log("getHeading() geolocated:couldn't extract heading","warn");
				return 0.00;
			}
		}else{
			return 0.00;
		}
	}
	//****************************************************************
	//***************      END GEOLOCATION TOOL       ****************
	//****************************************************************

	//****************************************************************
	//******************           OFFLINE              **************
	//****************************************************************

	function offlineShowSavedAreas(){
		log("offlineShowSavedAreas()","info");
		mapOffline.showSavedAreas(map);
	}

	function offlineHideSavedAreas(){
		log("offlineHideSavedAreas()","info")
		mapOffline.hideSavedAreas(map);
	}

	function offlineSelectAreaToDownload(meters){
		log("offlineSelectAreaToDownload("+meters+")","info");
		if(typeof meters=="undefined"){
			meters = 2500;
		}
		mapOffline.selectAreaToDownload(meters,map);
	}
	function offlineConfigure(){
		log("offlineConfigure()","info");
		mapOffline.offlineConfigure(map);
	}

	function offlineStartDownload(){
		log("offlineStartDownload()","info");
		mapOffline.save(map,layersVars);
	}

	function OfllineGetAvailableGeoJson(ajax_target,project_name,token){
		log("OfllineGetAvailableGeoJson("+ajax_target+","+project_name+","+token+")","info");
		mapOffline.getAvailableGeoJson(ajax_target,project_name,token,map);
	}

	//checking offline/online
	function updateOnlineStatus(e){
		if(!offlineForced){
			log("updateOnlineStatus() - App online","info");
			appOnline       = true;
			//maybe set a delay here???
			setOnlineMode();
		}else{
			log("updateOnlineStatus() - offline forced!","info");
		}
	}

	function updateOfflineStatus(e){
		log("updateOfflineStatus() - App offline","info");
		setOfflineMode();
	}

	function offlineReset(){
		log("offlineReset()","info");
		if(confirm(localized_strings.OFFLINE_RESET_CONFIRMATION)){
			mapOffline.offlineReset();
		}
	}
	function getOfflineInfo(){
		log("getOfflineInfo()","info");
		return mapOffline.getOfflineInfo();
	}

	function setOfflineMode(){
		log("setOfflineMode()","info");
		appOnline       = false;
		$rootScope.$broadcast('appOnline',{status: appOnline});
		if(mapOffline.offlineBackgroundAvailable() || mapOffline.offlineDataAvailable()){
			//load offline background
			mapOffline.displayBackground(raster,extent);
			reloadDisplayedLayers();
		}
	}

	function setOnlineMode(){
		log("setOnlineMode()","info");
		appOnline      = navigator.onLine;
		if(appOnline){
			raster.setSource(null);
			mapOffline.hideBackground();
			reloadDisplayedLayers();
			$rootScope.$broadcast('appOnline',{status: appOnline});
			raster.setSource(onlineBackgroundsource);
		}
	}

	function clearOfflineVisits(){
		log("clearOfflineVisits","info");
		mapOffline.clearOfflineVisits();
	}

	function getOnlineStatus(){
		return appOnline;
	}

	function getVisitsPendingDump(){
		log("getVisitsPendingDump()","info");
		if(mapOffline.getCachedVisits().length>0){
			return true;
		}else{
			return false;
		}
	}

	function offlineDumpData(ajax_target){
		log("offlineDumpData("+ajax_target+")","info");
		mapOffline.setAjaxMethods(ajax_target,mapAjaxOperations.addVisit,mapAjaxOperations.addVisitInfo,mapPhotos)
		mapOffline.dumpData();
	}

	function forceOffline(){
		log("forceOffline()","info");
		if(offlineForced){
			offlineForced = false;
			setOnlineMode();
		}else{
			setOfflineMode();
			offlineForced = true;
		}
		log("offlineForced: "+offlineForced,"info");
		return offlineForced;
	}
	//****************************************************************
	//******************          END OFFLINE           **************
	//****************************************************************

	//****************************************************************
	//**************     PHOTOS MODULE INTERFACE    ******************
	//****************************************************************
	function photosAddPhoto(photo_id,heading){
		mapPhotos.addPhoto(photo_id,heading);
	}

	function photosShowPhoto(ajax_target,photo_id,okCb,koCb){
		mapPhotos.showPhoto(ajax_target,photo_id,okCb,koCb);
	}

	function photosSavePicture(ajax_target,visit_id,preview,callback){
		if(appOnline){
			mapPhotos.savePicture(ajax_target,visit_id,preview,callback);
		}else{
			mapOffline.savePicture(visit_id,preview,callback);
		}
	}

	function photosDeletePhoto(ajax_target,photo_id,layer_name,pol_id,tableIdName,cbOk,cbKo){
		mapPhotos.deletePhoto(ajax_target,photo_id,layer_name,pol_id,tableIdName,cbOk,cbKo);
	}

	function photosGetLists(){
		return mapPhotos.getLists();
	}

	function photosReset(){
		mapPhotos.resetLists();
	}
	//****************************************************************
	//**************  END PHOTOS MODULE INTERFACE    *****************
	//****************************************************************

	//****************************************************************
	//**************       AJAX MODULE INTERFACE    ******************
	//****************************************************************

	function ajaxGetFormDataForVisitForm(ajax_target,token,okCb,koCb){
		mapAjaxOperations.getFormDataForVisitForm(ajax_target,token,okCb,koCb);
	}
	function ajaxGetProjectInfo(ajax_target,token,project_id,okCb,koCb){
		mapAjaxOperations.getProjectInfo(ajax_target,token,project_id,okCb,koCb)
	}
	function ajaxAddGeometry(ajax_target,epsg,tableIdName,layer,geom,photo,editableAttributes,okCb,koCb){
		mapAjaxOperations.addGeometry(ajax_target,epsg,tableIdName,layer,geom,photo,editableAttributes,okCb,koCb);
	}
	function ajaxUpdateFeatureField(ajax_target,id,tableIdName,epsg,fieldName,value,layer,okCb,koCb){
		var postgresDbField     = getPostgresFieldName(fieldName);
		mapAjaxOperations.updateFeatureField(ajax_target,id,tableIdName,epsg,postgresDbField,value,layer,okCb,koCb);
	}
	function ajaxDeleteElement(ajax_target,id,layer,tableIdName,geom,okCb,koCb){
		mapAjaxOperations.deleteElement(ajax_target,id,layer,tableIdName,geom,okCb,koCb);
	}
	function ajaxAddVisit(ajax_target,epsg,pol_id,coordinates,layer,callback){
		if(appOnline){
			mapAjaxOperations.addVisit(ajax_target,epsg,pol_id,coordinates,layer,callback);
		}else{
			//mock addVisit request
			mapOffline.addVisit(epsg,pol_id,coordinates,layer,callback);
		}
		mapPhotos.resetLists();
	}
	function ajaxAddVisitInfo(ajax_target,visit_id,heading,formData,photo,okCb,koCb){
		var photos 							= mapPhotos.getLists();
		if(appOnline){
			mapAjaxOperations.addVisitInfo(ajax_target,visit_id,heading,formData,photos.photos,photos.compasses,photo,okCb,koCb);
		}else{
			//mock getVisit request
			mapOffline.addVisitInfo(visit_id,heading,formData,photos.photos,photos.compasses,photo,okCb,koCb);
		}
	}
	function ajaxGetVisit(ajax_target,element_id,layer,extraData,okCb,koCb){
		if(appOnline){
			mapAjaxOperations.getVisit(ajax_target,element_id,layer,extraData,okCb,koCb);
		}else{
			//mock getVisit request
			mapOffline.getVisit(element_id,layer,extraData,okCb,koCb);
		}
	}
	function ajaxRemoveVisit(ajax_target,visit_id,okCb,koCb){
		if(appOnline){
			mapAjaxOperations.removeVisit(ajax_target,visit_id,okCb,koCb);
		}else{
			//mock removeVisit request
			mapOffline.removeVisit(visit_id,okCb,koCb);
		}
	}
	function ajaxRemoveEvent(ajax_target,visit_id,event_id,callback){
		if(appOnline){
			mapAjaxOperations.removeEvent(ajax_target,visit_id,event_id,callback);
		}else{
			//mock removeEvent request - called from visits layer, no implemented offline, yet
			//mapOffline.removeEvent(visit_id,event_id,callbackb);
		}
	}
	function ajaxGetVisitInfo(ajax_target,visit_id,okCb,koCb){
		mapAjaxOperations.getVisitInfo(ajax_target,visit_id,okCb,koCb)
	}
	//****************************************************************
	//**************     END AJAX MODULE INTERFACE    ****************
	//****************************************************************


	//****************************************************************
	//***********************      HELPERS      **********************
	//****************************************************************

	//inject dependency dynamiclly
	function injectDependency(name,dependency){
		if(name==="mapToc"){
			mapToc = dependency;
		}
	}

	//zoom to extent
	function zoomToExtend(){
		map.getView().fit(extent, map.getSize());
	}

	//gets map info for displaying it
	function getMapData(){
		var mapData       	 	= {}
		mapData.epsg      		= epsg;
		mapData.extent      	= extent;
		mapData.layers      	= layers;
		mapData.layersVars    = layersVars;
		mapData.activeLayer   = activeLayer;
		return mapData;
	}

	function getclickedCooordinates(){
		return clickedCooordinates;
	}
	//activate/desactivate geolocation
	function setUseGeolocation(what){
		log("setUseGeolocation("+what+")","info");
		useGeolocation   = what;
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
		log("setMaxFeatures("+number+")","info");
		if(!isNaN(number)){
			max_features = number;
			mapSelectTool.setMaxFeatures(max_features);
		}
	}

	//sets websocket connection status
	function setSocket(status){
		log("setSocket("+status+")","info");
		ws_status  = status;
	}

	function resize(){
		log("resize()","info");
		if(map){
			map.updateSize();
		}
	}

	function cleanGeometries(what,resetTool){
		log("cleanGeometries("+what+")","info");
		//Reset tools if a tool is selected
		if(resetTool===null){
			setTool(null);
		}
		if(what==="all"){
			vectorSource.clear();
			mapSelectTool.clearHighlight();
			mapAddTool.resetAddTools();
			map.getOverlays().forEach(function (lyr) {
				map.removeOverlay(lyr);
			});
		}else if(what==="selected"){
			mapSelectTool.clearHighlight();
		}
	}

	function setInitEndDates(_initDate,_endDate){
		log("setInitEndDates("+_initDate+","+_endDate+")","info");
		var day     = _initDate.getDate();
		var month   = ("0" + (_initDate.getMonth() + 1)).slice(-2);
		var year    = _initDate.getFullYear();
		initDate    = year+"-"+month+"-"+day;
		var day     = _endDate.getDate();
		var month   = ("0" + (_endDate.getMonth() + 1)).slice(-2);
		var year    = _endDate.getFullYear();
		endDate     = year+"-"+month+"-"+day;;
	}

	function getFormatedFilterDates(){
		var retorn = {};
		retorn.initDate 	= initDate;
		retorn.endDate		= endDate;
		return retorn;
	}

	function resetAddTools(){
		log("resetAddTools()","info");
		mapAddTool.resetAddTools();
	}

	//fix styles for geometric overlays
	function setStyles(geom_colors){
		log("setStyles()","info",geom_colors);
		measureStyle    = new ol.style.Style({
										fill: new ol.style.Fill({
												color: geom_colors.measure_fill_color
										}),
										stroke: new ol.style.Stroke({
												color: geom_colors.measure_stroke_color,
												lineDash: [10, 10],
												width: 2
											})
							});

		selectStyle      = new ol.style.Style({
										fill: new ol.style.Fill({
												color: geom_colors.select_stroke_color,
												width: 2
										}),
										stroke: new ol.style.Stroke({
												color: geom_colors.select_fill_color
										})
							});

		addStyle      = new ol.style.Style({
												fill: new ol.style.Fill({
													color: geom_colors.edit_fill_color
												}),
												stroke: new ol.style.Stroke({
													color: geom_colors.edit_stroke_color,
													//lineDash: [10, 10],
													width: 2
												}),
												image: new ol.style.Icon(({
													anchor: [0.5, 4],
													anchorXUnits: 'fraction',
													anchorYUnits: 'pixels',
													opacity: 1,
													src: '../../js/dist/point.png'
												}))
								});

	}

	//log function
	function log(evt,level,data){
		if(typeof level=="undefined"){
			level = "log";
		}
		$rootScope.$broadcast('logEvent',{evt:evt,extradata:data,file:filename+" v."+version,level:level});
	}

	function getLocalizedStringValue(constant){
		return localized_strings[constant];
	}
	//****************************************************************
	//***********************    END HELPERS    **********************
	//****************************************************************
}])
})();
(function() {
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
		measuringMode			= null, //store measureLine or measureArea
		drawStartEvent			= null,
		drawEndEvent			= null,
		geom_colors				= null,
		touchDevice				= 0,
		measureCount			= 0,		//number of measures done, used or activate the tool again
		token					= null;

	// public API
	var dataFactory 				= {
										init: 						init,
										initMeasure:			initMeasure,
										endMeasure:				endMeasure,
										getMeasureCount:	getMeasureCount

						};
	return dataFactory;

	//****************************************************************
	//***********************       INIT       ***********************
		//****************************************************************

	function init(_map,_epsg,_viewProjection,_vectorSource,_vectorLayer,_token,_app_name,_geom_colors,_touchDevice,localized_strings){
		map									= _map;
		viewProjection			= _viewProjection;
		token								= _token;
		vectorSource				= _vectorSource;
		vectorLayer					= _vectorLayer;
		app_name						= _app_name;
		epsg								= epsg;
		geom_colors					= _geom_colors;
		touchDevice					= _touchDevice;
		continuePolygonMsg	= localized_strings.CLICK_TO_CONTINUE_DRAWING_POLYGON;
		continueLineMsg			= localized_strings.CLICK_TO_CONTINUE_DRAWING_LINE;
		initialMsg					= localized_strings.CLICK_TO_START_DRAWING;
		helpMsg							= initialMsg;
		drawStyle						= new ol.style.Style({
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
				isMeasuring		= true;
				measuringMode 	= mode;
				measureCount	= 0;
			}
		}

		function endMeasure(){
			log("endMeasure()");
			map.un(pointerMoveListener);
			if(drawStartEvent){
				draw.un(drawStartEvent);
			}
			if(draw){
				map.removeInteraction(draw);
			}
			map.removeOverlay(helpTooltipElement);
			sketch								= null;
			drawStartEvent				= null;
			drawEndEvent					= null;
			isMeasuring 					= false;
			draw									= null;
			pointerMoveListener		= null;
			if (helpTooltipElement) {
				helpTooltipElement.parentNode.removeChild(helpTooltipElement);
			}
			helpTooltipElement		= null;
			measureTooltipElement	= null;
		}

	//****************************************************************
	//***********************   	   MEASURE        ******************
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
			if(typeof measureTooltipElement!="undefined" && measureTooltipElement){
				measureTooltipElement.innerHTML = output;
			}
			if(typeof measureTooltip!="undefined" && measureTooltip){
				measureTooltip.setPosition(tooltipCoord);
			}
		}
		if(typeof helpTooltipElement!="undefined" && helpTooltipElement){
			helpTooltipElement.innerHTML = helpMsg;
		}
		if(typeof helpTooltip!="undefined" && helpTooltip){
			helpTooltip.setPosition(evt.coordinate);
		}
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
			log(pointerMoveListener)
			map.un(pointerMoveListener);
				if(drawStartEvent){
					draw.un(drawStartEvent);
				}
				if(drawEndEvent){
					draw.un(drawEndEvent);
				}
				map.removeInteraction(draw);
			isMeasuring	= false;
			measureCount++;
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
		helpTooltipElement 						= document.createElement('div');
		helpTooltipElement.className 	= 'tooltipbase';
		helpTooltip 									= new ol.Overlay({
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

	/**
	* Returns the number of measures done, used for reactivate the tool
	*/

	function getMeasureCount(){
		log('getMeasureCount() '+measureCount);
		return measureCount;
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

	var filename 						= "mapSelectTool.js",
		app_name							= null,
		viewProjection 				= null,
		viewResolution				= null,
		vectorSource					= null,
		map 									= null,
		epsg									= null,
		canAddPoint						= true,
		dragBox								= null,  		//drag box for select area
		urlWMS								= null,
		vectorSourceForPoints	= null,
		vectorLayerForPoints	= null,
		pointCoordinates			= null,
		highLightLayer				= null,			//layer for highlighted town
		highLightSource				= null,			//source for highlifgted polygon
		multipleSelection			= null,
		highlightedLayers			= Array(),
		selectedFeatures			= Array(),	//array with selected features info
		max_features					= null,			//limit of features for queries
		token									= null,
		geom_colors						= {},			//object with color customization for select/edit geometries
		touchDevice						= 0,			//0 no touch device, 1 touch device (mobiler or tablet)
		sensibilityFactor			= 3,			//sensibility factor to increase tolerance on clic/touch
		selectedFeauture			= null;		//selected feauture for edit/delete methods
	// public API
	var dataFactory 				= {
										init: 								init,
										selectPoint:					selectPoint,
										selectPointOffline:		selectPointOffline,
										selectArea:						selectArea,
										removeSelectArea:			removeSelectArea,
										setMultiple:					setMultiple,
										highLightGeometry:		highLightGeometry,
										clearHighlight:				clearHighlight,
										setMaxFeatures:				setMaxFeatures,
										getSelectedFeauture: 	getSelectedFeauture
						};
	return dataFactory;

	//****************************************************************
	//***********************       INIT       ***********************
		//****************************************************************

	function init(_map,_epsg,_viewProjection,_viewResolution,_vectorSource,_token,_app_name,_urlWMS,_max_features,_geom_colors,_touchDevice){
		map								= _map;
		epsg							= _epsg;
		viewProjection		= _viewProjection;
		viewResolution		= _viewResolution;
		vectorSource			= _vectorSource;
		token							= _token;
		app_name					= _app_name;
		urlWMS						= _urlWMS;
		max_features			= _max_features;
		geom_colors				= _geom_colors;
		touchDevice     	= _touchDevice;
		if(touchDevice!=0){
				sensibilityFactor = 20;
		}

		log("init("+_map+","+_epsg+","+_token+","+_app_name+","+_geom_colors+","+_touchDevice+")","info");
		log("sensibilityFactor: "+sensibilityFactor,"info");

		vectorSourceForPoints 	= new ol.source.Vector({});
		vectorLayerForPoints 		= new ol.layer.Vector({
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
		log("selectArea()","info",mapData);

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
				log("selectArea Extent:","info",dragBoxExtent)
				log("MAP EPSG:","info",epsg)
				var extent = ol.proj.transformExtent(dragBoxExtent, epsg, 'EPSG:25831');
				log("selectArea Extent transformed:","info",extent);
				var url		= urlWMS+"?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&typeName="+mapData.layers[mapData.activeLayer]+"&bbox="+ extent.join(',') + "&outputFormat=GeoJSON&maxFeatures="+max_features;
				log("url","info",url);


				$.get(url, function(response, status){
					//clean anti slash
					response 	= response.replace(/[/\\*]/g, "|");
					response	= JSON.parse(response);
					log("geoJSON","info",response);
					selectedFeatures	= Array();
					clearHighlight();
					multipleSelection	= true;

					var geojsonFormat = new ol.format.GeoJSON();
					var newFeatures = geojsonFormat.readFeatures(response);

					log("WFS features","info",newFeatures)
					for(var i=0;i<newFeatures.length;i++){
						log("Feature","info",response.features[i]);
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
								log("Couldn't find geometry in feature attributes","warn");
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
			log("selectArea no layer rendered","info");
			$rootScope.$broadcast('displayMapError',{err: "You must select a layer"});
			multipleSelection	= false;
		}
	}

	function removeSelectArea(){
		log("removeSelectArea()","info");
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
	function selectPointOffline(pixel,clickedCooordinates,layer_name){

		log("selectPointOffline "+pixel+", clickedCooordinates: "+clickedCooordinates+" layer: "+layer_name,"info");
		if(!multipleSelection){
			clearHighlight();
		}
		//var feature = map.getClosestFeatureToCoordinate(clickedCooordinates);
		var feature = map.forEachFeatureAtPixel(pixel,
			function(feature, layer) {
				return feature;
			},
			{
				hitTolerance: 5
			}
		);
		if (feature) {
			log("selectPointOffline feature found","success",feature);
			var coordinates = feature.getGeometry().getCoordinates();
			var Attributes	= [];
			var properties 	= feature.getProperties();
			for (var o in properties) {
				if(o!="geometry"){
					Attributes.push({name:o,value:properties[o]});
				}
			}
			var ol3Geom 					= feature.getGeometry();
			var format 						= new ol.format.WKT();
			var wktRepresenation  = format.writeGeometry(ol3Geom);
			Attributes.push({name:'geometry',value:wktRepresenation});
			selectFeature(feature,Attributes,coordinates,layer_name);
		}
	}

	function selectPoint(coordinates,mapData,_viewResolution,layerList,feature_id){
		log("selectPoint() multipleSelection: "+multipleSelection+" resolution: "+_viewResolution,"info",coordinates);

		//update resolution on each click!
		viewResolution = _viewResolution;
		if(!multipleSelection){
			clearHighlight();
		}
		var infoOptionsObj = {
				'INFO_FORMAT': 'text/xml'
		}
		if(typeof layerList!="undefined"){
			log("selectPoint() feature_id: "+feature_id+" layerList: ","info",layerList);
			infoOptionsObj['QUERY_LAYERS'] = layerList;
		}

		if(mapData.layersVars.length>0){
			$rootScope.$broadcast('featureInfoRequested',{});
			if(typeof mapData.layersVars[mapData.activeLayer]!="undefined"){
				var selectableLayer = mapData.layersVars[mapData.activeLayer];
				var url = selectableLayer.getSource().getGetFeatureInfoUrl(
												coordinates, viewResolution*sensibilityFactor, viewProjection,
												infoOptionsObj
				);
			}else{
				var url = false;
				$rootScope.$broadcast('displayMapError',{err: "Layer is not selectable"});
			}
			if (url) {
				log("selectPoint url","info",url);
				var parser = new ol.format.GeoJSON();
				$http.get(url).success(function(response){
						var json = xml2json(response);
						log("selectPoint xml2json",'info',json);
						//Broadcast event for data rendering
						var returnData			= {}
						returnData.Attributes	= false;
						try{
							if(typeof json.GetFeatureInfoResponse!== 'undefined' || json.GetFeatureInfoResponse!=""){
								if(typeof json.GetFeatureInfoResponse.Layer.length==="undefined"){
									if(typeof json.GetFeatureInfoResponse.Layer.Feature != 'undefined'){
										if(typeof json.GetFeatureInfoResponse.Layer.Feature.Attribute != 'undefined'){
											var feauture 		= json.GetFeatureInfoResponse.Layer.Feature;
											selectFeature(feauture,feauture.Attribute,coordinates,json.GetFeatureInfoResponse.Layer.name);
										}
									}
								}else{
									log("GetFeatureInfoResponse from doInfoFromCoordinates",'info',json.GetFeatureInfoResponse);
									for(var i=0;i<json.GetFeatureInfoResponse.Layer.length;i++){
										if(typeof json.GetFeatureInfoResponse.Layer[i].Feature != 'undefined'){
											if(typeof json.GetFeatureInfoResponse.Layer[i].Feature.Attribute != 'undefined'){
												var feauture 		= json.GetFeatureInfoResponse.Layer[i].Feature;
												if(feauture.Attribute[0].value==feature_id){
													selectFeature(feauture,feauture.Attribute,coordinates,json.GetFeatureInfoResponse.Layer[i].name);
													break;
												}
											}
										}
									}
								}
							}
						}catch(e){
							log("Couldn't find info in json","warn");
						}
					});
				}
			}else{
					log("selectPoint no layer rendered","warn");
					$rootScope.$broadcast('displayMapError',{err: "You must select a layer"});
			}
	}

	function selectFeature(feature,Attributes,coordinates,layer_name){
		log("selectFeature("+coordinates+","+layer_name+")","info",Attributes);
		var pol_id									= Attributes[0].value;
		var pol_id_name							= Attributes[0].name;
		var featureAlreadySelected	= featureIsSelected(pol_id);
		//if is not selected, add the feature to array and map
		if(featureAlreadySelected===-1){
			var item = {
							"pol_id"			: pol_id,
							"pol_id_name"	: pol_id_name,
							"Attributes"	: Attributes,
							"lat"					: coordinates[0],
							"lon"					: coordinates[1],
							"layer"				: layer_name,
							"foto_node_id"	: null
			}
			//If exists add foto_node_id (object with features photos)
			var foto_node_id	= findByName(Attributes, "foto_node_id");
			if(typeof foto_node_id != 'undefined'){
				item.foto_node_id = foto_node_id;
			}
			try{
				var raw_geometry 	= findByName(Attributes, "geometry")
				//generate geometry
				var format					= new ol.format.WKT({});
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
				log("Couldn't find geometry in feature attributes","warn");
			}
			selectedFeatures.push(item);
		}else{
			//if is already selected, remove it
			if(multipleSelection){
				selectedFeatures.splice(featureAlreadySelected, 1);
				removeGeometryFromMap(highlightedLayers[featureAlreadySelected],featureAlreadySelected);
			}
		}
		//************** Send data to DOM
		$rootScope.$broadcast('featureInfoReceived',selectedFeatures);
	}


	function setMultiple(mode){
		log("setMultiple("+mode+")","info");
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
		log("highLightGeometry("+geometryType+")","info");
		var _myStroke = new ol.style.Stroke({
							color : geom_colors.select_stroke_color,
							width : 2
						});

		var _myFill = new ol.style.Fill({
							color: geom_colors.select_fill_color
						});

		var myStyle = new ol.style.Style({
							stroke : _myStroke,
							fill : _myFill,
							image: new ol.style.Icon(({
													anchor: [0.5,4],
													anchorXUnits: 'fraction',
													anchorYUnits: 'pixels',
													opacity: 1,
													src: '../../js/dist/point.png'
												}))
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
		log("setMaxFeatures("+number+")","info");
		if(!isNaN(number)){
			max_features = number;
		}
	}

	//return selectedfeature
	function getSelectedFeauture(){
		return selectedFeauture;
	}
	//log function
	function log(evt,level,data){
		$rootScope.$broadcast('logEvent',{evt:evt,extradata:data,file:filename,level:level});
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

		lastGeometry					= null,
		dragInteraction 		= null,
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
										src: '../../js/dist/marker.png'
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
													anchor: [0.5, 4],
													anchorXUnits: 'fraction',
													anchorYUnits: 'pixels',
													opacity: 1,
													src: '../../js/dist/point.png'
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

	function addPoint(coordinates,type){
		log("addPoint: "+coordinates+", canAddPoint: "+canAddPoint+", type: "+type);
		if(canAddPoint){
			pointCoordinates	= coordinates;
			$rootScope.$broadcast('addPointCoordinates',{coord: pointCoordinates});
			var geomType 			= null;    //store geometry type in var for Point or multipoint selection
			if(type==="MultiPoint"){
				geomType = new ol.geom.MultiPoint([coordinates]);
			}else{
				geomType = new ol.geom.Point(coordinates);
			}
			var iconFeature = new ol.Feature({
										geometry: geomType
							});
			iconFeature.setStyle(iconStyle);

			//add target box to vector source
			vectorSource.addFeature(iconFeature);
			notifyGeometry(iconFeature.getGeometry());

			//add initial point
			lastGeometry 	= coordinates;
			notifyGeometry(geomType);

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

			dragInteraction = new ol.interaction.Modify({
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
		//var geometry		= new ol.geom.Point(pointCoordinates);

		var geometry 	= new ol.geom.Point(lastGeometry);
		resetAddTools();
		pointCoordinates	= null;
		lastGeometry			= null;
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
			log('addInteraction()',type);
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
	//******************  	END ADD LINE/POLYGON    *****************
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
		if(dragInteraction){
			map.removeInteraction(dragInteraction);
			dragInteraction = null;
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
			log("notifyGeometry()",geometry.getType());
			var format	= new ol.format.WKT({});
		 	var rawGeometry	= format.writeGeometry(geometry);
			lastGeometry 		= geometry.getCoordinates();
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
(function() {
	'use strict';
	/**
	 * Module for offline

	 Author: Leandro Lopez-Guerrero Hirsch
	 @Leo_lopezg
	 Version: 1.0.0
	 July 2012

		******************************************************************************************************

		Available methods:

		- init
				initializes module
					@param _proxyUrl (string) wmtms proxy url
					@param _touchDevice (int)

		- offlineDataAvailable
				get if there is offline data downloaded to local storage

		- getOfflineInfo
				gets info about stored info (extent, dates, ...)
					@return JSON

		- offlineReset
				resets storage

		- getEventId
				get last event id stored
					@return id(int)

		- setEventId
				set new event id and stores it
					@param id(int)

		- savePicture
				stores a photo (metadata in localStorage, binary in indexDb)

				@param visit_id(string)
				@param preview(binary)
				@param callback(function)

			*************** Background methods **************

		- offlineBackgroundAvailable
				get if there is offline background downloaded to local storage

		- offlineDataStoredDate
				gets stored date

		- displayBackground
				displays stored background
					@param source (ol.layer.Tile)
					@param extent (array)

		- selectAreaToDownload
				selects area to download, adds a feauture and interactions for dragging
					@param meters(int) number of meters for generate area to download
					@param _map(ol.map)

		- showSavedAreas
				renders saved areas
					@param _map(ol.map)

		- hideSavedAreas
				hides saved areas
					@param _map(ol.map)

		- hideBackground
				sets flag displayed offline background to false

		- downloadGeoJsonLayer
				Downloads a geoJSON from an url and stores it in localstorage
					@param layer (string) layer name: PROJECTNAME_layer.json

		- readOfflineGeoJSON
				Returns an stored geoJSON or null if is not available
					@param layer (string) layer name: PROJECTNAME_layer.json

		- clearOfflineVisits
				removes stored visits in localstorage

		- addVisitInfo

					@param visit_id
					@param heading
					@param formData
					@param images
					@param compasses
					@param photo
					@param okCb (function)
					@param koCb (function)

		- removeVisit

					@param visit_id (string)
					@param okCb (function)
					@param koCb (function)

		- getCachedVisits
				reads cached visits for db inserting

		- getVisitEvents
				reads events from a visit

					@param visit_id (string)

		- updateEvent
				updates an stored event

					@param eventObj (object)
					@param key (string)
					@param value (string)

					@return bool

			*************** dump data methods **************

		- dumpData
				initiate dump data process to db

		-  setAjaxMethods
				sets ajax methods for dumping data
					@param _ajax_target (url)
					@param _ajaxMethodForVisit (function),
					@param _ajaxMethodForEvent (function)
					@param _mapPhotos (js module)

			*/
	angular.module('app').factory('mapOffline', ['$http','$rootScope','$window','mapStorage', function ($http,$rootScope,$window,mapStorage) {
		var filename 					= "mapOffline.js",
		touchDevice						= 0;

		var	extentKey 				= 'ga-offline-extent',
		maxZoom 							= 10, // max zoom level cached

		proxyUrl							= null,
		isSelectorActive 			= false,
		isMenuActive 					= false,

		defaultResolutions		= [4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250,2000, 1750, 1500, 1250, 1000, 750, 650, 500, 250, 100, 50, 20, 10, 5,2.5, 2, 1.5, 1,0.5],
		wmsResolutions 				= defaultResolutions.concat([0.25, 0.1]),
		minRes								= defaultResolutions[maxZoom],
		pool									= 50,
		cursor,
		queue 								= [],
		projection 						= null,

		/*layersIds 				= [],
		layersOpacity 		= [],
		layersBg 					= [];*/
		downloadableGeoJsons	= [];

		var extent,
		isDownloading,
		isStorageFull,
		nbTilesCached,
		nbTilesEmpty,
		nbTilesFailed,
		nbTilesTotal,
		requests,
		sizeCached,
		startTime,
		getMagnitude,
		errorReport,
		localized_strings	= {};

		//save
		var extentFeature 							= null;			//ol.Feature for displaying extent to save
		var vectorSource								= null;			//source for extent selection
		var vectorLayer									= null;     //layer forextent selection
		var map 												= null; 		//ol.map
		var wmtsBackgroundRaster 				= null;			//raster for wmtms background
		var extentSelect 								= null; 		//ol.interaction for select area to download
		var translateExtent							= null;			//ol.interaction for translate feature to select area to download
		var selectingAreaToDownload 		= false;		//flag for knowing if selectin area to download is active or not
		var extentToSave								= null;			//extent for download
		var savedFeature								= null;			//ol.Feature for displaying saved background
		var vectorSourceSavedBg					= null;			//source saved background
		var vectorLayerSavedBg					= null;			//layer saved background
		var savedFeatureData						= null;			//ol.Feature for displaying saved data
		var vectorSourceSavedData				= null;			//source saved data
		var vectorLayerSavedData				= null;			//layer saved data
		var showingDownloadedAreas 			= false;		//flag for knowing if is showing downloaded areas
		var mapPhotos 									= null;			//photos module

		//background display
		var items 											= [];
		var tiles 											= [];
		var offlineBackgroundDisplayed 	= false;

		//dump data
		var ajaxMethodForVisit					= null;			//method for insertVisit ajax request
		var ajaxMethodForEvent					= null;			//method for insertEvent request
		var ajax_target									= null;



		// public API
		var dataFactory 		= {
			init:												init,
			save:												save,
			abort:											abort,
			displayBackground:					displayBackground,
			hideBackground: 						hideBackground,
			StartSaving:								StartSaving,
			selectAreaToDownload:				selectAreaToDownload,
			showSavedAreas:							showSavedAreas,
			hideSavedAreas:							hideSavedAreas,
			offlineConfigure:						offlineConfigure,
			offlineDataAvailable: 			offlineDataAvailable,
			offlineBackgroundAvailable: offlineBackgroundAvailable,
			offlineDataStoredDate: 			offlineDataStoredDate,
			getAvailableGeoJson: 				getAvailableGeoJson,				//download geoJSON
			readOfflineGeoJSON: 				readOfflineGeoJSON,					//reads geoJSON stored
			getVisit:										getVisit,
			addVisit: 									addVisit,
			removeVisit:								removeVisit,
			addVisitInfo:								addVisitInfo,
			clearOfflineVisits:					clearOfflineVisits,
			getCachedVisits:						getCachedVisits,
			getVisitEvents:							getVisitEvents,
			updateEvent:								updateEvent,
			setAjaxMethods:							setAjaxMethods,
			dumpData: 									dumpData,
			offlineReset:								offlineReset,
			getOfflineInfo:							getOfflineInfo,
			getEventId:									getEventId,
			setEventId:									setEventId,
			savePicture:								savePicture

		};
		return dataFactory;
		//****************************************************************
		//***********************      METHODS     ***********************
		//****************************************************************

		function init(_proxyUrl,_touchDevice,_localized_strings){
			log("init("+_proxyUrl+","+_touchDevice+")","info");
			proxyUrl					= _proxyUrl;
			touchDevice				= _touchDevice;
			localized_strings	= _localized_strings;

			// On mobile we simulate synchronous tile downloading, because when
			// saving multilayers and/or layers with big size tile, browser is
			// crashing (mem or cpu).
			// TODO: Try using webworkers?
			pool 		= touchDevice ? 1 : 50;
			mapStorage.init();
			setupPrototypes();
			setTimeout(function(){
				$rootScope.$broadcast('offlineDownloadEvent',{evt:"setDownloadButtons",selectArea:true,startDownload:false,selectingArea:false,showAreas:true,downloading:false});
			},1000);
		}

		//****************************************************************
		//***********************       GETTERS     **********************
		//****************************************************************

		function getOfflineInfo(){
			log("getOfflineInfo()","info");
			var data = {
				'offlineBackground':			 	mapStorage.getItem('offlineBackground'),
				'background_extent':			 	mapStorage.getItem('bgExtent'),
				'background_stored_date': 	formatDate(mapStorage.getItem('bg_stored_date')),
				'offlineData': 							mapStorage.getItem('offlineData'),
				'geojson_layers':						mapStorage.getItem('geojson_layers'),
				'geojson_stored_date':			formatDate(mapStorage.getItem('geojson_stored_date')),
				'visits_stored_date':				mapStorage.getItem('visits_stored_date'),
				'pendingDump':							getCachedVisits()
			}
			mapStorage.localStorageSpace(function(err,data){
				if(err){
					console.log(err)
				}else{
					var totalUsed = data.indexDbUsedMb+data.localStorageUsed;
					$rootScope.$broadcast('offlineEvent',{evt:"localStorageSpace",data:data});
				}
			})
			return data;
		}

		function offlineDataAvailable(){
			log("offlineDataAvailable()","info");
			return mapStorage.getItem("offlineData");
		}

		function offlineBackgroundAvailable(){
			log("offlineBackgroundAvailable()","info");
			return mapStorage.getItem("offlineBackground");
		}

		function offlineDataStoredDate(){
			log("offlineDataStoredDate()","info");
			return mapStorage.getItem("geojson_stored_date");
		}

		function getCachedVisits(){
			log("getCachedVisits()","info");
			var visits 			= JSON.parse(mapStorage.getItem("visits"));
			if(visits){
				return visits;
			}else{
				return [];
			}
		}

		function getVisitEvents(visit_id){
			log("getVisitEvents("+visit_id+")","info");
			var visit_events 			= JSON.parse(mapStorage.getItem("visit_events"));
			var returnData 				= [];
			for(var i=0;i<visit_events.length;i++){
				if(visit_events[i]['visit_id']===visit_id){
					returnData.push(visit_events[i]);
				}
			}
			return returnData;
		}

		function setEventId(id){
			log("setEventId("+id+")","info");
			mapStorage.setItem('event_id',parseInt(id));
		}

		function getEventId(){
			log("getEventId()","info");
			var id = mapStorage.getItem('event_id');
			if(id===null){
				log("getEventId() not id stored","info");
				mapStorage.setItem('event_id',1);
				return 0;
			}else{
				log("getEventId() last id stored: "+id,"info");
				return parseInt(id);
			}
		}

		//****************************************************************
		//***********************    END GETTERS    **********************
		//****************************************************************

		//****************************************************************
		//***********************   DUMP DATA TO DB  *********************
		//****************************************************************

		//***********************        dumpData     ********************
		//initiate dumping data to db
		function dumpData(){
			log("dumpData()","info");
			//read visits
			var visits = getCachedVisits();
			if(visits.length>0){
				log("dumpData visits","info",visits);
				//gets visits events
				var visit_events = getVisitEvents(visits[0].temporalId);
				//Insert in db visit
				InsertNextVisit(visits[0],visit_events);
			}else{
				$rootScope.$broadcast('offlineEvent',{evt:"dumpEvent","text":"no visits to dump"});
				log("dumpData","warn",{evt:"dumpEvent","text":"no visits to dump"});
			}
		}

		//***********************   InsertNextVisit  *********************
		//try to insert visit in DB and get real visit ID
		function InsertNextVisit(visit,_visit_events){
			log("InsertNextVisit("+visit+")","info",_visit_events);
			$rootScope.$broadcast('offlineEvent',{evt:"dumpData",text:"InsertNextVisit"});
			var ve					= _visit_events;
			ajaxMethodForVisit(ajax_target,visit.epsg,visit.pol_id,visit.coordinates,visit.layer,function(e,data){
				//remove visit from local storage
				removeVisit(visit.temporalId,function(){
					log("removeVisit("+visit.temporalId+") OK","success");
				},function(){
					log("removeVisit("+visit.temporalId+") KO","warn");
				});
				for(var e=0;e<ve.length;e++){
					//updates events visit id with real id (the one that cames from DB)
					updateEvent(ve[e],'visit_id',data.visit_id);
					//update photos id_visit
					updatePhotovisitId(ve[e].temporalEventId,data.visit_id);
				}

				var visit_events = getVisitEvents(data.visit_id);
				log("InsertNextVisit, initiate photos uploading in 1s","info");
				setTimeout(function(){
					if(visit_events.length>0){
						//inserts events in DB
						InsertNextEvent(data.visit_id);
					}
				},1000);
			},function(msg,data){
				log("InsertNextVisit :"+msg,"error",data);
			});
		}

		//***********************   InsertNextEvent  *********************
		function InsertNextEvent(visit_id){
			log("InsertNextEvent("+visit_id+")","info");
			var visit_events = getVisitEvents(visit_id);
			log("InsertNextEvent - visit_events: "+visit_events.length,"info",visit_events);
			if(visit_events.length>0){
				var event = visit_events[0];
				//first upload photos
				uploadPhotosFromEvent(event,
					function(e,data){
						log("InsertNextEvent uploadPhotosFromEvent "+data.temporalEventId+" result:"+e,"info",data);
						if(e==="done"){
							log("InsertNextEvent, all photos uploaded, starting inserting event...","success");
							$rootScope.$broadcast('offlineEvent',{evt:"dumpData",text:"uploadingEvents"});
							//read event with updated photos
							var _event = getEvent(event.temporalEventId);
							//inserts event in DB
							ajaxMethodForEvent(ajax_target,_event.visit_id,_event.compass,_event.formData,_event.photos,_event.compasses,null,
								function(){
									log("InsertNextEvent ajaxMethodForEvent ok","info");
									removeEvent(event);
									InsertNextEvent(visit_id);
								},function(msg,data){
									log("InsertNextEvent ajaxMethodForEvent"+msg,"warn",data);
								}
							);
						}
					}
				);
			}else{
				log("InsertNextEvent no more events","info");
				dumpData();
			}
		}

		function uploadPhotosFromEvent(storedEvent,callback){
			log("uploadPhotosFromEvent("+storedEvent.temporalEventId+")","info",storedEvent);
			$rootScope.$broadcast('offlineEvent',{evt:"dumpData",text:"uploadingPhotos"});
			//upload photos
			var eventPhotos = getOfflinePhotosFromEvent(storedEvent.temporalEventId);
			if(eventPhotos.length>0){
				log("uploadPhotosFromEvent event "+storedEvent.temporalEventId+" has "+eventPhotos.length+" photos","info");
				//get Photo
				getPhoto(eventPhotos[0].photo_id,function(e,photo){
					if(e===null){
						//try to upload photo
						mapPhotos.savePicture(ajax_target,storedEvent.visit_id,photo,
							function(e2,visit_id,data){
								if(e2===null){
									//real photo_id is in data.photo_id
									//remove photo form temporal and update event
									updateEventPhoto(storedEvent.temporalEventId,eventPhotos[0].photo_id,data.photo_id);
									removePhoto(eventPhotos[0].photo_id,function(){
										//wait 5s to upload next photo
										$rootScope.$broadcast('offlineEvent',{evt:"dumpData",text:"preparingPhoto"});
										log("uploadPhotosFromEvent "+storedEvent.temporalEventId+" pause 3 seconds","info");
										//upload next photo
										setTimeout(function(){
											log("uploadPhotosFromEvent next photo from event: "+storedEvent.temporalEventId,"info");
											uploadPhotosFromEvent(storedEvent,callback);
										},3000);
									});

								}else{
									log("uploadPhotosFromEvent savePicture("+e2+")","error",data);
								}
							}
						);
					}else{
						log("uploadPhotosFromEvent getPhoto("+e+")","error",photo);
					}
				});
			}else{
				setTimeout(function(){
					log("uploadPhotosFromEvent "+storedEvent.temporalEventId+" no photos to upload","info");
					callback("done",storedEvent);
				},200);
			}
		}

		//****************************************************************
		//********************   END DUMP DATA TO DB   *******************
		//****************************************************************

		//****************************************************************
		//***********************       PHOTOS      **********************
		//****************************************************************

		function getPhotos(){
			//log("getPhotos()","info");
			var photos_list 			= JSON.parse(mapStorage.getItem("photos"));
			if(photos_list===null){
				photos_list = Array();
			}
			return photos_list;
		}

		function addPhotoId(){
			log("addPhotoId","info");
			var id 	= getPhotoId();
			id 			= id+1;
			mapStorage.setItem('photo_id',parseInt(id));
			return id;
		}

		function getPhotoId(){
			log("getPhotoId()","info");
			var id = mapStorage.getItem('photo_id');
			if(id===null){
				log("getPhotoId() not id stored","info");
				mapStorage.setItem('photo_id',1);
				return 0;
			}else{
				log("getPhotoId() last id stored: "+id,"info");
				return parseInt(id);
			}
		}

		function savePicture(visit_id,preview,callback){
			log("savePicture("+visit_id+")","info");
			if(visit_id!="" && visit_id!=null){
				var temporalPhotoId 	= addPhotoId();
				var photos 						= getPhotos();
				var newElement				= {
					'photo_id'				: temporalPhotoId,
					'event_id'				: getEventId(),
					'visit_id'				: visit_id
				}
				photos.push(newElement);
				mapStorage.setItem("photos",JSON.stringify(photos));
				var returnData = {
					'status'	: "Accepted",
					'message'	: newElement,
					'code'		: 200
				}

				mapStorage.setTile("photo_"+temporalPhotoId, mapStorage.compress(preview) ,function(err, content) {
					if(err){
						mapPhotos.addPhoto(preview)
						callback(err,"Error requesting savePicture",content);
					}else{
						log("Photo photo_"+temporalPhotoId+" successfully stored localForage","success");
						callback(null,visit_id,newElement);
					}
				});
			}else{
				log("savePicture() no visit_id: "+visit_id,"warn");
				callback("no visit_id","no visit_id: "+visit_id,null);
			}
		}

		function removePhoto(photo_id,callback){
			log("removePhoto("+photo_id+")","info");
			//remove photo from indexDb
			mapStorage.removeTile("photo_"+photo_id,function() {
				log("photo removed photo_"+photo_id,"success");
				//remove photo from list
				var currentPhotos = getPhotos();
				for(var i=0;i<currentPhotos.length;i++){
					if(currentPhotos[i].photo_id===photo_id){
						currentPhotos.splice(i,1);
					}
				}
				mapStorage.setItem("photos",JSON.stringify(currentPhotos));
				callback();
			});

		}

		function getOfflinePhotosFromEvent(event_id){
			log("getOfflinePhotosFromEvent("+event_id+")","info");
			var photos 		= getPhotos();
			var _return 	= Array();
			for(var i=0;i<photos.length;i++){
				if(photos[i].event_id === event_id){
					_return.push(photos[i]);
				}
			}
			log("getOfflinePhotosFromEvent("+event_id+") photos:","info",_return);
			return _return;
		}

		function getPhoto(photo_id,callback){
			log("getPhoto("+photo_id+")","info");
			mapStorage.getTile("photo_"+photo_id,function(e,data){
				if(e){
					log("getPhoto("+photo_id+") error: "+e,"error",data);
				}
				callback(e,data);
			})
		}

		function updateEventPhoto(event_id,old_photo_id,new_photo_id){
			log("updateEventPhoto("+event_id+","+old_photo_id+","+new_photo_id+")","info");
			var currentEvent  	= getEvent(event_id);
			if(currentEvent){
				var photosToUpdate = currentEvent.photos;
				for(var i=0;i<photosToUpdate.length;i++){
					if(photosToUpdate[i]===old_photo_id){
						photosToUpdate[i] = new_photo_id;
						break;
					}
				}
				//uopdate event with real photoid
				var visit_events 			= JSON.parse(mapStorage.getItem("visit_events"));
				if(visit_events!==null){
					//find event in stored JSON
					for(var i=0;i<visit_events.length;i++){
						if(visit_events[i].temporalEventId===event_id){
							visit_events[i].photos = photosToUpdate;
							break;
						}
					}
					mapStorage.setItem("visit_events",JSON.stringify(visit_events));
				}
			}
		}

		function updatePhotovisitId(event_id,visit_id){
			log("updatePhotovisitId("+event_id+","+visit_id+")","info");
			var currentPhotos = getPhotos();
			for(var i=0;i<currentPhotos.length;i++){
				if(currentPhotos[i].event_id===event_id){
					currentPhotos[i].visit_id = visit_id;
				}
			}
			mapStorage.setItem("photos",JSON.stringify(currentPhotos));

		}

		//****************************************************************
		//***********************    END PHOTOS     **********************
		//****************************************************************

		//****************************************************************
		//***********************      clear data   **********************
		//****************************************************************

		function clearOfflineVisits(){
			log("clearOfflineVisits()","info");
			$rootScope.$broadcast('offlineEvent',{evt:"removingData",text:"visits"});
			mapStorage.removeItem("visits");
			mapStorage.removeItem("visit_events");
			mapStorage.removeItem("event_id");
			mapStorage.removeItem("photo_id");
			//remove photos from indexDb
			var photos 						= getPhotos();
			for(var i=0;i<photos.length;i++){
				removePhoto(photos[i].photo_id,function(){});
			}
			mapStorage.removeItem("photos");
		}

		function offlineReset(){
			log("offlineReset()","info");
			mapStorage.clearDatabase();
		}

		//****************************************************************
		//***********************    end clear data   ********************
		//****************************************************************

		//****************************************************************
		//***********************       VISITS      **********************
		//****************************************************************

		//******************    checkPreviousVisit      ******************

		function checkPreviousVisit(element_id,layer){
			log("checkPreviousVisit("+element_id+","+layer+")","info")
			var visits 			= mapStorage.getItem("visits");
			var exists			= false;
			if(visits){
				//check previous visits
				var parsedVisits = JSON.parse(visits);
				for(var i=0;i<parsedVisits.length;i++){
					var item = parsedVisits[i];
					if(item['temporalId']===layer+":"+element_id){
						exists 	= true;
						break;
					}
				}
			}
			return exists;
		}

		//******************    end checkPreviousVisit  ******************

		//******************          getVisit          ******************

		function getVisit(element_id,layer,extraData,okCb,koCb){
			log("getVisit()","info");
			var exists			= checkPreviousVisit(element_id,layer);
			if(exists){
				okCb("update",extraData);
			}else{
				okCb("insert",extraData);
			}
		}

		//******************        end getVisit        ******************

		//******************          addVisit          ******************

		function addVisit(epsg,pol_id,coordinates,layer,callback){
				log("addVisit("+epsg+","+pol_id+","+coordinates+","+layer+")","info");
				var newElement 				= {epsg:epsg,pol_id:pol_id,coordinates:coordinates,layer:layer,temporalId:layer+":"+pol_id};
				var visits 						= JSON.parse(mapStorage.getItem("visits"));
				var temporalEventId		= getEventId();
				temporalEventId				= temporalEventId+1;
				setEventId(temporalEventId);
				var returnObj	= {
					layer_id				:	layer,
					element_id 			:	 pol_id,
					visit_id				: layer+":"+pol_id,
					temporalEventId	: temporalEventId
				};
				if(visits!==null){
					//visits stored, check if a previous visit for this element exists
					if(!checkPreviousVisit(pol_id,layer)){
						visits.push(newElement);
						mapStorage.setItem("visits",JSON.stringify(visits));
						returnObj['status'] ="insert";
					}else{
						returnObj['status'] ="update";
					}
					callback(null,returnObj);
					log("addVisit temporal id: "+layer+":"+pol_id+" event temporalId: "+temporalEventId,"success");
				}else{
					//no visits stored
					mapStorage.setItem("visits",JSON.stringify([newElement]));
					var returnObj	={layer_id:layer,element_id:pol_id,status:"insert",visit_id:layer+":"+pol_id};
					callback(null,returnObj);
				}
				mapStorage.removeItem("visits_stored_date");
				mapStorage.setItem("visits_stored_date",new Date());
		}

		//******************        end addVisit        ******************

		//******************        removeVisit          *****************

		function removeVisit(visit_id,okCb,koCb){
			log("removeVisit("+visit_id+")","info");
			var visits 		= mapStorage.getItem("visits");
			var index			= -1;
			if(visits){
				//check if previous visits
				var parsedVisits = JSON.parse(visits);
				for(var i=0;i<parsedVisits.length;i++){
					var item = parsedVisits[i];
					if(item['temporalId']===visit_id){
						index = i;
						break;
					}
				}
				parsedVisits.splice(index, 1);
				mapStorage.setItem("visits",JSON.stringify(parsedVisits));
				okCb();
			}
		}

		//******************         end removeVisit     *****************

		//****************************************************************
		//********************         END VISITS         ****************
		//****************************************************************

		//****************************************************************
		//********************           EVENTS          *****************
		//****************************************************************

		//********************        addVisitInfo       *****************

		function addVisitInfo(visit_id,heading,formData,images,compasses,photo,okCb,koCb){
			log("addVisitInfo("+visit_id+","+heading+")","info",formData);
			var formDataToStore = {};
			for (var prop in formData) {
				formDataToStore[prop]   =   formData[prop];
			}
			var data2send						= {
				'what' 						: "ADD_VISIT_INFO",
				'visit_id'				: visit_id,
				'compass'					: heading,
				'photos'					: images,
				'compasses'				: compasses,
				'temporalEventId' : getEventId(),
				'formData'				: formDataToStore
			};
			var visit_events 			= JSON.parse(mapStorage.getItem("visit_events"));
			if(visit_events!==null){
				visit_events.push(data2send);
				console.log("visit_events",visit_events);
				mapStorage.setItem("visit_events",JSON.stringify(visit_events));
			}else{
				mapStorage.setItem("visit_events",JSON.stringify([data2send]));
			}
			mapStorage.removeItem("visits_stored_date");
			mapStorage.setItem("visits_stored_date",new Date());
			okCb();
		}

		//********************     end addVisitInfo      *****************

		//********************         getEvent          *****************

		function getEvent(event_id){
			log("getEvent("+event_id+")","info");
			var visit_events 			= JSON.parse(mapStorage.getItem("visit_events"));
			if(visit_events!==null){
				//find event in stored JSON
				for(var i=0;i<visit_events.length;i++){
					if(visit_events[i].temporalEventId===event_id){
						return visit_events[i];
						break;
					}
				}
			}else{
				return false;
			}
		}

		//********************       end getEvent        *****************

		//********************        updateEvent        *****************

		function updateEvent(eventObj,key,value){
			log("updateEvent("+key+","+value+")","info",eventObj);
			var visit_events 			= JSON.parse(mapStorage.getItem("visit_events"));
			if(visit_events!==null){
				//find event in stored JSON
				for(var i=0;i<visit_events.length;i++){
					if(JSON.stringify(visit_events[i])===JSON.stringify(eventObj)){
						visit_events[i][key] = value;
						break;
					}
				}
				mapStorage.setItem("visit_events",JSON.stringify(visit_events));
				return true;
			}else{
				return false;
			}
		}

		//********************     end updateEvent       *****************

		//********************        removeEvent        *****************

		function removeEvent(eventObj){
			log("removeEvent("+eventObj.temporalEventId+")","info",eventObj);
			var visit_events 			= JSON.parse(mapStorage.getItem("visit_events"));
			if(visit_events!==null){
				//find event in stored JSON
				for(var i=0;i<visit_events.length;i++){
					if(visit_events[i].temporalEventId===eventObj.temporalEventId){
						visit_events.splice(i, 1);
						break;
					}
				}
				mapStorage.setItem("visit_events",JSON.stringify(visit_events));
				return true;
			}else{
				return false;
			}
		}
		//********************     end rem oveEvent      *****************

		//****************************************************************
		//********************          END EVENTS       *****************
		//****************************************************************

		//****************************************************************
		//***********************      GEOJSON      **********************
		//****************************************************************

		function getAvailableGeoJson(ajax_target,project_name,token,_map){
			log("getAvailableGeoJson("+ajax_target+","+project_name+","+token+")","info");
			if(map===null){
				map = _map;
			}

			if(typeof localized_strings.OFFLINE_DOWNLOAD_LAYERS_ALERT!="undefined"){
				if (!confirm(localized_strings.OFFLINE_DOWNLOAD_LAYERS_ALERT)) {
					return;
				}
			}else{
				if (!confirm("You're going to download project layers. All previous data will be deleted!")) {
					return;
				}
			}

			$rootScope.$broadcast('offlineDownloadEvent',{evt:"setDownloadButtons",selectArea:false,startDownload:false,selectingArea:true,showAreas:false,downloading:true});
			//drawSavedBackground();

			//renderAreaToDownLoad();

			//mapStorage.removeItem('dataExtent');


			var data2send 										= new FormData();
			data2send.append('token', 				token);
			data2send.append('what', 					"GET_GEOJSON");
			data2send.append('project_name', 	project_name)
			$http.post(
					ajax_target,
					data2send,
					{
						transformRequest: angular.identity,
						headers: {'Content-Type': undefined
					}
			}).success(function (data) {
				log("getAvailableGeoJson() result:","info",data);
				if(data.status==="Accepted"){
					mapStorage.removeItem('geojson_layers');
					for(var i=0;i<data.message.length;i++){
						downloadableGeoJsons.push(data.message[i])
					}
					if(downloadableGeoJsons.length>0){
						downloadGeoJsonLayer(downloadableGeoJsons[0],callbackDownloadGeoJsonOk,callbackDownloadGeoJsonKo);
					}else{
						$rootScope.$broadcast('offlineDownloadEvent',{evt:"geoJSONNoAvailableData"});
					}
				}else{
					$rootScope.$broadcast('offlineDownloadEvent',{evt:"geoJSONNoAvailableData"});
				}
			}).error(function (error) {
				log("error requesting getAvailableGeoJson","error",error);
				$rootScope.$broadcast('offlineDownloadEvent',{evt:"geoJSONNoAvailableData"});
				restoreInteractions(map);
				$rootScope.$broadcast('offlineDownloadEvent',{evt:"setDownloadButtons",selectArea:true,startDownload:false,selectingArea:false,showAreas:false,downloading:false});
			})
		}

		function callbackDownloadGeoJsonOk(layer_name){
			log("callbackDownloadGeoJsonOk("+layer_name+")");
			var index = downloadableGeoJsons.indexOf(layer_name);
			if (index > -1) {
				downloadableGeoJsons.splice(index, 1);
			}
			$rootScope.$broadcast('offlineDownloadEvent',{evt:"geoJSONStored","name":layer_name});
			if(downloadableGeoJsons.length>0){
				log("Waiting 2s to start downloading next layer");
				setTimeout(function(){
					log("Downloading: "+downloadableGeoJsons[0]);
					downloadGeoJsonLayer(downloadableGeoJsons[0],callbackDownloadGeoJsonOk,callbackDownloadGeoJsonKo);
				},2000);
			}else{
				log("No more layers","info");
				hideSavedAreas();
				$rootScope.$broadcast('offlineDownloadEvent',{evt:"geoJSONStoredEnd"});
			}
		}

		function callbackDownloadGeoJsonKo(layer_name,msg,data){
			log("callbackDownloadGeoJsonKo("+layer_name+","+msg+")","info",data);
			$rootScope.$broadcast('offlineDownloadEvent',{evt:"geoJSONStoredError","name":layer_name,"error":data});
		}

		function downloadGeoJsonLayer(layer_name,okCb,koCb){
			log("downloadGeoJsonLayer("+layer_name+")","info");
			var url = "https://bmaps.bgeo.es/bmaps/offline/"+layer_name;
			$rootScope.$broadcast('offlineDownloadEvent',{evt:"geoJSONStartDownload","name":layer_name});
			$http({method: "GET", url:url})
				.success(function(data){
					log("downloadGeoJsonLayer("+layer_name+") result: ","info",data);
					//store flags
					setTimeout(function(){
						mapStorage.setItem("geojson_stored_date",new Date());
						var geojson_stored_layers = JSON.parse(mapStorage.getItem("geojson_layers"));
						if(geojson_stored_layers){
							geojson_stored_layers.push(layer_name);
						}else{
							geojson_stored_layers = Array(layer_name);
						}
						mapStorage.setItem("geojson_layers",JSON.stringify(geojson_stored_layers));
						setTimeout(function(){
								mapStorage.setItem("offlineData",true);
								//store geoJSON in local storage
								mapStorage.removeItem(layer_name);
								setTimeout(function(){
									log("Layer downloaded from server, inserting data in localForage","info")
									mapStorage.setTile(layer_name, JSON.stringify(data) ,function(err, content) {
										if(err){
											koCb(layer_name,err,data);
										}else{
											log("Layer "+layer_name+" successfully stored localForage","success");
											okCb(layer_name);
										}
									});
								},100);
						},200);
					},100);
				}).error(function(response){
					log("downloadGeoJsonLayer("+layer_name+") error: ","error",response);
					koCb(layer_name,"downloadGeoJsonLayer("+layer_name+") error",response);
				});
		}

		function readOfflineGeoJSON(layer,cb){
			log("readOfflineGeoJSON("+layer+")","info");
			var request = window.indexedDB.open("bmaps.bgeo.es");
			request.onerror = function(err) {
				log("request.onerror","error",err)
				cb("error reading geoJSON for layer: "+layer+" "+err,err);
			};
			request.onsuccess = function(event) {
				log("request.onsuccess","success",event)
				var db 						= event.target.result;
				var trans 				= db.transaction('ga', IDBTransaction.READ_ONLY);
				var store 				= trans.objectStore('ga');
				var request2 			= store.get(layer);
				request2.onerror 	= function(event2) {
					log("request2.onerror","error",event2)
					cb(event2,null);
				};
				request2.onsuccess = function(event3) {
					log("request2.onsuccess","success");
					try{
						var storedGeoJson = event3.target.result;
						cb(null, JSON.parse(storedGeoJson));
					}catch(e){
						cb("error parsing stored geoJSON for layer: "+layer,storedGeoJson);
					}
				};
			};
		}

		//****************************************************************
		//***********************     END GEOJSON   **********************
		//****************************************************************

		//****************************************************************
		//***********************     SAVE BACKGROUND   ******************
		//****************************************************************
		//Selects area for download
		function selectAreaToDownload(meters,_map){
			log("selectAreaToDownload("+meters+")","info");
			if(map===null){
				map = _map;
			}
			renderAreaToDownLoad(meters);
		}

		//configures are to download
		function offlineConfigure(_map){
			log("offlineConfigure()","info");
			if(map===null){
				map = _map;
			}
			$rootScope.$broadcast('offlineDownloadEvent',{evt:"setDownloadButtons",selectArea:false,startDownload:false,selectingArea:false,showAreas:false,downloading:true});
			getExtenToDownload();
			renderWMTSLayers();
		}

		function renderWMTSLayers(){
			log("renderWMTSLayers()","info");
			var parser = new ol.format.WMTSCapabilities();
			$http({method: "GET", url:"https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wmts/service?service=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities"})
					.success(function(data){
							try{
							var result 	= parser.read(data);
							var options = ol.source.WMTS.optionsFromCapabilities(result, {
								layer:			'topogris',
								matrixSet: 	'UTM25831',
							});
							options.urls[0] 			= "https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wmts/service";
							var source 						= new ol.source.WMTS(/** @type {!olx.source.WMTSOptions} */ (options));
							var auxVic1 					= source.getTileGrid().getResolutions();
							var auxVic2 					= source.getTileGrid().getOrigin(0);
							var auxVic3 					= source.getTileGrid().getTileSize(0);

							wmtsBackgroundRaster 	= new ol.layer.Tile({});
							wmtsBackgroundRaster.setSource(source);
							map.addLayer(wmtsBackgroundRaster);
							//once is rendered, start saving
							save(data);
						}catch(e){
							alert("Error rendering wmts background layer:\n"+e);
						}
					}
				);
		}

		function save(capabilities) {
			log("Save()","info");
			// Get the cacheable layers
			var layers = getCacheableLayers(map.getLayers().getArray(), true);

			if (layers.length == 0) {
					if(typeof localized_strings.OFFLINE_DOWNLOAD_NO_BACKGROUND_ALERT!="undefined"){
						alert(localized_strings.OFFLINE_DOWNLOAD_NO_BACKGROUND_ALERT);
					}else{
						alert('offline_no_cacheable_layers');
					}
					return;
				}
				if(typeof localized_strings.OFFLINE_DOWNLOAD_BACKGROUND_ALERT!="undefined"){
					if (!confirm(localized_strings.OFFLINE_DOWNLOAD_BACKGROUND_ALERT)) {
						return;
					}
				}else{
					if (!confirm('offline_save_warning')) {
						return;
					}
				}

				$rootScope.$broadcast('offlineDownloadEvent',{evt:"downloading"});
				//delete previous data
				mapStorage.clearDatabase();
				initDownloadStatus();
				//empty previous storage
				mapStorage.removeItem('bgCapabilities');
				mapStorage.removeItem('bgExtent');
				mapStorage.removeItem("bg_stored_date");
				//store capabilities in local storage
				mapStorage.setItem('bgCapabilities',capabilities);
				mapStorage.setItem("offlineBackground",true);
				mapStorage.setItem("bgExtent",extentToSave);
				mapStorage.setItem("bg_stored_date",new Date());
				extent 					= extentToSave;
				// We go through all the cacheable layers.
				projection 			= map.getView().getProjection();
				queue 					= [];
				log("save()-> layers: ","info",layers);
				for (var i = 0, ii = layers.length; i < ii; i++) {
					var layer = layers[i];
					// if the layer is a KML
					if (isKmlLayer(layer) && '/^https?:\/\//.test(layer.url)') {
						$http.get(proxyUrl + encodeURIComponent(layer.url))
						.success(function(data) {
							mapStorage.setItem(layer.id, data);
						});
						layersBg.push(false);
						continue;
					}
					var source 					= layer.getSource();
					var tileGrid 				= source.getTileGrid();
					var tileUrlFunction = source.getTileUrlFunction();
				}
				// For each zoom level we generate the list of tiles to download:
				for (var zoom = 0; zoom <= maxZoom; zoom++) {
					var z = zoom ; // data zoom level
					if (!isCacheableLayer(layer, z)) {
						continue;
					}
					var tileExtent 			= extent;
					var tileRange 			= tileGrid.getTileRangeForExtentAndZ(tileExtent, z);
					var centerTileCoord = [
						z,
						(tileRange.minX + tileRange.maxX) / 2,
						(tileRange.minY + tileRange.maxY) / 2
					];
					var queueByZ = [];
					for (var x = tileRange.minX; x <= tileRange.maxX; x++) {
						for (var y = tileRange.minY; y <= tileRange.maxY; y++) {
							var tileCoord = [z, x, y];
							var tile = {
								magnitude: getMagnitude(tileCoord, centerTileCoord),
								url: tileUrlFunction(tileCoord,
									ol.has.DEVICE_PIXEL_RATIO, projection)
								};
							queueByZ.push(tile);
						}
					}
					// We sort tiles by distance from the center
					// The first must be dl in totality so no need to sort tiles,
					// the storage goes full only for the 2nd or 3rd layers.
					if (i > 0 && zoom > 6) {
						queueByZ.sort(function(a, b) {
							return a.magnitude - b.magnitude;
						});
					}
					queue = queue.concat(queueByZ);
				}
				// Start downloading tiles.
				isDownloading 	= true;
				nbTilesTotal 		= queue.length;
				startTime 			= (new Date()).getTime();
				cursor 					= 0;
				runNextRequests();
			}

			function runNextRequests() {
				log("runNextRequests()","info");
				var requestsLoaded = 0;
				for (var j = cursor, jj = cursor + pool; j < jj && j < nbTilesTotal; j++) {
					if (isStorageFull) {
						break;
					}
					var tile 					= queue[j];
					var tileUrl 			= transformIfAgnostic(tile.url);
					var xhr 					= new XMLHttpRequest();
					xhr.tileUrl 			= tile.url;
					xhr.open('GET', tileUrl, true);
					xhr.responseType 	= 'arraybuffer';
					xhr.onload 				= function(e) {
						var response = e.target.response;
						if (!response || response.byteLength === 0) { // Tile empty
							nbTilesEmpty++;
							onTileSuccess(0);
						} else {
							readResponse(e.target.tileUrl, response,
								e.target.getResponseHeader('content-type'));
							}
							onLoadEnd(++requestsLoaded, j);
						};
						xhr.onerror = function(e) {
							onTileError(e.target.tileUrl, 'Request error');
							onLoadEnd(++requestsLoaded, j);
						};
						xhr.onabort = function(e) {
							onTileError(e.target.tileUrl, 'Request abort');
							onLoadEnd(++requestsLoaded, j);
						};
						xhr.ontimeout = function(e) {
							onTileError(e.target.tileUrl, 'Request timed out');
							onLoadEnd(++requestsLoaded, j);
						};
						xhr.send();
						requests.push(xhr);
						cursor++;
					}
				};

				// Defines if a layer is cacheable at a specific data zoom level.
				function isCacheableLayer(layer, z) {
					if (layer.getSource() instanceof ol.source.TileImage) {
						var resolutions = layer.getSource().getTileGrid().getResolutions();
						var max 				= layer.getMaxResolution() || resolutions[0];
						if (!z && max > minRes) {
							return true;
						}
						var min 	= layer.getMinResolution() || resolutions[resolutions.length - 1];
						var curr 	= resolutions[z];
						if (curr && max > curr && curr >= min) {
							return true;
						}
					} else if (isKmlLayer(layer)) {
						if (layer instanceof ol.layer.Image) {
							alert('Layer too big: ' +layer.label);
						} else {
							return true;
						}
					} else {
						// TODO: inform the user about which layer can't be saved in the help
					}
					return false;
				};

				// Get cacheable layers of a map.
				function getCacheableLayers(layers, onlyVisible) {
					var cache = [];
					for (var i = 0, ii = layers.length; i < ii; i++) {
						var layer = layers[i];
						if (onlyVisible && !layer.getVisible()) {
							//continue;
						}
						if (layer instanceof ol.layer.Group) {
							cache = cache.concat(getCacheableLayers(layer.getLayers().getArray()));
						} else if (isCacheableLayer(layer)) {
							cache.push(layer);
						}
					}
					return cache;
				};

				// We can't use xmlhttp2.onloadend event because it's doesn't work on
				// android browser
				function onLoadEnd(nbLoaded, nbTotal) {
					if (!isStorageFull && nbLoaded == pool) {
						// $timeout service with an interval doesn't work on android
						// browser.
						if (nbTotal % 200 === 0) {
							// We make a pause to don't break the safari browser (cpu).
							setTimeout(runNextRequests, 5000);
						} else {
							runNextRequests();
						}
					}
				};

				//****************************************************************
				//***********************    END SAVE       **********************
				//****************************************************************

				//****************************************************************
				//***********************       ABORT       **********************
				//****************************************************************

				function abort() {
					isDownloading = false;
					// We abort the requests and clear the storage
					for (var j = 0, jj = requests.length; j < jj; j++) {
						requests[j].abort();
					}
					// Clear tiles database
					mapStorage.clearTiles(function(err) {
						if (err) {
							//OJO
							alert('offline_clear_db_error');
						} else {
							initDownloadStatus();
							// Remove specific property of layers (currently only KML layers)
							var layersId = gaStorage.getItem(layersKey).split(',');
							for (var j = 0, jj = layersId.length; j < jj; j++) {
								//OJO
								mapStorage.removeItem(layersId[j]);
							}
							$rootScope.$broadcast('gaOfflineAbort');
						}
					});
				};

				//****************************************************************
				//***********************      END ABORT    **********************
				//****************************************************************

				//****************************************************************
				//******************      BACKGROUND DISPLAY        **************
				//****************************************************************
				function hideBackground(){
					log("hideBackground()","info");
					offlineBackgroundDisplayed = false;
				}

				function displayBackground(raster,extent){
					log("displayBackground","info",raster);
					log("displayBackground","info",extent);
					if(!offlineBackgroundDisplayed){
						function getAllItems(db,callback) {
							var trans = db.transaction('ga', IDBTransaction.READ_ONLY);
							var store = trans.objectStore('ga');
							trans.oncomplete = function(evt) {


								//based on capabilities stored in localstorage

							/*	var storedCapabilities 		= mapStorage.getItem('bgCapabilities');
								var parser 								= new ol.format.WMTSCapabilities();
								var result 								= parser.read(storedCapabilities);
								var options 							= ol.source.WMTS.optionsFromCapabilities(result, {
																							layer:			'topogris',
																							matrixSet: 	'UTM25831',
																							url: 				'https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wmts/service',
																							tileLoadFunction: function(imageTile, src) {
																								var imgElement = imageTile.getImage();
																								// check if image data for src is stored in your cache
																								var imgsrc 		= getRoomIndex('key',src);
																								imgElement.src = mapStorage.decompress(imgsrc);
																							}
								});
								options.urls[0] 			= "https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wmts/service";
								var source 						= new ol.source.WMTS((options));
								var auxVic1 					= source.getTileGrid().getResolutions();
								var auxVic2 					= source.getTileGrid().getOrigin(0);
								var auxVic3 					= source.getTileGrid().getTileSize(0);
*/
								//OJO OJO versión con vicentes' hardcode numbers

								var projection 		= ol.proj.get('EPSG:25831');
								var resolutions 	= new Array(12);
								var matrixIds 		= new Array(12);
								var projectionExtent =[258000, 4485000, 539600, 4766600];
								var size = ol.extent.getWidth(projectionExtent) / 256
								for (var z = 0; z < 12; ++z) {
									// generate resolutions and matrixIds arrays for this WMTS
									resolutions[z] = size / Math.pow(2, z);
									if (z < 10) {
										matrixIds[z] = '0'+z;
									} else {
										matrixIds[z] = z;
									}
								}
								resolutions = [1099.9999999995998,550.0000000012,275.00000000003996,100.00000000003999,49.999999999879996,24.999999999995996,10.000000000003999,4.999999999988,2.0000000000008,1.0000000000004,0.49999999999879996,0.24999999999995998,0.10000000000004];
								var source 	=	new ol.source.WMTS({
																url: 				'https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wmts/service',
																layer: 			'topogris',
																matrixSet: 'UTM25831',
																style: 'default',
																format: 'image/jpeg',
																projection: projection,
																tileLoadFunction: function(imageTile, src) {
																	var imgElement = imageTile.getImage();
																	// check if image data for src is stored in your cache
																	var imgsrc 			= getRoomIndex('key',src);
																	imgElement.src = mapStorage.decompress(imgsrc);
																},
																tileGrid: new ol.tilegrid.WMTS({
																		origin: ol.extent.getTopLeft(projectionExtent),
																		resolutions: resolutions,
																		matrixIds: matrixIds
																})
										})

										//OJO OJO end versión con vicentes' hardcoded numbers

									raster.setSource(source);
									offlineBackgroundDisplayed = true;
									function getRoomIndex(key,value){
										for(var p = 0; p < tiles.length; p++) {
												if(tiles[p].key === value) {
													return tiles[p].value;
												}
											}
										}
								};

								var cursorRequest = store.openCursor();

								cursorRequest.onerror = function(error) {
										console.warn(error);
								};

								cursorRequest.onsuccess = function(evt) {
									var cursor = evt.target.result;
									if (cursor) {
										items.push(cursor.key);
										tiles.push({key:cursor.key,value:cursor.value})
										cursor.continue();
									}
								};
						}

						var request = window.indexedDB.open("bmaps.bgeo.es");
						request.onerror = function(event) {
						// Do something with request.errorCode!
						};
						request.onsuccess = function(event) {
							getAllItems(event.target.result,function (items) {
							});
						};
					}else{
						log("offline background already displayed","warn");
					}
				}

				//****************************************************************
				//******************   END BACKGROUND DISPLAY        *************
				//****************************************************************

				//****************************************************************
				//*********************         EXTENT      **********************
				//****************************************************************

				//****************************************************************
				//*********************       END EXTENT      ********************
				//****************************************************************

				function StartSaving(proxyUrl) {
					// Nothing to save or only KML layers
					if (queue.length == 0) {
						alert('offline_no_cacheable_layers');
						abort();
						return;
					}
					// We can't use xmlhttp2.onloadend event because it's doesn't work on
					// android browser
					var onLoadEnd = function(nbLoaded, nbTotal) {
						if (!isStorageFull && nbLoaded == pool) {
							// $timeout service with an interval doesn't work on android
							// browser.
							//OJO
							if (gaBrowserSniffer.ios && nbTotal % 200 === 0) {
								// We make a pause to don't break the safari browser (cpu).
								setTimeout(runNextRequests, 5000);
							} else {
								runNextRequests();
							}
						}
					};
}

//****************************************************************
//***********************    END  METHODS   **********************
//****************************************************************

//****************************************************************
//***********************   	 HELPERS      **********************
//****************************************************************

//sets ajax methods
function setAjaxMethods(_ajax_target,_ajaxMethodForVisit,_ajaxMethodForEvent,_mapPhotos){
	log("setAjaxMethods()","info");
	ajaxMethodForVisit 	= _ajaxMethodForVisit;
	ajaxMethodForEvent 	= _ajaxMethodForEvent;
	ajax_target				 	= _ajax_target;
	mapPhotos						= _mapPhotos;
}

function showSavedAreas(_map){
	log("showSavedAreas()","info")
	if(map===null){
		map = _map;
	}
	drawSavedBackground();
}

function hideSavedAreas(_map){
	log("hideSavedAreas()","info")
	if(map===null){
		map = _map;
	}
	restoreInteractions(map);
}

//Gets displayed extent based project. Used for download layers and background map
function getDisPlayedExtent(){
	var displayedExtent 	= map.getView().calculateExtent(map.getSize());
	var extentToSave;
	//check size, if is too big create an extent of 5km2
	if(displayedExtent[2]-displayedExtent[0]>10000 || displayedExtent[3]-displayedExtent[1]>10000){
		var center 				= map.getView().getCenter();
		extentToSave			= ol.extent.buffer(center.concat(center), 5000);
	}else{
		extentToSave			= displayedExtent;
	}
	return extentToSave;
}

//Removes interaction and feature for selected download area
function restoreInteractions(_map){
	log("restoreInteractions()","info");
	if(map===null){
		map = _map;
	}
	selectingAreaToDownload 	= false;
	showingDownloadedAreas		= false;
	//add drapPan interaction (move map)
	var dragPan;
	map.getInteractions().forEach(function(interaction) {
		if (interaction instanceof ol.interaction.DragPan) {
			dragPan = interaction;
		}
	}, this);
	//remove interaction for moving feature for selecting area
	if (extentSelect) {
		map.removeInteraction(extentSelect);
	}
	if (translateExtent) {
		map.removeInteraction(translateExtent);
	}
	if (!dragPan) {
		var adddragPan = new ol.interaction.DragPan({kinetic: false});
		map.addInteraction(adddragPan);
	}
	if(extentFeature){
		vectorSource.removeFeature(extentFeature);
		extentFeature = null;
	}
	if(vectorLayer){
		map.removeLayer(vectorLayer);
		vectorLayer		= null;
		vectorSource 	= null;
	}
	if(extentFeature){
		vectorSourceSavedBg.removeFeature(savedFeature);
		savedFeature = null;
	}
	if(vectorLayerSavedBg){
		map.removeLayer(vectorLayerSavedBg);
		vectorLayerSavedBg 	= null;
		vectorSourceSavedBg = null;
	}
}
//Selects area for download
function renderAreaToDownLoad(meters){
	log("renderAreaToDownLoad("+meters+")","info");
	if(selectingAreaToDownload){
		$rootScope.$broadcast('offlineDownloadEvent',{evt:"setDownloadButtons",selectArea:true,startDownload:false,selectingArea:false,showAreas:true,downloading:false});
		restoreInteractions();
	}else{
		$rootScope.$broadcast('offlineDownloadEvent',{evt:"setDownloadButtons",selectArea:true,startDownload:true,selectingArea:true,showAreas:true,downloading:false});
		selectingAreaToDownload	= true;
		var extentToSave	= calculateExtentToSave(map.getView().getCenter(),meters);
		/*
			[minx, miny, maxx, maxy]
			TL ,y					TR

			BL 							BR*/
			/*
			Use project extent
			var extentToSave	= getDisPlayedExtent();*/
			var topLeft 			= [extentToSave[0],extentToSave[3]];
			var topRight 			= [extentToSave[0],extentToSave[1]];
			var bottomRight 	= [extentToSave[2],extentToSave[1]];
			var bottomLeft 		= [extentToSave[2],extentToSave[3]];

		vectorSource			= new ol.source.Vector({});
		vectorLayer 			= new ol.layer.Vector({
			source: vectorSource,
			zIndex : 999
		});
		map.addLayer(vectorLayer);
		//put layer on top

		extentFeature	= new ol.Feature({
											geometry: new ol.geom.Polygon([[topLeft, topRight, bottomRight, bottomLeft]])
										});
		extentFeature.setStyle(styleFunction);
			function styleFunction() {
					return [
							new ol.style.Style({
														stroke: new ol.style.Stroke({
														color: 'rgb(120, 120, 120)',
														width: 1
													}),
													fill: new ol.style.Fill({
														color: 'rgba(64, 65, 64, 0.1)'
													}),
													text: new ol.style.Text({
															font: '10px Calibri,sans-serif',
															textBaseline: 'bottom',
															textAlign:'center',
															fill: new ol.style.Fill({ color: '#001f03' }),
															text: localized_strings.OFFLINE_AREA_TO_SAVE,
														})
								})
							];
			}
		vectorSource.addFeature(extentFeature);
		//remove drapPan interaction (move map)
		var dragPan;
		map.getInteractions().forEach(function(interaction) {
			if (interaction instanceof ol.interaction.DragPan) {
				dragPan = interaction;
			}
		}, this);
		if (dragPan) {
			map.removeInteraction(dragPan);
		}
		//add interaction for moving feature for selecting area
		extentSelect 		= new ol.interaction.Select();
		translateExtent = new ol.interaction.Translate({
												features: new ol.Collection([extentFeature])
											});
		map.addInteraction(translateExtent);
		map.addInteraction(extentSelect);
	}
}

function getExtenToDownload(){
	log("getExtenToDownload()","info");
	if(extentFeature){
		extentToSave 	= extentFeature.getGeometry().getExtent();
		log("offline() selected area: "+extentToSave);
		restoreInteractions(map);
	}else{
		extentToSave	= getDisPlayedExtent();
		log("offlineConfigure() project extent: "+extentToSave,"info");
	}
	return extentToSave;
}

//renders saved background as reference
function drawSavedBackground(){
	log("drawSavedBackground()","info");
	if(!showingDownloadedAreas){
		var bgExtent 					= mapStorage.getItem("bgExtent");
		if(bgExtent){
			var extentToDisplay 	= bgExtent.split(',');
			var topLeft 					= [extentToDisplay[0],extentToDisplay[3]];
			var topRight 					= [extentToDisplay[0],extentToDisplay[1]];
			var bottomRight 			= [extentToDisplay[2],extentToDisplay[1]];
			var bottomLeft 				= [extentToDisplay[2],extentToDisplay[3]];

			vectorSourceSavedBg			= new ol.source.Vector({});
			vectorLayerSavedBg 			= new ol.layer.Vector({
				source: vectorSourceSavedBg,
				zIndex : 999
			});
			map.addLayer(vectorLayerSavedBg);
			savedFeature	= new ol.Feature({geometry: new ol.geom.Polygon([[topLeft, topRight, bottomRight, bottomLeft]])});
			savedFeature.setStyle(styleFunction);
				function styleFunction() {
					return [
						new ol.style.Style({
							stroke: new ol.style.Stroke({
							color: '#FF8C00',
							width: 1
						}),
						fill: new ol.style.Fill({
							color: 'rgba(249, 159, 25, 0.1)'
						}),
						text: new ol.style.Text({
								font: '9px Calibri,sans-serif',
								fill: new ol.style.Fill({ color: '#FF8C00' }),
								text: localized_strings.OFFLINE_SAVED_BACKGROUND_AREA
							})
						})
					];
				}
			vectorSourceSavedBg.addFeature(savedFeature);
			showingDownloadedAreas = true;
		}else{
			log("drawSavedBackground() no saved background","warn");
		}
	}
}

//renders saved data as reference
function drawSavedData(){
	log("drawSavedData()","info");
	if(!showingDownloadedAreas){
		var bgExtent 					= mapStorage.getItem("dataExtent");
		if(bgExtent){
			var extentToDisplay 	= bgExtent.split(',');
			var topLeft 					= [extentToDisplay[0],extentToDisplay[3]];
			var topRight 					= [extentToDisplay[0],extentToDisplay[1]];
			var bottomRight 			= [extentToDisplay[2],extentToDisplay[1]];
			var bottomLeft 				= [extentToDisplay[2],extentToDisplay[3]];

			vectorLayerSavedData			= new ol.source.Vector({});
			vectorSourceSavedData 		= new ol.layer.Vector({
				source: vectorSourceSavedData,
				zIndex : 999
			});
			map.addLayer(vectorLayerSavedData);
			savedFeatureData	= new ol.Feature({geometry: new ol.geom.Polygon([[topLeft, topRight, bottomRight, bottomLeft]])});
			savedFeatureData.setStyle(styleFunction);
				function styleFunction() {
					return [
						new ol.style.Style({
							stroke: new ol.style.Stroke({
							color: '#FF8C00',
							width: 1
						}),
						fill: new ol.style.Fill({
							color: 'rgba(249, 159, 25, 0.1)'
						}),
						text: new ol.style.Text({
								font: '9px Calibri,sans-serif',
								fill: new ol.style.Fill({ color: '#FF8C00' }),
								text: localized_strings.OFFLINE_SAVED_BACKGROUND_AREA
							})
						})
					];
				}
			vectorLayerSavedData.addFeature(savedFeatureData);
			showingDownloadedAreas = true;
		}else{
			log("drawSavedData() no saved data","warn");
		}
	}
}

function calculateExtentToSave(center,area) {
	return ol.extent.buffer(center.concat(center), area);
}

function formatDate(stringDate){
	var newfecha 	= new Date(Date.parse(stringDate));
	return newfecha.getDay()+"/"+newfecha.getMonth()+"/"+newfecha.getYear()+" "+newfecha.getHours()+":"+newfecha.getMinutes();
}

// Download status
function isDownloading() {
	return co;
}
/*
// Offline selector stuff
function isSelectorActive() {
	return isSelectorActive;
}*/
/*
function showSelector() {
	isSelectorActive 	= true;
}
*/
/*
function hideSelector() {
	isSelectorActive 	= false;
};

function toggleSelector() {
	isSelectorActive 	= !isSelectorActive;
};
*/
/*
// Offline menu stuff
function isMenuActive() {
	return isMenuActive;
};
/*
function showMenu() {
	isMenuActive 		= true;
};

function hideMenu() {
	isMenuActive 		= false;
};

function toggleMenu() {
	isMenuActive 			= !isMenuActive;
};
*/
// Test if a layer is a KML layer added by the ImportKML tool or
// permalink
// @param olLayerOrId  An ol layer or an id of a layer
function isKmlLayer(olLayerOrId) {
	if (!olLayerOrId) {
		return false;
	}
	if (angular.isString(olLayerOrId)) {
		return /^KML\|\|/.test(olLayerOrId);
	}
	return olLayerOrId.type == 'KML';
}

// Update download status
var progress;
function onDlProgress() {
	if (isDownloading) {
		var nbTiles = nbTilesCached + nbTilesFailed;
		var percent = parseInt(nbTiles * 100 / nbTilesTotal, 10);

		// Trigger event only when needed
		if (percent != progress) {
			progress = percent;
			$rootScope.$broadcast('gaOfflineProgress', progress);
		}
		// Download finished
		if (nbTilesCached + nbTilesFailed == nbTilesTotal) {
			isDownloading = false;
			var percentCached = parseInt(nbTilesCached * 100 / nbTilesTotal,10);

			if (percentCached <= 95) { // Download failed
				//$rootScope.$broadcast('gaOfflineError');
				alert('offline_less_than_95');
			} else { // Download succeed
				//mapStorage.setItem(extentKey, extent);
				log("background end download","success");
				$rootScope.$broadcast('offlineDownloadEvent',{evt:"done"});
				map.removeLayer(wmtsBackgroundRaster);
				wmtsBackgroundRaster = null;
			}
		}
	}
}

// Tile saving error
function onTileError(tileUrl, msg) {
	if (isStorageFull) {
		return;
	}
	nbTilesFailed++;
	errorReport += '\nTile failed: ' + tileUrl + '\n Cause:' + msg;
	onDlProgress();
};

// Tile saving success
function onTileSuccess(size) {
	if (isStorageFull) {
		return;
	}
	sizeCached += size;
	nbTilesCached++;
	onDlProgress();
}

// Read xhr response
function readResponse(tileUrl, response, type) {

	if (isStorageFull) {
		return;
	}
	//OJO - revisado
	var blob = arrayBufferToBlob(response, type);
	// FileReader is strictly used to transform a blob to a base64 string
	var fileReader = new FileReader();
	fileReader.onload = function(evt) {
		//OJO - revisado
		mapStorage.setTile(getTileKey(tileUrl), mapStorage.compress(evt.target.result), function(err, content) {
			log("storing tile: "+tileUrl,"info");
			if (isStorageFull) {
				return;
			}
			if (err) {
				if (err.code == err.QUOTA_ERR) {
					isStorageFull = true;
					//OJO - revisado
					alert("not enouth space");
					nbTilesFailed = nbTilesTotal - nbTilesCached;
					onDlProgress();
				} else {
					onTileError(tileUrl, 'Write db failed, code:' + err.code);
				}
			} else {
				onTileSuccess(blob.size);
			}
		});
	};

	fileReader.onerror = function(evt) {
		onTileError(tileUrl, 'File read failed');
	};

	fileReader.onabort = function(evt) {
		onTileError(tileUrl, 'File read aborted');
	};

	fileReader.readAsDataURL(blob);
};

function getTileKey(tileUrl) {
	return tileUrl.replace(/^\/\/wmts[0-9]/, '');
}

function arrayBufferToBlob(buffer, contentType) {
	if ($window.WebKitBlobBuilder) {
		// BlobBuilder is deprecated, only used in Android Browser
		var builder = new WebKitBlobBuilder();
		builder.append(buffer);
		return builder.getBlob(contentType);
	} else {
		return new Blob([buffer], {type: contentType});
	}
}

function initDownloadStatus() {
	isDownloading 	= false;
	isStorageFull 	= false;
	nbTilesCached 	= 0;
	nbTilesEmpty 		= 0;
	nbTilesFailed 	= 0;
	nbTilesTotal 		= 0;
	requests 				= [];
	sizeCached 			= 0;
	errorReport 		= '';
};

//log function
function log(evt,level,data){
	$rootScope.$broadcast('logEvent',{evt:evt,extradata:data,file:filename,level:level});
}

//****************************************************************
//***********************    END HELPERS    **********************
//****************************************************************

//****************************************************************
//****************************************************************
//****************************************************************
//*****************             WTF              *****************
//****************************************************************
//****************************************************************
//****************************************************************

// Get the magnitude of 3D vector from an origin.
// Used to order tiles by the distance from the map center.
	function getMagnitude(a, origin) {
		return Math.sqrt(
			Math.pow(a[1] + 0.5 - origin[1], 2) +
			Math.pow(a[2] + 0.5 - origin[2], 2) +
			Math.pow(a[0] - origin[0], 2)
		);
	};
	function transformIfAgnostic(url) {
		if (/^\/\//.test(url)) {
			url = location.protocol + url;
		}
		return url;
	};
	function setupPrototypes(){
	/**
	* A representation of a contiguous block of tiles.  A tile range is specified
	* by its min/max tile coordinates and is inclusive of coordinates.
	*
	* @constructor
	* @param {number} minX Minimum X.
	* @param {number} maxX Maximum X.
	* @param {number} minY Minimum Y.
	* @param {number} maxY Maximum Y.
	* @struct
	*/
	ol.TileRange = function(minX, maxX, minY, maxY) {
		/**
		* @type {number}
		*/
		this.minX = minX;
		/**
		* @type {number}
		*/
		this.maxX = maxX;
		/**
		* @type {number}
		*/
		this.minY = minY;
		/**
		* @type {number}
		*/
		this.maxY = maxY;
	};

	/**
	* @param {number} minX Minimum X.
	* @param {number} maxX Maximum X.
	* @param {number} minY Minimum Y.
	* @param {number} maxY Maximum Y.
	* @param {ol.TileRange|undefined} tileRange TileRange.
	* @return {ol.TileRange} Tile range.
	*/
	ol.TileRange.createOrUpdate = function(minX, maxX, minY, maxY, tileRange) {
		if (typeof fileRange!="undefined") {
			tileRange.minX = minX;
			tileRange.maxX = maxX;
			tileRange.minY = minY;
			tileRange.maxY = maxY;
			return tileRange;
		} else {
			return new ol.TileRange(minX, maxX, minY, maxY);
		}
	};
	ol.TileCoord = function(x,y,z){
		var opt_tileCoord = Array();
		opt_tileCoord[0] = z;
		opt_tileCoord[1] = x;
		opt_tileCoord[2] = y;
		return opt_tileCoord;
	};

	ol.tilecoord = {};
	/**
	* @param {number} z Z.
	* @param {number} x X.
	* @param {number} y Y.
	* @param {ol.TileCoord=} opt_tileCoord Tile coordinate.
	* @return {ol.TileCoord} Tile coordinate.
	*/
	ol.tilecoord.createOrUpdate = function(z, x, y, opt_tileCoord) {
		if (typeof opt_tileCoord!="undefined") {
			opt_tileCoord[0] = z;
			opt_tileCoord[1] = x;
			opt_tileCoord[2] = y;
			return opt_tileCoord;
		} else {
			return [z, x, y];
		}
	};

	/**
	* @private
	* @type {ol.TileCoord}
	*/

	ol.tilegrid.TileGrid.tmpTileCoord_ = new ol.TileCoord(0, 0, 0);
	ol.tilegrid.TileGrid.prototype.getTileRangeForExtentAndZ =function(extent, z, opt_tileRange) {
		var resolution = this.getResolution(z);
		return this.getTileRangeForExtentAndResolution(extent, resolution, opt_tileRange);

	};

	ol.tilegrid.TileGrid.prototype.getTileRangeForExtentAndResolution = function(extent, resolution, opt_tileRange) {
		var tileCoord = ol.tilegrid.TileGrid.tmpTileCoord_;
		this.getTileCoordForXYAndResolution_(extent[0], extent[1], resolution, false, tileCoord);
		var minX = tileCoord[1];
		var minY = tileCoord[2];
		this.getTileCoordForXYAndResolution_(extent[2], extent[3], resolution, true, tileCoord);
		return ol.TileRange.createOrUpdate(minX, tileCoord[1], minY, tileCoord[2], opt_tileRange);
	};
	ol.tilegrid.TileGrid.prototype.getTileCoordForXYAndResolution_ = function(x, y, resolution, reverseIntersectionPolicy, opt_tileCoord) {
		var z = this.getZForResolution(resolution);
		var scale = resolution / this.getResolution(z);
		var origin = this.getOrigin(z);
		var tileSize = this.getTileSize(z);


		var tileCoordX = scale * (x - origin[0]) / (resolution * tileSize);
		var tileCoordY = scale * (y - origin[1]) / (resolution * tileSize);

		if (reverseIntersectionPolicy) {
			tileCoordX = Math.ceil(tileCoordX) - 1;
			tileCoordY = Math.ceil(tileCoordY) - 1;
		} else {
			tileCoordX = Math.floor(tileCoordX);
			tileCoordY = Math.floor(tileCoordY);
		}

		return ol.tilecoord.createOrUpdate(z, tileCoordX, tileCoordY, opt_tileCoord);
	};
	ol.tilegrid.TileGrid.prototype.getZForResolution = function(resolution) {
		return kk(defaultResolutions, resolution, 0);


		function kk(arr, target, direction){
			var n = arr.length;
			if (arr[0] <= target) {
				return 0;
			} else if (target <= arr[n - 1]) {
				return n - 1;
			} else {
				var i;
				if (direction > 0) {
					for (i = 1; i < n; ++i) {
						if (arr[i] < target) {
							return i - 1;
						}
					}
				} else if (direction < 0) {
					for (i = 1; i < n; ++i) {
						if (arr[i] <= target) {
							return i;
						}
					}
				} else {
					for (i = 1; i < n; ++i) {
						if (arr[i] == target) {
							return i;
						} else if (arr[i] < target) {
							if (arr[i - 1] - target < target - arr[i]) {
								return i - 1;
							} else {
								return i;
							}
						}
					}
				}
				// We should never get here, but the compiler complains
				// if it finds a path for which no number is returned.

				return n - 1;
			}
		}


	};
}
	//****************************************************************
	//****************************************************************
	//****************************************************************
	//*****************            END WTF           *****************
	//****************************************************************
	//****************************************************************
	//****************************************************************

}])


})();

(function() {
	angular.module('app').factory('mapStorage', ['$http','$rootScope','$window', function ($http,$rootScope,$window) {
	/*
		* Service provides read/write/delete functions in local storages.
		*
		* There is 2 sets (get/set/remove) of functions:
		*   - one for tiles management. These functions use the mozilla localforage
		*   library (see http://github.com/mozilla/localForage). We use this library
		*   to get the maximum advantages of last HTML 5 offline storage features
		*   (indexedDb, webSQL, localStorage). See the api doc for more
		*   information http://mozilla.github.io/localForage/.
		*
		*   - one for basic localStorage. These functions are used to store simple
		*   string (homescreen popup, offline data informations).
		*
	*/

	// Strings management
		// LocalStorage creates a bug on IE >= 10 when security settings
		// are tight and don't permit writing on specific files. We put
		// it in try/catch to determine it here
		// See: http://stackoverflow.com/questions/13102116/access-denied
	var localStorageSupport = false;
	try {
		$window.localStorage.getItem('testkey');
		localStorageSupport = true;
	} catch (e) {
	}
	var databaseName        = "bmaps.bgeo.es";
	var isInitialized       = false;
	// public API
	var dataFactory 		= {

								init: 							init,
								getItem:						getItem,
								setItem:						setItem,
								removeItem:					removeItem,
								getTile:						getTile,
								setTile: 						setTile,
								clearTiles:					clearTiles,
								removeTile:					removeTile,
								decompress: 				decompress,
								compress:   				compress,
								clearDatabase: 			clearDatabase,
								localStorageSpace:	localStorageSpace

							};
	return dataFactory;

	//****************************************************************
	//***********************         METHODS   **********************
	//****************************************************************

	function init() {
		//OJO cOJO OJO chequea si es movil
				if (!isInitialized && $window.localforage) {
						$window.localforage.config({
							name: databaseName,
							storeName: 'ga',
							size: 50 * 1024 * 1024, // Only use by webSQL
							version: '2.0',
							description: 'Storage for '+databaseName
						});
						// IE > 10, Safari, Chrome, Opera, FF -> indexeddb
						//
						// Exceptions:
						// Android default browser -> websql
						// iOS Chrome, Opera -> websql
						// iOS 7 Safari -> websql
						isInitialized = true;
				}
		};


	function getItem(key) {
		if (localStorageSupport) {
			return $window.localStorage.getItem(key);
		}
	}

	function setItem(key, data) {
		if (localStorageSupport) {
			return $window.localStorage.setItem(key, data);
		}
	};

	function removeItem(key) {
		if (localStorageSupport) {
			return $window.localStorage.removeItem(key);
			}
	}

	function getTile(key, callback) {
		if (!isInitialized) {
			return callback(null);
		}
		$window.localforage.getItem(key, function(err, compressedDataURI) {
			callback(err, decompress(compressedDataURI));
		});
	};

	function setTile(key, dataURI, callback) {
				//this.init();
		$window.localforage.setItem(key, dataURI, callback);
	};

	function removeTile(key, callback) {
		this.init();
		$window.localforage.removeItem(key, callback);
	};

	function clearTiles(callback) {
			this.init();
			$window.localforage.clear(callback);
	};

	function clearDatabase(){
		var req = indexedDB.deleteDatabase(databaseName);
		req.onsuccess = function () {
			console.log("Deleted database successfully");
		};
		req.onerror = function () {
			console.log("Couldn't delete database");
		};
		req.onblocked = function () {
			console.log("Couldn't delete database due to the operation being blocked");
		};
		$window.localStorage.clear();
	}

	//****************************************************************
	//***********************    END  METHODS   **********************
	//****************************************************************

	//****************************************************************
	//***********************        HELPERS    **********************
	//****************************************************************

	function compress(s) {
		if (!s) {
					return s;
			}
		var i, l, out = '';
		if (s.length % 2 !== 0) {
					s += ' ';
				}
		for (i = 0, l = s.length; i < l; i += 2) {
					out += String.fromCharCode((s.charCodeAt(i) * 256) + s.charCodeAt(i + 1));
				}
		return String.fromCharCode(9731) + out;
		};

	function decompress(s) {
		if (!s) {
			return s;
		}
		var i, l, n, m, out = '';
		if (s.charCodeAt(0) !== 9731) {
			return s;
		}
		for (i = 1, l = s.length; i < l; i++) {
			n = s.charCodeAt(i);
			m = Math.floor(n / 256);
			out += String.fromCharCode(m, n % 256);
		}
		return out;
	};

	function localStorageSpace(cb){
			var data 				= '';
			var returnInfo = {};
			for(var key in window.localStorage){
				if(window.localStorage.hasOwnProperty(key)){
					data += window.localStorage[key];

					//console.log( key + " = " + ((window.localStorage[key].length * 16)/(8 * 1024)).toFixed(2) + ' KB' );
				}
			}
			returnInfo.localStorageUsed = ((data.length * 16)/(8 * 1024)/1024).toFixed(2);
			//console.log(data ? '\n' + 'Total space used: ' + ((data.length * 16)/(8 * 1024)).toFixed(2) + ' KB' : 'Empty (0 KB)');
			//console.log(data ? 'Approx. space remaining: ' + (5120 - ((data.length * 16)/(8 * 1024)).toFixed(2)) + ' KB' : '5 MB');
			navigator.webkitTemporaryStorage.queryUsageAndQuota (
			 function(usedBytes, grantedBytes) {
				returnInfo.indexDbUsedMb 		= (usedBytes / (1024*1024)).toFixed(2);
				returnInfo.indexDbGrantedMb = (grantedBytes / (1024*1024)).toFixed(2);
				returnInfo.usedPercentage 	= usedPercentage(returnInfo.indexDbUsedMb,returnInfo.indexDbGrantedMb);
				//console.log('we are using ', usedBytes, ' of ', grantedBytes, 'bytes');
				//console.log('we are using ', usedMb, ' of ', granteMb, 'MB');
				cb(null,returnInfo)
			 },
			 function(e) {
				 console.log('Error', e);
				 cb(e,null);
		 		}
			);
	};

	function usedPercentage(used,total){
		return ((100*used)/total).toFixed(2);
	}
	//****************************************************************
	//***********************     END HELPERS    *********************
	//****************************************************************

	}]);

})();
(function() {
'use strict';
/**
 * Factory for map TOC

 Author: Leandro Lopez-Guerrero Hirsch
 @Leo_lopezg

 october 2017

 ******************************************************************************************************

 Available methods:
_token,_app_name,_mc,_use_layer_auth,_user_permissions
 - init
		initializes mapToc module
		@param _token  (string) token for cross site injection protection
		@param _app_name (string) for logging purposes
		@param _mc (angular element)
		@param _use_layer_auth (BOOL)
		@param _user_permissions (JSON)

 - formatLayers.
		builds TOC, checking if a layer is final layer or container,
		if is container, assigns isContainer= true

		@param rawlayers (JSON) - from project capabilities
		@return mc.layers (JSON) - assigns processed JSON to angular element mc.layers

	- setActiveLayer.
			sets active layer

		@param item (JSON) - TOC element
		@param index (int) - array position
		@return actions on mapFactory

	- userCanSeeLayer.
			checks if a user can see a layer, based on user_permissions

		@param layer (JSON) - TOC element
		@return bool

	- addRemoveLayer.
			adds or removes a layer from map

		@param item (JSON) - TOC element
		@param index (int) - array position
		@return actions on mapFactory

	- userCanEditLayer.
			checks if a user can edit a layer, based on user_permissions

		@param layer (JSON) - TOC element
		@return bool

	- addRemoveContainer.
			adds or removes a contrainer layer from map

		@param item (JSON) - TOC element
		@param index (int) - array position
		@param active (bool) - flag for knowing if is active layer
		@return actions on mapFactory

	- markActiveLayer
			adds properties to TOC element for graphic indication that is the active layer

		@param name (string) - layer name
		@return actions on mc.layers

	- unMarkLayer
			adds properties to TOC element for graphic indication that is NOT the active layer

		@param name (string) - layer name
		@return actions on mc.layers

	- getObjectLayerByLayerName
			returns full layer object based on layer name
			@param name (string) - layer name
			@return JSON (layer object)
*/


angular.module('app').factory('mapToc', ['$http','$rootScope','mapFactory', function ($http,$rootScope,mapFactory) {


	var filename 				= "mapToc.js",
		app_name					= null,
		mc								= null,
		use_layer_auth		= false,
		user_permissions	= null,
		available_layers 	= Array(),			//list of available layers
		token							= null;

	// public API
	var dataFactory 				= {
										init: 							init,
										formatLayers:				formatLayers,
										setActiveLayer:			setActiveLayer,
										userCanSeeLayer:		userCanSeeLayer,
										addRemoveLayer:			addRemoveLayer,
										userCanEditLayer:		userCanEditLayer,
										addRemoveContainer: addRemoveContainer,
										markActiveLayer:    markActiveLayer,
										unMarkLayer:				unMarkLayer,
										getAvailableLayers:	getAvailableLayers,
										getObjectLayerByLayerName: getObjectLayerByLayerName
						};
	return dataFactory;

	//****************************************************************
	//***********************       INIT       ***********************
	//****************************************************************

	function init(_token,_app_name,_mc,_use_layer_auth,_user_permissions){
		token								= _token;
		app_name						= _app_name;
		mc 									= _mc;
		use_layer_auth			= _use_layer_auth;
		user_permissions		= _user_permissions;
		log("init()");
		mapFactory.injectDependency('mapToc',this);
	}

	//****************************************************************
	//***********************      END INIT    ***********************
	//****************************************************************
	function getAvailableLayers(){
		return available_layers;
	}
	//****************************************************************
	//**********************    Format layers    *********************
	//****************************************************************

	function formatLayers(rawlayers){
		log("formatLayers()",rawlayers);
		//first Level
		for (var i=0;i<rawlayers.length;i++){
			rawlayers[i].isContainer 		= false;
			rawlayers[i].isActiveLayer 	= false;
			available_layers.push(rawlayers[i].Name);
			//second level
			if (typeof rawlayers[i].Layer != 'undefined'){
				rawlayers[i].isContainer = true;
				for (var s=0;s<rawlayers[i].Layer.length;s++){
					rawlayers[i].Layer[s].isContainer 	= false;
					rawlayers[i].Layer[s].isActiveLayer = false;
					available_layers.push(rawlayers[i].Layer[s].Name);
					//third level
					if (typeof rawlayers[i].Layer[s].Layer != 'undefined'){
						rawlayers[i].Layer[s].isContainer 	= true;
						rawlayers[i].Layer[s].isActiveLayer = false;

						for (var t=0;t<rawlayers[i].Layer[s].Layer.length;t++){
							//fourth level
							rawlayers[i].Layer[s].Layer[t].isContainer 		= false;
							rawlayers[i].Layer[s].Layer[t].isActiveLayer 	= false;
							available_layers.push(rawlayers[i].Layer[s].Layer[t].Name);
							if (typeof rawlayers[i].Layer[s].Layer[t].Layer != 'undefined'){
								rawlayers[i].Layer[s].Layer[t].isContainer = true;
							}
						}
					}
				}
			}
		}
		mc.layers		= rawlayers;
	}

	//****************************************************************
	//**********************  END Format layers    *******************
	//****************************************************************

	//****************************************************************
	//**********************   SET ACTIVE LAYER    *******************
	//****************************************************************

	function setActiveLayer(item,index){
		log("setActiveLayer: ",item);
		if(!item.isContainer){
			if(item.Name!=mapFactory.getActiveLayerName()){
				resetActiveLayer();
				var layer_displayed = mapFactory.getLayersDisplayed();
				if(layer_displayed.indexOf(item.Name)==-1){
					if(!item.isSelected){
						item.isSelected 	= true;
					}else{
						item.isSelected 	= false;
					}
					if(!item.isActiveLayer){
						item.isActiveLayer 	= true;
					}else{
						item.isActiveLayer 	= false;
					}
					//render layer and add it to layers list
					mapFactory.addLayer(item.Name);
					//mark as active layer for infos
					mapFactory.setActiveLayer(item.Name);
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
				$rootScope.$broadcast('legendEvent',{item:item,event:'show'});
				//enable/disable tools
				if(mapFactory.getLayersDisplayed().length>0){
					$rootScope.toolsDisabled			= false;
				}else{
					$rootScope.toolsDisabled			= true;
				}
			}
		}else{
			addRemoveLayer(item,index);
		}
	}

	//****************************************************************
	//**********************  END SET ACTIVE LAYER    ****************
	//****************************************************************

	//****************************************************************
	//**********************    USER CAN SEE LAYER    ****************
	//****************************************************************

	function userCanSeeLayer(layer){
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

	$rootScope.userCanEditLayer = function(layer){
		return userCanEditLayer(layer);
	}

	//****************************************************************
	//**********************  END USER CAN SEE LAYER    **************
	//****************************************************************

	//****************************************************************
	//******************        addRemoveLayer          **************
	//****************************************************************
	//single layer
	function addRemoveLayer	(item,index){
		log("addRemoveLayer: ",item);
		var numberOflayersDisplayed 	= mapFactory.getLayersDisplayed().length;
		if(!item.isSelected){
			item.isSelected 	= true;
			if(!item.isContainer){
				if(numberOflayersDisplayed===0){
					mapFactory.setActiveLayer(item.Name);
					//$rootScope.$broadcast('legendEvent',item);
				}
			}else{
					//$rootScope.$broadcast('legendEvent',item);
			}
		}else{
			item.isSelected 	= false;
		}
		mapFactory.addLayer(item,index);

		if(item.isActiveLayer){
			resetActiveLayer();
			selectNextAvailableActiveLayer();
		}

		var numberOflayersDisplayed 	= mapFactory.getLayersDisplayed().length;
		//enable/disable tools
		if(numberOflayersDisplayed>0){
			$rootScope.toolsDisabled			= false;
		}else{
			$rootScope.toolsDisabled			= true;
		}
		//set active layer if only 1 is displayed and this is activeLayer
		if(numberOflayersDisplayed===1 || (typeof mapFactory.getActiveLayerName()==="undefined")){
			selectNextAvailableActiveLayer();
		}
	}

	//****************************************************************
	//******************     END addRemoveLayer         **************
	//****************************************************************

	//****************************************************************
	//**********************     USER CAN EDIT LAYER     *************
	//****************************************************************

	function userCanEditLayer(layer){
		log("userCanEditLayer("+layer+")");
		//if(typeof layer!="undefined" && layer!="undefined"){
			$rootScope.addPointDisabled				= true;
			$rootScope.addLineDisabled				= true;
			$rootScope.addPopolygonDisabled		= true;
			if(use_layer_auth && layer.toLowerCase()!="visits"){
				for (var i=0;i<user_permissions.length;i++){
					if(user_permissions[i].qgis_name===layer && user_permissions[i].edit===1){
						if(user_permissions[i].geometry==="Point" || user_permissions[i].geometry==="MultiPoint"){
							$rootScope.addPointDisabled	= false;
							$rootScope.$broadcast('define_geometryTypeInTools',{toolName:user_permissions[i].geometry});
						}else if(user_permissions[i].geometry==="Polygon" || user_permissions[i].geometry==="MultiPolygon"){
							$rootScope.$broadcast('define_geometryTypeInTools',{toolName:user_permissions[i].geometry});
							$rootScope.addPopolygonDisabled	= false;
						}else if(user_permissions[i].geometry==="LineString" || user_permissions[i].geometry==="MultiLineString"){
							$rootScope.$broadcast('define_geometryTypeInTools',{toolName:user_permissions[i].geometry});
							$rootScope.addLineDisabled	= false;
						}
						return true;
					}
				}
			}else{
				return false;
			}
		/*}else{
			return false;
		}*/
	}

	//****************************************************************
	//**********************  END USER CAN EDIT LAYER    *************
	//****************************************************************

	//****************************************************************
	//**********************     ADD/REMOVE CONTAINER    *************
	//****************************************************************

	//container layer
	function addRemoveContainer(item,index,active){
		log("addRemoveContainer: ",item+","+index+","+active);
		//first Level
		for (var i=0;i<mc.layers.length;i++){
			if(mc.layers[i].Name===item.Name){
				mc.layers[i].isSelected = active;
				for (var s=0;s<mc.layers[i].Layer.length;s++){
					if(mc.layers[i].Layer[s].isContainer){
						addRemoveContainer(mc.layers[i].Layer[s],null,active);
					}else{
						if(mc.layers[i].Layer[s].isSelected){
							mc.layers[i].Layer[s].isSelected = active;
							//mc.layers[i].Layer[s].isActiveLayer = false;
							removeLayer(mc.layers[i].Layer[s].Name);
						}else{
							if(active){
								addRemoveLayer(mc.layers[i].Layer[s],null);
							}
						}
					}
				}
			}
			//second level
			if (typeof mc.layers[i].Layer != 'undefined'){
				for (var s=0;s<mc.layers[i].Layer.length;s++){
					if(mc.layers[i].Layer[s].Name===item.Name){
						mc.layers[i].Layer[s].isSelected = active;
						for (var t=0;t<mc.layers[i].Layer[s].Layer.length;t++){
							if(mc.layers[i].Layer[s].isContainer){
								addRemoveContainer(mc.layers[i].Layer[s].Layer[t],null,active);
							}else{
								if(mc.layers[i].Layer[s].Layer[t].isSelected){
									mc.layers[i].Layer[s].Layer[t].isSelected = active;
									//mc.layers[i].Layer[s].Layer[t].isActiveLayer = false;
									removeLayer(mc.layers[i].Layer[s].Layer[t].Name);
								}else{
									if(active){
										addRemoveLayer(mc.layers[i].Layer[s].Layer[t],null);
									}
								}
							}
						}
						//third level
						if (typeof mc.layers[i].Layer[s].Layer != 'undefined'){
							for (var t=0;t<mc.layers[i].Layer[s].Layer.length;t++){
								mc.layers[i].Layer[s].isSelected=active;
								if(mc.layers[i].Layer[s].Layer[t].isSelected){
									mc.layers[i].Layer[s].Layer[t].isSelected = active;
									removeLayer(mc.layers[i].Layer[s].Layer[t].Name);
								}else{
									if(active){
										addRemoveLayer(mc.layers[i].Layer[s].Layer[t],null);
									}
								}
							}//close third level
						}
					}
				}//close secondedlevel
			}
		}//close first level

	}//close function

	//****************************************************************
	//********************   END ADD/REMOVE CONTAINER    *************
	//****************************************************************

	//****************************************************************
	//********************        MARK ACTIVE LAYER      *************
	//****************************************************************

	function markActiveLayer(name){
		log("markActiveLayer("+name+")");
		if(mapFactory.getOnlineStatus()){
			if(typeof name!="undefined" && name!="undefined"){
				//first Level
				for (var i=0;i<mc.layers.length;i++){
					if(mc.layers[i].Name===name){
						if(!mc.layers[i].isContainer){
							mc.layers[i].isActiveLayer = true;
						}else{
							mc.layers[i].isActiveLayer = false;
						}
						break;
					}
					//second level
					if (typeof mc.layers[i].Layer != 'undefined'){
						for (var s=0;s<mc.layers[i].Layer.length;s++){
							if(mc.layers[i].Layer[s].Name===name){
								if(!mc.layers[i].Layer[s].isContainer){
									mc.layers[i].Layer[s].isActiveLayer = true;
								}else{
									mc.layers[i].Layer[s].isActiveLayer = false;
								}
								break;
							}
							//third level
							if (typeof mc.layers[i].Layer[s].Layer != 'undefined'){
								for (var t=0;t<mc.layers[i].Layer[s].Layer.length;t++){
									if(mc.layers[i].Layer[s].Layer[t].Name===name){
										if(!mc.layers[i].Layer[s].Layer[t].isContainer){
											mc.layers[i].Layer[s].Layer[t].isActiveLayer = true;
										}else{
											mc.layers[i].Layer[s].Layer[t].isActiveLayer = false;
										}
										break;
									}
								}
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

	//****************************************************************
	//********************     END MARK ACTIVE LAYER     *************
	//****************************************************************

	//****************************************************************
	//********************      UNMARK ACTIVE LAYER      *************
	//****************************************************************

	function unMarkLayer(layer_name){
		log("resetLayers("+layer_name+")");
		//first Level
		for (var i=0;i<mc.layers.length;i++){
			if(mc.layers[i].Name===layer_name){
				mc.layers[i].isSelected = false;
			}
			//second level
			if (typeof mc.layers[i].Layer != 'undefined'){
				for (var s=0;s<mc.layers[i].Layer.length;s++){
					if(mc.layers[i].Layer[s].Name===layer_name){
						mc.layers[i].Layer[s].Layer[t].isSelected = false;
					}
					//third level
					if (typeof mc.layers[i].Layer[s].Layer != 'undefined'){
						for (var t=0;t<mc.layers[i].Layer[s].Layer.length;t++){
							if(mc.layers[i].Layer[s].Layer[t].Name===layer_name){
								mc.layers[i].Layer[s].Layer[t].isSelected = false;
							}
						}
					}
				}
			}
		}
		resetActiveLayer();
		selectNextAvailableActiveLayer();
	}

	//****************************************************************
	//********************    END  UNMARK ACTIVE LAYER   *************
	//****************************************************************

	//****************************************************************
	//***************  Get Object Layer By name   ********************
	//****************************************************************

	function getObjectLayerByLayerName(name){
		log("getObjectLayerByLayerName("+name+")");
		var rawlayers = mc.layers;
		//first Level
		for (var i=0;i<rawlayers.length;i++){
			if(rawlayers[i].Name===name){
				return rawlayers[i];
				break;
			}
			//second level
			if (typeof rawlayers[i].Layer != 'undefined'){
				for (var s=0;s<rawlayers[i].Layer.length;s++){
					if(rawlayers[i].Layer[s].Name===name){
						return rawlayers[i].Layer[s];
						break;
					}

					//third level
					if (typeof rawlayers[i].Layer[s].Layer != 'undefined'){
						for (var t=0;t<rawlayers[i].Layer[s].Layer.length;t++){
							if(rawlayers[i].Layer[s].Layer[t].Name===name){
								return rawlayers[i].Layer[s].Layer[t];
								break;
							}
						}
					}
				}
			}
		}
	}

	//****************************************************************
	//************  End Get Object Layer By name   *******************
	//****************************************************************


	function removeLayer(layer_name){
		log("removeLayer("+layer_name+")");
		mapFactory.removeLayer(layer_name);
		selectNextAvailableActiveLayer();
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

	function layerIsContainer(layer){
		log("layerIsContainer("+layer+")");
		for (var i=0;i<mc.layers.length;i++){
			if(mc.layers[i].Name===layer){
				return mc.layers[i].isContainer;
				break;
			}
			//second level
			if (typeof mc.layers[i].Layer != 'undefined'){
				for (var s=0;s<mc.layers[i].Layer.length;s++){
					if(mc.layers[i].Layer[s].Name===layer){
						return mc.layers[i].Layer[s].isActiveLayer;
						break;
					}
					//third level
					if (typeof mc.layers[i].Layer[s].Layer != 'undefined'){
						for (var t=0;t<mc.layers[i].Layer[s].Layer.length;t++){
							if(mc.layers[i].Layer[s].Layer[t].Name===layer){
								return mc.layers[i].Layer[s].Layer[t].isActiveLayer;
								break;
							}

							//fourth level
							if (typeof mc.layers[i].Layer[s].Layer[t].Layer != 'undefined'){

								for (var f=0;f<mc.layers[i].Layer[s].Layer[t].Layer.length;f++){
									if(mc.layers[i].Layer[s].Layer[t].Layer[f].Name===layer){
										return mc.layers[i].Layer[s].Layer[t].Layer[f].isActiveLayer;
										break;
									}
								}
							}
						}
					}
				}
			}
		}
	}



	function selectNextAvailableActiveLayer(){
		log("selectNextAvailableActiveLayer()");
		resetActiveLayer();
		var layerDisplayed		= false;
		var layers_displayed = mapFactory.getLayersDisplayed();
		//find first available layer for select
		for (var i=0;i<layers_displayed.length;i++){
			if(!layerIsContainer(layers_displayed[i])){
				markActiveLayer(layers_displayed[i]);
				//$rootScope.$broadcast('legendEvent',{});
				mapFactory.setActiveLayer(layers_displayed[i]);
				layerDisplayed = true;
				break;
			}
		}
		if(!layerDisplayed){
			mapFactory.setTool(null);
			mapFactory.resetActiveLayer();
			mapFactory.resetAddTools();
			$rootScope.addPointDisabled			= true;
			$rootScope.addLineDisabled			= true;
			$rootScope.addPopolygonDisabled		= true;
			//selectNextAvailableALegend();
		}
	}

	function selectNextAvailableALegend(){
		log("selectNextAvailableALegend()");
		var layers_displayed = mapFactory.getLayersDisplayed();
		if(layers_displayed.length>0){
			//find first available layer for select
			for (var i=0;i<layers_displayed.length;i++){
				if(layerIsContainer(layers_displayed[i])){
					$rootScope.$broadcast('legendEvent',{});
					break;
				}
			}
		}else{
			$rootScope.$broadcast('legendEvent',{});
		}
	}

	$rootScope.$on('notifyNoActiveLayer', function (event, data){
		mc.legend 			= null;
		mc.showLegend		= false;
		if($('#legend').length>0){
			$('#legend').collapse('hide');
			$('#menuLegend').addClass("collapsed");
		}
	});

	//****************************************************************
	//***********************      HELPERS      **********************
	//****************************************************************

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
 * Factory for map mapAjaxOperations

 Author: Leandro Lopez-Guerrero Hirsch
 @Leo_lopezg

 March 2017
*/

angular.module('app').factory('mapAjaxOperations', ['$http','$rootScope', function ($http,$rootScope) {


	var filename 				= "mapAjaxOperations.js",
			app_name				= null,
			version 				= "1.0.2",
			baseUrl					= null,
			token						= null;

	// public API
	var dataFactory 		= {
				init: 				              			init,
				getLocalizedStrings:							getLocalizedStrings,
				getFormDataForVisitForm:          getFormDataForVisitForm,
				getProjectInfo:                   getProjectInfo,
				addGeometry:                      addGeometry,
				updateFeatureField:               updateFeatureField,
				deleteElement:                    deleteElement,
				addVisit:                         addVisit,
				addVisitInfo:                     addVisitInfo,
				getVisit:                         getVisit,
				removeVisit:                      removeVisit,
				removeEvent:                      removeEvent,
				getVisitInfo:                     getVisitInfo
	};

	return dataFactory;

	//****************************************************************
	//***********************       INIT       ***********************
	//****************************************************************

	function init(_token,_app_name){
		token						= _token;
		app_name				= _app_name;
		var getUrl 			= window.location;
		baseUrl 				= getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1]+"/";
		if(getUrl.pathname.split('/')[1]==="dev"){
			baseUrl = baseUrl+"demo/";
		}
		log("init("+_token+","+_app_name+") baseUrl: "+baseUrl+" getUrl: "+getUrl,"info");
	}

	//****************************************************************
	//***********************      END INIT    ***********************
	//****************************************************************

	//****************************************************************
	//*******************   LOCALIZED STRINGS   **********************
	//****************************************************************

	function getLocalizedStrings(callback){
		log("getLocalizedStrings()","info");
		//read strings
		var data2send 						= new FormData();
		data2send.append('token', 		token);
		var localized_strings			= {};
		$http.post(
				baseUrl+"ajax.strings.php",
				data2send,
				{
					transformRequest: angular.identity,
					headers: {'Content-Type': undefined
				}
		}).success(function (data) {
				log("strings loaded","success",data);
				if(data.status==="Accepted"){
					for(var i=0;i<data.message.length;i++){
						var key 	= Object.keys(data.message[i])[0];
						var value = Object.values(data.message[i])[0];
						localized_strings[key] = value;
					}
					callback(null,localized_strings);
				}else{
					callback(data.message,data);
				}
			}).error(function (error) {
				log("error requesting strings","error",error);
				callback(error);
			});
	}
	//****************************************************************
	//*******************   LOCALIZED STRINGS   **********************
	//****************************************************************

	//****************************************************************
	//***********************      FORM DATA    **********************
	//****************************************************************

	function getFormDataForVisitForm(ajax_target,_token,okCb,koCb){
		log("getFormDataForVisitForm("+ajax_target+")","info");
		token				= _token;
		var data2send		= {};
		data2send.what		= "GET_FORM_DATA";
		data2send.token		= token;
		$http.post(ajax_target, data2send).success(function (data) {
				log("getFormData result:","success",data);
				try{
					if(data.status==="Accepted"){
						okCb(data['message']);
					}else{
						koCb(data,data['message']);
					}
				}catch(e){
					koCb(data,e);
				}
		});
	}

	//****************************************************************
	//***********************   END FORM DATA    *********************
	//****************************************************************

	//****************************************************************
	//***********************   GET PROJECT INFO *********************
	//****************************************************************

	function getProjectInfo(ajax_target,token,project_id,okCb,koCb){
			var data2send			= {};
			data2send.what			= "GET_PROJECT_INFO";
			data2send.project_id	= project_id;
			data2send.token			= token;
			$http.post(ajax_target, data2send).success(function (data) {
			log("getProjectInfo() result:","success",data);
				if(data.status==="Accepted"){
					var use_layer_auth					 = Boolean(data.message.use_layer_auth);
					if(use_layer_auth){
						log("request GET_USER_PERMISSIONS","info");
						var data2send					= {};
						data2send.what				= "GET_USER_PERMISSIONS";
						data2send.project_id	= project_id;
						data2send.token				= token;
						$http.post(ajax_target, data2send).success(function (dataPermissions) {
							log("GET_USER_PERMISSIONS result","success",dataPermissions);
							if(dataPermissions.status==="Accepted"){
									data.message.dataPermissions = dataPermissions;
								okCb(data.message,data.message.use_realtime,dataPermissions.message);
							}else{
									koCb(data.message,"Error requesting GET_USER_PERMISSIONS");
							}
						}).error(function (error) {
							log("error requesting GET_USER_PERMISSIONS","error");
							koCb(data.message,"Error requesting GET_USER_PERMISSIONS");
						});
					}else{
						okCb(data.message,data.message.use_realtime,null);
					}
				}else{
						koCb(data.message,"error requesting getProjectInfo");
				}
			}).error(function (error) {
				koCb(error,"error requesting getProjectInfo");
			});
		}

	//****************************************************************
	//********************   END GET PROJECT INFO   ******************
	//****************************************************************

	//****************************************************************
	//********************       ADD GEOMETRY       ******************
	//****************************************************************

	function addGeometry(ajax_target,epsg,tableIdName,layer,geom,photo,editableAttributes,okCb,koCb){
		log("addGeometry("+ajax_target+","+epsg+","+tableIdName+","+layer+","+geom+","+photo+")","info",editableAttributes);
		var data2send 					= new FormData();
		data2send.append('epsg', 					epsg);
		data2send.append('tableIdName', 	tableIdName);
		data2send.append('token', 				token);
		data2send.append('layer',					layer);
		data2send.append('what', 					"ADD_GEOMETRY");
		data2send.append("geom", 					geom);
		if(photo){
			data2send.append('file', 				photo);
		}
		//dynamic attributes
		for (var k in editableAttributes) {
			if (editableAttributes.hasOwnProperty(k)) {
				data2send.append(k, 	editableAttributes[k]);
			}
		}
		$http.post(
			ajax_target,
			data2send,
			{
				transformRequest: angular.identity,
				headers: {'Content-Type': undefined
			}
		}).success(function (data) {
			log("addGeometry() result:","success",data);
			if(data.status==="Accepted"){
				okCb();
			}else{
				koCb("Error requesting addGeometry");
			}
		}).error(function (error) {
			log("error requesting addGeometry","error");
			koCb("Error requesting addGeometry");
		});
	}

	//****************************************************************
	//********************     END ADD GEOMETRY      *****************
	//****************************************************************

	//****************************************************************
	//********************      UPDATE ELEMENT      ******************
	//****************************************************************

	function updateFeatureField(ajax_target,id,tableIdName,epsg,postgresDbField,value,layer,okCb,koCb){
		log("updateFeatureField("+ajax_target+","+epsg+","+tableIdName+","+layer+","+id+","+postgresDbField+","+value+")");
		var data2send 				= new FormData();
		data2send.append('id', 			id);
		data2send.append('layer', 		layer);
		data2send.append('epsg', 		epsg);
		data2send.append('what', 		"UPDATE_FEATURE");
		data2send.append('token', 		token);
		data2send.append('tableIdName', tableIdName);

		if(postgresDbField!=undefined){
			data2send.append(postgresDbField.name, 	value);
		}else{
			data2send.append(fieldName, 	value);
		}

		$http.post(
			ajax_target,
			data2send,
			{
				transformRequest: angular.identity,
				headers: {'Content-Type': undefined
			}
		}).success(function (data) {
			log("updateFeature() result:","success",data);
			if(data.status==="Accepted"){
				okCb();
			}else{
				koCb("Error requesting updateFeature",data);
			}
		}).error(function (error) {
			log("error requesting updateFeature","error");
			koCb("Error requesting updateFeature",error);
		});
	}

	//****************************************************************
	//********************   END UPDATE ELEMENT      *****************
	//****************************************************************

	//****************************************************************
	//********************       DELETE ELEMENT      *****************
	//****************************************************************

	function deleteElement(ajax_target,id,layer,tableIdName,geom,okCb,koCb){
		log("deleteElement("+ajax_target+","+id+","+tableIdName+","+layer+")");
		var data2send 			= new FormData();
		data2send.append('id', 			id);
		data2send.append('layer', 		layer);
		data2send.append('what', 		"REMOVE_FEATURE");
		data2send.append('token', 		token);
		data2send.append('tableIdName', tableIdName);
		$http.post(
			ajax_target,
			data2send,
			{
				transformRequest: angular.identity,
				headers: {'Content-Type': undefined
			}
		}).success(function (data) {
			log("deleteFeature() result:","success",data);
			if(data.status==="Accepted"){
				okCb(geom);
			}else{
				koCb("Error requesting deleteFeature",null);
			}
		}).error(function (error) {
			log("error requesting deleteFeature","error");
			koCb("Error requesting deleteFeature",error);
		});
	}

	//****************************************************************
	//********************     END DELETE ELEMENT      ***************
	//****************************************************************

	//****************************************************************
	//********************          GET VISIT        *****************
	//****************************************************************

	function getVisit(ajax_target,element_id,layer,extraData,okCb,koCb){
		var data2send 					= new FormData();
		data2send.append('token', 		token);
		data2send.append('what', 		"GET_VISIT");
		data2send.append('element_id', 	element_id);
		data2send.append('layer_id',	layer);

		$http.post(
			ajax_target,
			data2send,
			{
				transformRequest: angular.identity,
				headers: {'Content-Type': undefined
			}
		}).success(function (result) {
			log("getVisit() result:","success",result);
			if(result.status==="Accepted"){
				okCb(result.message,extraData);
			}else{
				koCb("Error requesting getVisit",result);
			}
		}).error(function (error) {
			log("error requesting getVisit","error",error);
			koCb("Error requesting getVisit",error);
		});
	}

	//****************************************************************
	//********************        END GET VISIT        ***************
	//****************************************************************

	//****************************************************************
	//********************          ADD VISIT        *****************
	//****************************************************************

	function addVisit(ajax_target,epsg,pol_id,coordinates,layer,callback){
		log("addVisit("+ajax_target+","+epsg+","+pol_id+","+coordinates+","+layer+")","info");
		var data2send 					= new FormData();
		data2send.append('epsg', 		epsg);
		data2send.append('token', 		token);
		data2send.append('what', 		"ADD_VISIT");
		data2send.append('element_id', 	pol_id);
		data2send.append('coordinates', coordinates);
		data2send.append('layer_id',	layer);

		$http.post(
					ajax_target,
					data2send,
					{
						transformRequest: angular.identity,
						headers: {'Content-Type': undefined
					}
				}).success(function (data) {
					log("addVisit() result:","success",data);
					if(data.status==="Accepted"){
						callback(null,data.message);
					}else{
						callback("Error requesting addVisit",data);
					}
				}).error(function (error) {
					log("error requesting addVisit","error",error);
					callback("Error requesting addVisit",error);
				});
	}

	//****************************************************************
	//********************        END ADD VISIT       ****************
	//****************************************************************

	//****************************************************************
	//******************         REMOVE VISIT        *****************
	//****************************************************************

	function removeVisit(ajax_target,visit_id,okCb,koCb){
		var data2send 					= new FormData();
		data2send.append('token', 		token);
		data2send.append('what', 		"REMOVE_VISIT");
		data2send.append('visit_id', 	visit_id);
		$http.post(
				ajax_target,
				data2send,
				{
					transformRequest: angular.identity,
					headers: {'Content-Type': undefined
				}
		}).success(function (data) {
			log("removeVisit() result:","success",data);
			if(data.status==="Accepted"){
				okCb();
			}else{
				koCb("Error requesting removeVisit",data);
			}
		}).error(function (error) {
			log("error requesting removeVisit","error",error);
			koCb("Error requesting removeVisit",error);
			});
		}

	//****************************************************************
	//******************     END REMOVE VISIT        *****************
	//****************************************************************

	//****************************************************************
	//********************       GET VISIT INFO       ****************
	//****************************************************************

	function getVisitInfo(ajax_target,visit_id,okCb,koCb){
		var data2send 					= new FormData();
		data2send.append('token', 		token);
		data2send.append('what', 		"GET_VISIT_INFO");
		data2send.append('visit_id', 	visit_id);

		$http.post(
			ajax_target,
			data2send,
			{
				transformRequest: angular.identity,
				headers: {'Content-Type': undefined
			}
		}).success(function (data) {
			log("getVisitInfo() result:","success",data);
			if(data.status==="Accepted"){
				okCb(data);
			}else{
				koCb("Error requesting getVisitInfo",data);
			}
		}).error(function (error) {
		 koCb("Error requesting getVisitInfo",error);
		});
	}

	//****************************************************************
	//********************       ADD VISIT INFO       ****************
	//****************************************************************

	function addVisitInfo(ajax_target,visit_id,heading,formData,images,compasses,photo,okCb,koCb){
		log("addVisitInfo("+ajax_target+","+visit_id+","+heading+","+formData+")","info");
		log("addVisitInfo images:","info",images);
		log("addVisitInfo compasses:","info",compasses);
		log("addVisitInfo photo:","info",photo);
		var data2send 								= new FormData();
		data2send.append('token', 		token);
		data2send.append('what', 			"ADD_VISIT_INFO");
		data2send.append('visit_id', 	 visit_id);
		data2send.append('compass',    heading);
		for (var prop in formData) {
			data2send.append(prop,      formData[prop]);
		}
		data2send.append('photos',      images);
		data2send.append('compasses',   compasses);
		if(photo){
			data2send.append('file', 				photo);
		}

		$http.post(
				ajax_target,
				data2send,
				{
					transformRequest: angular.identity,
					headers: {'Content-Type': undefined
				}
		}).success(function (data) {
			log("addVisitInfo() result:","success",data);
			if(data.status==="Accepted"){
				okCb();
			}else{
				koCb("Error requesting addVisitInfo",data);
			}
		}).error(function (error) {
			log("error requesting addVisitInfo","error",error);
			koCb("Error requesting addVisitInfo",error);
			});
	}
	//****************************************************************
	//********************       END VISIT INFO       ****************
	//****************************************************************

	//****************************************************************
	//******************         REMOVE EVENT        *****************
	//****************************************************************

	function removeEvent(ajax_target,visit_id,event_id,callback){
		var data2send 					= new FormData();
		data2send.append('token', 		token);
		data2send.append('what', 		"REMOVE_EVENT");
		data2send.append('visit_id', 		visit_id);
		data2send.append('event_id',    event_id);
		$http.post(
					ajax_target,
					data2send,
					{
						transformRequest: angular.identity,
						headers: {'Content-Type': undefined
					}
				}).success(function (data) {
					log("removeVisit() result:","success",data);
					if(data.status==="Accepted"){
						callback(null);
					}else{
						callback("Error requesting removeEvent",data);
					}
				}).error(function (error) {
					log("error requesting removeEvent","error",error);
					callback("Error requesting removeEvent",error);
				});
	}

	//****************************************************************
	//******************      END REMOVE EVENT        ****************
	//****************************************************************

	//****************************************************************
	//***********************      HELPERS      **********************
	//****************************************************************

	//log function
	function log(evt,level,data){
		$rootScope.$broadcast('logEvent',{evt:evt,extradata:data,file:filename+" v."+version,level:level});
	}

	//****************************************************************
	//***********************    END HELPERS    **********************
	//****************************************************************
}]);

})();
$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});
app.directive('selectMore', function($rootScope) {
	var state		= false,
		toolName	= "selectMore",
		elem 		= null;
	


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
		templateUrl: 	'../../tpl/directives_tpl/selectMore.htm',
		link: 			function(scope, _elem, attrs) {
							scope.tooltipselectMore	= attrs.tooltip;
							elem 	= _elem;
							elem.find("img").embedSVG();
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
		templateUrl: 	'../../tpl/directives_tpl/selectArea.htm',
		link: 			function(scope, _elem, attrs) {
							scope.selectArea	= attrs.tooltip;
							elem 	= _elem;
							elem.find("img").embedSVG();
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
		elem 		= null;

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
    		if(!$rootScope.addPointDisabled){
			    setState(false);
			}
		}
    });
    
    $rootScope.$on('define_geometryTypeInTools',  function(event,data){
		toolName 	= data.toolName;
    });
	return {
		restrict: 		'E',
		replace: 		'true',
		templateUrl: 	'../../tpl/directives_tpl/addPoint.htm',
		link: 			function(scope, _elem, attrs) {
							scope.tooltipaddPoint	= attrs.tooltip;
							elem 	= _elem;
							elem.find("img").embedSVG();
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
    		if(!$rootScope.addPopolygonDisabled){
    			setState(false);
			}
		}
    });
    $rootScope.$on('define_geometryTypeInTools',  function(event,data){
		toolName 	= data.toolName;
    });
	return {
		restrict: 		'E',
		replace: 		'true',
		templateUrl: 	'../../tpl/directives_tpl/addPolygon.htm',
		link: 			function(scope, _elem, attrs) {
							scope.tooltipaddPolygon	= attrs.tooltip;
							elem 	= _elem;
							elem.find("img").embedSVG();
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
    		if(!$rootScope.addLineDisabled){
			    setState(false);
			}
		}
    });
    //reset button 
	$rootScope.$on('define_geometryTypeInTools',  function(event,data){
		toolName 	= data.toolName;
    });
    
	return {
		restrict: 		'E',
		replace: 		'true',
		templateUrl: 	'../../tpl/directives_tpl/addLine.htm',
		link: 			function(scope, _elem, attrs) {
							scope.tooltipaddLine	= attrs.tooltip;
							elem 	= _elem;
							elem.find("img").embedSVG();
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
		//_template 	= '<button class="btn btn-default-custom tool-regla" ng-disabled="toolsDisabled" data-toggle="tooltip" data-placement="left" data-container="body" title="{{tooltipmeasure}}"></button>'

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
		templateUrl: 	'../../tpl/directives_tpl/mesure.htm',
		link: 			function(scope, _elem, attrs) {
							scope.tooltipmeasure	= attrs.tooltip;
					
							elem 	= _elem;
							elem.find("img").embedSVG();
							//elem.bind('click touchstart', function() {
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
		
	//var _template 	= '<button class="btn btn-default-custom tool-area" ng-disabled="toolsDisabled" data-toggle="tooltip" data-placement="left" data-container="body" title="{{tooltipmeasureArea}}"></button>'

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
		templateUrl: 	'../../tpl/directives_tpl/mesureArea.htm',
		link: 			function(scope, _elem, attrs) {
							scope.tooltipmeasureArea	= attrs.tooltip;
							elem 	= _elem;
							elem.find("img").embedSVG();
							elem.bind('click touchstart', function() {
							
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


app.directive('cleanScreen', function($rootScope) {
	var state		= false,
		toolName	= "delete",
		elem 		= null;



	return {
		restrict: 		'E',
		replace: 		'true',
		templateUrl: 	'../../tpl/directives_tpl/delete.htm',
		link: 			function(scope, _elem, attrs) {
							scope.tooltipclean	= attrs.tooltip;
							elem 	= _elem;
							elem.find("img").embedSVG();
							elem.bind('click', function() {
						
                            scope.mc.mapFactory.cleanGeometries('all')
														
				
							scope.$apply(function() {
								
							});
							//reset button 
							$rootScope.$on('reset-tools',  function(event,data){
								
            				});
						})
    	}
    }
});

app.directive('trackPosition', function($rootScope) {
	var state		= false,
		toolName	= "track",
		elem 		= null;



	return {
		restrict: 		'E',
		replace: 		'true',
		templateUrl: 	'../../tpl/directives_tpl/track.htm',
		link: 			function(scope, _elem, attrs) {
							scope.tooltipclean	= attrs.tooltip;
							elem 	= _elem;
							elem.find("img").embedSVG();
							elem.bind('click', function() {
						
							scope.mc.mapFactory.trackPosition()
				
							scope.$apply(function() {
								
							});
							//reset button 
							$rootScope.$on('reset-tools',  function(event,data){
								
            				});
						})
    	}
    }
});

app.directive('zoomExtent', function($rootScope) {
	var state		= false,
		toolName	= "extent",
		elem 		= null;



	return {
		restrict: 		'E',
		replace: 		'true',
		templateUrl: 	'../../tpl/directives_tpl/extend.htm',
		link: 			function(scope, _elem, attrs) {
							scope.tooltipclean	= attrs.tooltip;
							elem 	= _elem;
							elem.find("img").embedSVG();
							elem.bind('click', function() {
						
							scope.mc.mapFactory.zoomToExtend()
				
							scope.$apply(function() {
								
							});
							//reset button 
							$rootScope.$on('reset-tools',  function(event,data){
								
            				});
						})
    	}
    }
});






app.directive("featureAttribute",function($rootScope){
	var elem 			= null;

	var _template 	= '<div ng-show="datasource.name != \'geometry\' && datasource.name != \'foto_node_id\'" class="feature">';

		_template 		+= '<div class="fieldname">{{datasource.name}}: <span ng-show="showLabel && fieldValue!=\'NULL\'">{{fieldValue}}</div>';

		_template 		+= '<div class="actions" ng-show="canEdit && datasource.name!=\'id\' && datasource.name!=\'pol_id\' && datasource.name!=\'arc_id\' ">';
		_template 			+= '<button ng-click="edit()" ng-show="editBt" class="btn">Edit Button</button>';
		_template			+= '<div class="update-group" ng-show="showInput">';
		_template 				+= '<input type="text" ng-model="fieldValue">';
		_template				+= '<button ng-click="update()" class="btn btn-accent"><img src="img/ic/ic_feature-edit-save.svg" alt="Update" /></button>';
		_template 				+= '<button ng-click="cancelEdit()" class="btn btn-default-light"><img src="img/ic/ic_feature-edit-cancel.svg" alt="Cancel" /></button>';
		_template 			+= '</div>';
		_template 		+= '</div>';

		_template 	+= '</div>';


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

							if(scope.fieldName=="sae"){
							}
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

app.directive("featureAttributeBoolean",function($rootScope){
	var elem 			= null;
	//var _template 	= '<span><b>{{datasource.name}}:</b> {{datasource.value}}</span>E: {{editable}}<span ng-show="editable">EDITA</span></span>';

	var _template 	= '<span ng-show="datasource.name != \'geometry\' && datasource.name != \'foto_node_id\'">';
		_template 	+= '<span><span class="fieldname">{{datasource.name}}:</span> <span ng-show="showLabel && fieldValue!=\'NULL\'">{{fieldValue}}</span></span>';

		_template 	+= ' <span ng-show="canEdit && datasource.name!=\'id\' && datasource.name!=\'pol_id\' && datasource.name!=\'arc_id\' ">';
		_template 	+= ' <button ng-show="editBt" ng-click="edit()" class="btn btn-xs btn-primary-custom pull-right"><i class="fa fa-pencil"></i></button>';
		_template 	+= ' <button ng-show="actionBt" class="btn btn-xs btn-danger-custom pull-right"><i class="fa fa-times" ng-click="cancelEdit()"></i></button> <button ng-show="actionBt" class="btn btn-xs btn-success-custom pull-right"><i class="fa fa-check" ng-click="update()"></i></button> ';

		_template 	+= '<span ng-show="showInput" class="pull-right">';

		_template	+= '<select ng-model="fieldValue">';
			_template 	+= '<option value="" selected>Seleccionar</option>';
			_template 	+= '<option value="t" selected>Si</option>';
			_template 	+= '<option value="f">No</option>';
		_template 	+= '</select>';
		_template 	+= '</span>';

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

							if(scope.fieldName=="sae"){
							}
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
});
(function() {
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
			log("loggerService","init("+_env+")","log");
		}

		function log(emitter, msg,level,json){
			if(level=="info"){
				info(emitter,msg,json);
			}else	if(level==="warn"){
				warn(emitter,msg,json);
			}else	if(level==="error"){
				error(emitter,msg,json);
			}else if(level==="success"){
				success(emitter,msg,json);
			}else{
				if(env){
					if(json){
						console.log(emitter,"->",msg,json);
					}else{
						console.log(emitter,"->",msg);
					}
				}
			}
		}

		function warn(emitter, msg,json){
			if(env){
				if(typeof json!="undefined"){
					console.warn(emitter,"->",msg,json);
				}else{
					console.warn(emitter,"->",msg);
				}
			}
		}

		function info(emitter, msg,json){
			if(env){
				if(typeof json!="undefined"){
					console.info(emitter,"->",msg,json);
				}else{
					console.info(emitter,"->",msg);
				}
			}
		}

		function error(emitter, msg,json){
			if(env){
				if(typeof json!="undefined"){
					console.error(emitter,"->",msg,json);
				}else{
					console.error(emitter,"->",msg);
				}
			}
		}

		function success(emitter, msg,json){
			if(env){
				if(typeof json!="undefined"){
					console.log('%c'+emitter+": "+msg,'color: green;font-weight: bold;',json);
				}else{
					console.log('%c'+emitter+": "+msg,'color: green;font-weight: bold;');
				}
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
			var user_data				= {};
			user_data.roomName			= project_name;
			user_data.ws_token          = ws_token;
			user_data.project_id        = project_id;
			user_data.baseHref          = baseHref;
			socket.emit('user_connect', user_data);
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
(function (module) {
     
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