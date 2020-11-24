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

	- setInitEndDates
	    sets initial and end date for WMS/WFS quert
	    
	    @param initDate
	    @param endDate
	******************************************************************************************************	
	
	Available properties:
	
	- map (ol.Map object)
	- mapSelectTool (select tools module)
	
	******************************************************************************************************
*/

angular.module('app').factory('mapFactory', ['$http','$rootScope','mapMeasureTools','mapSelectTool','mapAddTool','mapOffline', function ($http,$rootScope,mapMeasureTools,mapSelectTool,mapAddTool,mapOffline) {

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
		version						= "1.0.3",
		viewProjection 				= null,
		viewResolution 				= null,
		useGeolocation				= null,
		geolocation					= null,		//geolocation object for tools
		max_features				= null,		//limit of features for queries
		ws_status					= 0,		//websocket connection status
		clickedCooordinates			= null,
		editing						= false,	//flag for knowing if is editing or not
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
		initDate                    = null,     //filter initial date for WMS/WFS
		endDate                     = null,     //filter end date for WMS/WFS
		capabilities;				//map capabilities
		
	// public API
	var dataFactory 				= {
					    				map: 					map, // ol.Map
					    				mapSelectTool:			mapSelectTool,
					    				epsg:					epsg,
										init: 					init,
										resize: 				resize,
										addLayer:				addLayer,
										removeLayer:            removeLayer,
										getMapData:				getMapData,
										setTool:				setTool,
										setActiveLayer: 		setActiveLayer,
										resetActiveLayer:		resetActiveLayer,
										getActiveLayer:			getActiveLayer,
										getActiveLayerName:		getActiveLayerName,
										reloadLayer:            reloadLayer,
										reloadDisplayedLayers:  reloadDisplayedLayers,
										getLayersDisplayed:		getLayersDisplayed,
										setBackGroundMap:		setBackGroundMap,
										setUseGeolocation:		setUseGeolocation,
										setMaxFeatures:			setMaxFeatures,
										setSocket:				setSocket,
										addSocketGeometry:		addSocketGeometry,
										featureDeleted:			featureDeleted,
										getLayerAttributes: 	getLayerAttributes,
										editGeometry:			editGeometry,
										endEditGeometry:		endEditGeometry,
										cleanGeometries:		cleanGeometries,
										resetAddTools:			resetAddTools,
										offlineConfigure: 		offlineConfigure,
										offlineStartDownload:	offlineStartDownload,
										getclickedCooordinates: getclickedCooordinates,
										setInitEndDates:        setInitEndDates
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
		
		mapOffline.init(urlWMS,touchDevice);
		
		//get Capabilities
		var parser 		= new ol.format.WMSCapabilities();
		log("GetCapabilities(): "+urlWMS+"?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities");
		$http({method: "GET", url: urlWMS+"?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities"})
			.success(function(data){ 			
				try{
					capabilities = parser.read(data);
                    if(document.getElementById("map")){
                        renderMap();
                    }else{
                        alert("No DOM element id='map' present!")  
                    }
					
				}catch(e){
					alert(project.project_name+" doesn't exists or is not responding in qgis_mapserv.fcgi or there's an error parsing xml");
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
            log("Using capabilities")
			epsg			= capabilities.Capability.Layer.BoundingBox[0].crs
			extent    		= capabilities.Capability.Layer.BoundingBox[0].extent;
		}else{
            log("Not using capabilities")
			epsg			= project.epsg;
			extent    		= project.extent;
		}

        log("Extension:",extent)        

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



        log("Map projection:",projection);


		//sets de view
		var view 			= new ol.View({
								projection: projection,
								extent: 	extent,
								center: 	[extent[0], extent[1]],
								zoom: 		zoom_level,
								minZoom:    9
							});	
		
		log("Map epsg:",epsg);
		log("Map zoom: "+zoom_level);

        //remove rotation interactions
        var interactions = ol.interaction.defaults({altShiftDragRotate:false, pinchRotate:false}); 
		//sets the map
		map 				= new ol.Map({
								target: 'map',
								layers: layers,
								interactions: interactions
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
		mapMeasureTools.init(map,epsg,viewProjection,vectorSource,vectorLayer,token,app_name,project.geom_colors,touchDevice);
		//select
		mapSelectTool.init(map,epsg,viewProjection,viewResolution,vectorSource,token,app_name,urlWMS,max_features,project.geom_colors,touchDevice);
		//add
		mapAddTool.init(map,epsg,viewProjection,viewResolution,vectorSource,token,app_name,urlWMS,project.geom_colors);
		
		//click event
		map.on('click', function(evt) {
			clickedCooordinates		= evt.coordinate;
			log("click coordinates: "+evt.coordinate);
			log("toolSelected: "+toolSelected)
			if(editing){
				endEditGeometry();
			}
			//if toolSelected adds point
			if(toolSelected==="point"){
				mapAddTool.addPoint(evt.coordinate);	
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
				mapSelectTool.selectPoint(clickedCooordinates,getMapData(),view.getResolution());
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
	        displayLayer(layer_name,false);
		}else{
    		removeLayer(layer_name);
		}
		$rootScope.$broadcast('legendEvent',{});
	}

    function removeLayer(layer_name){
        log("removeLayer("+layer_name+")");  
        var index = layers.indexOf(layer_name);
        map.removeLayer(layersVars[index]);
        layersVars.splice(layers.indexOf(layer_name), 1);
        layers.splice(layers.indexOf(layer_name), 1);  
        if(layers.indexOf(layer_name)===activeLayer){
            setActiveLayer(false);
        }    
    }
    
	//displays
	function displayLayer(layer_name,reload){
		log("displayLayer("+layer_name+","+reload+")");
		if(layers.indexOf(layer_name)>-1){
			if(reload){
				layersVars[layers.indexOf(layer_name)].getSource().updateParams({"time": Date.now()});
			}
		}else{
			var source 	= new ol.source.TileWMS({
				    					url: 	urlWMS,
				    					
				    					params: {
					    							'LAYERS': layer_name,
					    							'FILTER': layer_name+':\"startdate\"  > \''+initDate+'\'  AND \"startdate\" < \''+endDate+'\''
					    						}
		                    			});
		                    			
			var lay		= new ol.layer.Tile({
			    						extent: extent,
										name: layer_name,
										source: source
		    });     
		    map.addLayer(lay);
		    layersVars.push(lay);
		    layers.push(layer_name);
	    }	
	}
	
	function reloadLayer(layer_name){
    	log("reloadLayer("+layer_name+")");
    	removeLayer(layer_name);
    	displayLayer(layer_name);
	}
	
	function reloadDisplayedLayers(){
    	log("reloadDisplayedLayers()");
    	for(var i=0;i<layers.length;i++){
        	reloadLayer(layers[i]);
    	}
    	
	}
	
	function getLayerAttributes(layer){
		log("getLayerAttributes("+layer+")");
		try{
			var url		= urlWMS+"?SERVICE=WFS&VERSION=1.0.0&REQUEST=describeFeatureType&typename="+layer+"&initDate="+initDate+"&endDate="+endDate;
			log("url",url);
			$.get(url, function(response, status){
				var json = xml2json(response); 
				log("getLayerAttributes("+layer+")",json);
				var attributtes 	= json.schema.complexType.complexContent.extension.sequence.element;
				//if has photos
				var foto_node_id	= false;
				var retorn 			= Array();
				var idField			= null;
				for(var i=0; i<attributtes.length;i++){
					if(attributtes[i].name==="id" || attributtes[i].name==="arc_id" || attributtes[i].name==="pol_id" || attributtes[i].name==="node_id"){
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
			$rootScope.$broadcast('notifyActiveLayer',{'activeLayer':activeLayer,"activaLayerName":getActiveLayerName()});
		}
		mapSelectTool.clearHighlight();
	}
	
	function resetActiveLayer(){
		log("resetActiveLayer() "+ activeLayer);
		activeLayer	= null;
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
		log("getActiveLayerName: activeLayer: "+activeLayer+", name: "+layers[activeLayer]);
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
				            url: 'https://mt{0-3}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
							attributions: [
								new ol.Attribution({ html: '© Google' }),
								new ol.Attribution({ html: '<a href="https://developers.google.com/maps/terms">Terms of Use.</a>' })
							]
        				})
		}else if(map==="none"){
			var source = null;
		}else if(map==="topo" || map==="orto"){
			var source = new ol.source.TileWMS({url:'https://mapcache.icc.cat/map/bases/service?layers='+map+'&srs='+epsg});	
		}else if(map==="iccwmts"){
			var projection 		= ol.proj.get('EPSG:3857');
			var resolutions 	= new Array(18);
			var matrixIds 		= new Array(18);
			var projectionExtent = projection.getExtent();
			var size = ol.extent.getWidth(projectionExtent) / 256;
			for (var z = 0; z < 18; ++z) {
		  // generate resolutions and matrixIds arrays for this WMTS
		  resolutions[z] = size / Math.pow(2, z);
		  //matrixIds[z] = "EPSG:3857:" + z;
		  matrixIds[z] = z;
		}
			var source =	new ol.source.WMTS({
		                url: 'https://www.ign.es/wmts/pnoa-ma',
		                layer: 'OI.OrthoimageCoverage',
						matrixSet: 'EPSG:3857',
						format: 'image/png',
						projection: projection,
						tileGrid: new ol.tilegrid.WMTS({
							origin: ol.extent.getTopLeft(projectionExtent),
							resolutions: resolutions,
							matrixIds: matrixIds
						})
				})
		}


       /*var projection = ol.proj.get('EPSG:25831');
        projection.setExtent([257904,4484796,535907,4751795]);

        var extent = [257904,4484796,535907,4751795];
        var layers = [
                  new ol.layer.Tile({
                    extent: extent,
                    source: new ol.source.TileWMS({
                      url: 'http://mapcache.icc.cat/map/bases/service?',
                      params: {
                        'LAYERS': 'topo'
                      }
                    })
                  })
        ];*/

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
		if(typeof activeLayer!="undefined"){
			displayLayer(getActiveLayerName(activeLayer),true);
		}
		//after 5 seconds I remove the added geometry
		setTimeout(function(){
			vectorSource.removeFeature(iconFeature);
		}, 5000);
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
		var flashStyle 		= new ol.style.Style({
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
		log("editGeometry(), editing: "+editing);
		if(!editing){
			editing = true;
			mapAddTool.editGeometry(mapSelectTool.getSelectedFeauture());
		}
		
	}
	
	function endEditGeometry(){
		log("endEditGeometry()");
		mapAddTool.endEditGeometry();
		mapSelectTool.clearHighlight();
		editing	= false;
	}
	
	//****************************************************************
	//***********************  END EDIT GEOMETRY    ******************
    //****************************************************************  
	
	function featureDeleted(geometry){
		log("featureDeleted()",geometry);
		mapSelectTool.clearHighlight();
		if(typeof activeLayer!="undefined"){
			displayLayer(getActiveLayerName(activeLayer),true);
		}
	}
	
	//****************************************************************
	//***********************        TOOLS        ********************
    //****************************************************************

	//selects the tool for map edition
	function setTool(tool,option){	
		log("setTool("+tool+","+option+"), toolSelected: "+toolSelected);
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
			}else if(tool==="measureLine" || tool==="measureArea"){
				mapMeasureTools.initMeasure(option);	
				vectorLayer.setStyle(measureStyle);
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
	//******************           OFFLINE              **************
	//****************************************************************	
	
	function offlineConfigure(){
		log("offlineConfigure()");
		mapOffline.offlineConfigure(map);
	}
	
	function offlineStartDownload(){
		log("offlineStartDownload()");
		mapOffline.save(map,layersVars,layers);
	}
	//****************************************************************
	//******************          END OFFLINE           **************
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

    function getclickedCooordinates(){
        return clickedCooordinates;
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
	
    function setInitEndDates(_initDate,_endDate){
        log("setInitEndDates("+_initDate+","+_endDate+")");
        var day     = _initDate.getDate();
        var month   = ("0" + (_initDate.getMonth() + 1)).slice(-2);
        var year    = _initDate.getFullYear();    
        initDate    = year+"-"+month+"-"+day;
        var day     = _endDate.getDate();
        var month   = ("0" + (_endDate.getMonth() + 1)).slice(-2);
        var year    = _endDate.getFullYear();   
        endDate     = year+"-"+month+"-"+day;;     
    }
    
	function resetAddTools(){
		log("resetAddTools()");
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
										init: 				init,
										initMeasure:		initMeasure,
										endMeasure:			endMeasure,
										getMeasureCount:	getMeasureCount
									
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
			isMeasuring		= true;
			measuringMode 	= mode;
			measureCount	= 0;
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

	   // map.removeOverlay(measureTooltipElement);
	    map.removeOverlay(helpTooltipElement);
		sketch					= null;
		drawStartEvent			= null;
		drawEndEvent			= null;
	    isMeasuring 			= false;
	    draw					= null;
	    pointerMoveListener		= null; 
		if (measureTooltipElement) {
	    	//measureTooltipElement.parentNode.removeChild(measureTooltipElement);
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
		touchDevice             = 0,        //0 no touch device, 1 touch device (mobiler or tablet)
		sensibilityFactor       = 3,        //sensibility factor to increase tolerance on clic/touch
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

	function init(_map,_epsg,_viewProjection,_viewResolution,_vectorSource,_token,_app_name,_urlWMS,_max_features,_geom_colors,_touchDevice){	
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
		touchDevice     = _touchDevice;
		if(touchDevice!=0){
    		sensibilityFactor = 20;
		}
						
		log("init("+_map+","+_epsg+","+_token+","+_app_name+","+_geom_colors+","+_touchDevice+")");
		log("sensibilityFactor: "+sensibilityFactor);
		
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
    
	function selectPoint(coordinates,mapData,_viewResolution){
		log("selectPoint() multipleSelection: "+multipleSelection,coordinates+" resolution: "+_viewResolution);
		//update resolution on each click!
		viewResolution = _viewResolution;
		if(!multipleSelection){
			clearHighlight();
		}
		if(mapData.layersVars.length>0){
			$rootScope.$broadcast('featureInfoRequested',{});
			if(typeof mapData.layersVars[mapData.activeLayer]!="undefined"){
		        var selectableLayer = mapData.layersVars[mapData.activeLayer];
    			var url = selectableLayer.getSource().getGetFeatureInfoUrl(
    											coordinates, viewResolution*sensibilityFactor, viewProjection,
    											{'INFO_FORMAT': 'text/xml'}
    			);
            }else{
               var url = false; 
               $rootScope.$broadcast('displayMapError',{err: "Layer is not selectable"});
            }
			if (url) {
			   log("url",url);
			    var parser = new ol.format.GeoJSON();
			    $http.get(url).success(function(response){
				   // log("raw xml",response);
				    var json = xml2json(response); 
					log("xml2json",json); 
                    
				    //Broadcast event for data rendering
				    var returnData			= {}
					returnData.Attributes	= false;

				    if(typeof json.GetFeatureInfoResponse!== 'undefined' || json.GetFeatureInfoResponse!=""){
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
										src: 'img/marker.png'
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
(function() {
'use strict';
	angular.module('app').factory('mapOffline', ['$http','$rootScope','$window','mapStorage', function ($http,$rootScope,$window,mapStorage) {	
	var filename 			= "mapOffline.js",
    	touchDevice			= 0;
   
    var	extentKey 			= 'ga-offline-extent',
		layersKey 			= 'ga-offline-layers',
		opacityKey 			= 'ga-offline-layers-opacity',
		bgKey 				= 'ga-offline-layers-bg',
		promptKey 			= 'ga-offline-prompt-db',
		maxZoom 			= 8, // max zoom level cached
		minRes, 			// res for zoom 8
		extentFeature,
		vectorSource,		//source for extent selection 
		vectorLayer,       	//layer for extent selection
		proxyUrl			= null,
		isSelectorActive 	= false,
		isMenuActive 		= false,
		isExtentActive 		= false,
		defaultResolutions 	= [4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250,2000, 1750, 1500, 1250, 1000, 750, 650, 500, 250, 100, 50, 20, 10, 5,2.5, 2, 1.5, 1,0.5],
		wmsResolutions 		= defaultResolutions.concat([0.25, 0.1]),
		minRes				= defaultResolutions[maxZoom],
		pool				= 50,
		cursor,
		queue 				= [],
		projection 			= null,
		queue 				= [],
		layersIds 			= [],
		layersOpacity 		= [],
		layersBg 			= [];
		

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
		errorReport;

	// public API
	var dataFactory 		= {
								/*isCacheableLayer: 		isCacheableLayer,
								getCacheableLayers:		getCacheableLayers,
								onDlProgress:			onDlProgress,
								onTileError:			onTileError,
								onTileSuccess:			onTileSuccess,
								readResponse:			readResponse,*/
								init:					init,
								save:					save,
								abort:					abort,
								displayData:			displayData,
								StartSaving:			StartSaving,
								offlineConfigure:		offlineConfigure
												
						};
	return dataFactory;
	

    
    
    

   // var featureOverlay 	= gaMapUtils.getFeatureOverlay([extentFeature],

    
    
    //****************************************************************
	//***********************      METHODS     ***********************
	//****************************************************************
	
	function init(_proxyUrl,_touchDevice){
		log("init("+_proxyUrl+","+_touchDevice+")");
		proxyUrl	= _proxyUrl;
		touchDevice	= _touchDevice;
		
		// On mobile we simulate synchronous tile downloading, because when
		// saving multilayers and/or layers with big size tile, browser is
		// crashing (mem or cpu).
		// TODO: Try using webworkers?
		pool 		= touchDevice ? 1 : 50;
	}
   
	   
    //****************************************************************
	//***********************       SAVE       ***********************
	//****************************************************************
   
   function offlineConfigure(map){
		log("offlineConfigure()");
		var displayedExtent 	= map.getView().calculateExtent(map.getSize());
		//check size, if is too big create an extent of 5km2
		if(displayedExtent[2]-displayedExtent[0]>10000 || displayedExtent[3]-displayedExtent[1]>10000){
			var center 			= map.getView().getCenter();
			var extentToSave	= ol.extent.buffer(center.concat(center), 5000);
		}else{
			var extentToSave	= displayedExtent;
		}
		
        var topLeft 		= [extentToSave[0],extentToSave[3]];
        var topRight 		= [extentToSave[0],extentToSave[1]];
        var bottomRight 	= [extentToSave[2],extentToSave[1]];
        var bottomLeft 		= [extentToSave[2],extentToSave[3]];
	    vectorSource		= new ol.source.Vector({});
		vectorLayer 		= new ol.layer.Vector({
								source: vectorSource,
								zIndex : 999
							});
		map.addLayer(vectorLayer);
		var extentStyle		    = new ol.style.Style({
                                           stroke: new ol.style.Style({
                                               color: '#FF8C00',
                                               width: 20
                                           }),
                                           fill: new ol.style.Fill({
													color: '#333333'
											})
                                       });
		var extentFeature	= new ol.Feature(
								{
									geometry: new ol.geom.Polygon([[topLeft, topRight, bottomRight, bottomLeft]]),
									style: extentStyle
								});
		vectorSource.addFeature(extentFeature);	
	}

   
	function save(map,layersVars,layers) {
		log("Save() map: ",map);
		log("Save() layersVars: ",layersVars);
		log("Save() layers: ",layers);
		// Get the cacheable layers
	
		var layers = getCacheableLayers(map.getLayers().getArray(), true);
		if (layers.length == 0) {
        	alert('offline_no_cacheable_layers');
			return;
    	}

		if (!confirm('offline_save_warning')) {
            return;
		}

		initDownloadStatus();
		//OJO - revisado
		mapStorage.removeItem(extentKey);

		if (isExtentActive) {
        	hideExtent(map);
		}
		
		// Store the extent saved
		extent = calculateExtentToSave(map.getView().getCenter());

		// We go through all the cacheable layers.
		projection 		= map.getView().getProjection();
		queue 			= [];
		layersIds 		= [];
		layersOpacity 	= [];
		layersBg 		= [];
		log("save()-> layers: ",layers);
		for (var i = 0, ii = layers.length; i < ii; i++) {
	
        	var layer = layers[i];
			layersIds.push(layer.id);
			layersOpacity.push(layer.invertedOpacity);

			// if the layer is a KML
			//OJO
			if (isKmlLayer(layer) && '/^https?:\/\//.test(layer.url)') {
					
				$http.get(proxyUrl + encodeURIComponent(layer.url))
				.success(function(data) {
				//OJO
					gaStorage.setItem(layer.id, data);
            	});
				layersBg.push(false);
				continue;
        	}

			// if it's a tiled layer (WMTS or WMS) prepare the list of tiles to
			// download
			var parentLayerId 	= getLayerProperty(layer.bodId,'parentLayerId');
			//OJO
			var isBgLayer 		= (parentLayerId) ? getMapLayerForBodId(map, parentLayerId).background : layer.background;
			layersBg.push(isBgLayer);
						var source 			= layer.getSource();
				
			
			var tileGrid 		= source.getTileGrid();
			var tileUrlFunction = source.getTileUrlFunction();
			
			

		}
		
        // For each zoom level we generate the list of tiles to download:
        //   - bg layer: zoom 0 to 3 => swiss extent
        //               zoom 4 to 8 => 15km2 extent
        //   - other layers: zoom 4,6,8 => 15km2 extent
        

		for (var zoom = 0; zoom <= maxZoom; zoom++) {
		
			var z = zoom + 9; // data zoom level
			if (!isCacheableLayer(layer, z)) {
				debugger
				continue;
			}
			
			//AQUI PETA POR EL TILEGRID

			var tileExtent 		= extent;
			//AQUI PETA algo he leido de WMTS
			var tileRange 		= tileGrid.getTileRangeForExtentAndZ(tileExtent, z);

			/*var centerTileCoord = [
										z,
										(tileRange.getMinX() + tileRange.getMaxX()) / 2,
										(tileRange.getMinY() + tileRange.getMaxY()) / 2
									];*/
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
		nbTilesTotal 	= queue.length;
			
		startTime 		= (new Date()).getTime();
		cursor 			= 0;
		runNextRequests();			
    }
    
    
    function runNextRequests() {
		log("runNextRequests()");
		
    	var requestsLoaded = 0;
		for (var j = cursor, jj = cursor + pool; j < jj && j < nbTilesTotal; j++) {
			if (isStorageFull) {
				break;
    		}
			
			var tile 		= queue[j];
			var tileUrl 	= transformIfAgnostic(tile.url);
			var xhr 		= new XMLHttpRequest();
			xhr.tileUrl 	= tile.url;
			xhr.open('GET', tileUrl, true);
			xhr.responseType = 'arraybuffer';
			xhr.onload = function(e) {
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
			var max 		= layer.getMaxResolution() || resolutions[0];
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
                $timeout(runNextRequests, 5000);
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
		//OJO
		gaStorage.clearTiles(function(err) {
            if (err) {
	            //OJO
				alert($translate.instant('offline_clear_db_error'));
			} else {
				initDownloadStatus();

	            // Remove specific property of layers (currently only KML layers)
	            //OJO
	            var layersId = gaStorage.getItem(layersKey).split(',');
	            for (var j = 0, jj = layersId.length; j < jj; j++) {
		            //OJO
	            	gaStorage.removeItem(layersId[j]);
	            }

				//OJO
				gaStorage.removeItem(extentKey);
        	    gaStorage.removeItem(layersKey);
    	        gaStorage.removeItem(opacityKey);
				gaStorage.removeItem(bgKey);
            	$rootScope.$broadcast('gaOfflineAbort');
        	}
        });
    };

 
 	//****************************************************************
	//***********************      END ABORT    **********************
	//****************************************************************

	
	//****************************************************************
	//***********************     DISPLAY       **********************
	//****************************************************************
	
	function displayData(map) {
        // Zoom on extent saved
        //OJO
        var extent = gaStorage.getItem(extentKey);
		if (extent) {
        	extent = extent.split(',');
			map.getView().fit([
				parseInt(extent[0], 10),
				parseInt(extent[1], 10),
				parseInt(extent[2], 10),
				parseInt(extent[3], 10)
			], map.getSize());
    	}
    	//OJO
		var layersIds 	= gaStorage.getItem(layersKey).split(',');
		var opacity 	= gaStorage.getItem(opacityKey).split(',');
		var bg 			= gaStorage.getItem(bgKey).split(',');

		for (var i = 0, ii = layersIds.length; i < ii; i++) {
			//OJO
        	var bodLayer = gaLayers.getLayer(layersIds[i]);
			if (bodLayer) {
				var bodId = bodLayer.parentLayerId || layersIds[i];
				//OJO
				var olLayer = gaMapUtils.getMapLayerForBodId(map, bodId);
				if (!olLayer) {
					//OJO
					olLayer = gaLayers.getOlLayerById(bodId);
					if (olLayer) {
						olLayer.background = (bg[i] === 'true');
						if (olLayer.background) {
							gaBackground.setById(map, bodId);
						} else {
							map.addLayer(olLayer);
						}
            		} else {
						// TODO: The layer doesn't exist
						continue;
            		}
            	}
				if (olLayer) {
					olLayer.visible 		= true;
					olLayer.invertedOpacity = opacity[i];
				}
        	}
    	}
    };
	
	//****************************************************************
	//*********************       END DISPLAY   **********************
	//****************************************************************
    	
	//****************************************************************
	//*********************         EXTENT      **********************
	//****************************************************************
	function showExtent(map) {
        //OJO
        var extent 			= gaStorage.getItem(extentKey);
		if (extent) {
			extent = extent.split(',');
			extentFeature.getGeometry().setCoordinates([[
				[extent[0], extent[1]],
				[extent[0], extent[3]],
				[extent[2], extent[3]],
				[extent[2], extent[1]]
			]]);
			featureOverlay.setMap(map);
			isExtentActive = true;
		}
    };
	
	function hideExtent() {
      featureOverlay.setMap(null);
      isExtentActive 		= false;
    };
	
	function toggleExtent(map) {
        if (isExtentActive) {
        	hideExtent();
        } else {
        	showExtent(map);
        }
    };
	
	//****************************************************************
	//*********************       END EXTENT      ********************
	//****************************************************************

    function StartSaving(proxyUrl) {
 
		// We store layers informations.
		//OJO - revisado
		mapStorage.setItem(layersKey, layersIds.join(','));
		mapStorage.setItem(opacityKey, layersOpacity.join(','));
		mapStorage.setItem(bgKey, layersBg.join(','));

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
					$timeout(runNextRequests, 5000);
            	} else {
                	runNextRequests();
            	}
        	}
        };



		/*
		var that = this;
		// ios: the prompt to increase the size of the db block all the ui.
		// When the prompt happens it's the first time we use the db so it'
		// empty so no need to clear the tiles.
		if (!gaBrowserSniffer.ios || gaStorage.getItem(promptKey)) {
        	// We ensure the db is empty before saving tiles
        	//OJO - revisado
			mapStorage.clearTiles(function(err) {
				if (err) {
	                that.abort();
				} else {
                	runNextRequests();
        		}
        	});
    	} else {
        	//OJO - revisado
        	mapStorage.setItem(promptKey, true);
			runNextRequests();
		}*/
    };







    // If there is data in db we can initialize the store
    if (hasData()) {
    	//OJO - revisado
    	mapStorage.init();
    }
    

	//return new Offline(gaGlobalOptions.ogcproxyUrl);

    //***************************************************************
	//***********************    END  METHODS   **********************
	//**************************************************************** 

	//****************************************************************
	//***********************   	HELPERS    **********************
    //****************************************************************
   
    function hasData(map) {
	    //OJO - revisado
	   return !!(mapStorage.getItem(extentKey));
    };
  
	function calculateExtentToSave(center) {
	    return ol.extent.buffer(center.concat(center), 5000);
    };
   
	// Download status
    function isDownloading() {
        return isDownloading;
    };

    // Offline selector stuff
	function isSelectorActive() {
        return isSelectorActive;
    };
	
	function showSelector() {
        isSelectorActive 	= true;
    };
	
	function hideSelector() {
        isSelectorActive 	= false;
    };
    
	function toggleSelector() {
        isSelectorActive 	= !isSelectorActive;
    };

    // Offline menu stuff
	function isMenuActive() {
    	return isMenuActive;
    };
	
	function showMenu() {
    	isMenuActive 		= true;
    };
	
	function hideMenu() {
        isMenuActive 		= false;
    };
    
	function toggleMenu() {
      isMenuActive 			= !isMenuActive;
    };
    
	// Extent saved stuff
	function isExtentActive() { 
	    return isExtentActive;
    };
    
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
    
	function refreshLayers(layers, useClientZoom, force) {
        //OJO - revisado
        var layersIds = mapStorage.getItem(layersKey);
        for (var i = 0, ii = layers.length; i < ii; i++) {
        	var layer = layers[i];
        	//OJO
			if (gaMapUtils.isKmlLayer(layer)) {
				continue;
			}
			if (layer instanceof ol.layer.Group) {
				var hasCachedLayer = false;
				layer.getLayers().forEach(function(item) {
					if (!hasCachedLayer && layersIds && layersIds.indexOf(item.id) != -1) {
                		hasCachedLayer = true;
                	}
				});
				this.refreshLayers(layer.getLayers().getArray(), useClientZoom, force || hasCachedLayer);
			} else if (force || (layersIds && layersIds.indexOf(layer.id) != -1)) {
				var source = layer.getSource();
				// Clear the internal tile cache of ol
				// TODO: Ideally we should flush the cache for the tile range
				// cached
				source.setTileLoadFunction(source.getTileLoadFunction());

				// Defined a new min resolution to allow client zoom on layer with
				// a min resolution between the max zoom level and the max client
				// zoom level
				//OJO
				var origMinRes = gaLayers.getLayer(layer.id).minResolution;
				if (!useClientZoom && origMinRes) {
					layer.setMinResolution(origMinRes);
				} else if (useClientZoom && minRes >= origMinRes) {
					layer.setMinResolution(0);
				}
				// Allow client zoom on all layer when offline
				layer.setUseInterimTilesOnError(useClientZoom);
				//OJO
				layer.setPreload(useClientZoom ? gaMapUtils.preload : 0);
        	}
        }
    };
    
          
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
					$rootScope.$broadcast('gaOfflineError');
					$window.alert($translate.instant('offline_less_than_95'));

				} else { // Download succeed
					//OJO - revisado
					mapStorage.setItem(extentKey, extent);
					
					$rootScope.$broadcast('gaOfflineSuccess', progress);
					
					$window.alert($translate.instant('offline_dl_succeed'));
            	}
            }
        }
    };
    
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
    };
    
    
    // Read xhr response
    function readResponse(tileUrl, response, type) {
	    console.log("readResponse")
        if (isStorageFull) {
          return;
        }
        //OJO - revisado
        var blob = arrayBufferToBlob(response, type);
        // FileReader is strictly used to transform a blob to a base64 string
        var fileReader = new FileReader();
        fileReader.onload = function(evt) {
	        //OJO - revisado
	        mapStorage.setTile(getTileKey(tileUrl), evt.target.result, function(err, content) {
		        console.log("pedo")
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
    
	function getLayerProperty(id, propertyName) {
        if (propertyName === 'label') {
            switch(id) {
                case 'ch.swisstopo.swissimage':
                  return 'bg_luftbild';
                case 'ch.swisstopo.pixelkarte-farbe':
                  return 'bg_pixel_color';
                case 'ch.swisstopo.pixelkarte-grau':
                  return 'bg_pixel_grey';
            }
        }
    }
      
      
    /**
     * Search for a layer identified by bodId in the map and
     * return it. undefined is returned if the map does not have
     * such a layer.
     */
	function getMapLayerForBodId(map, bodId) {
		var layer;
		map.getLayers().forEach(function(l) {
			if (l.bodId == bodId && !l.preview) {
				layer = l;
        	}
        });
        return layer;
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
	    nbTilesEmpty 	= 0;
	    nbTilesFailed 	= 0;
	    nbTilesTotal 	= 0;
	    requests 		= [];
	    sizeCached 		= 0;
	    errorReport 	= '';
    };
    
    //log function
	function log(evt,data){
		$rootScope.$broadcast('logEvent',{evt:evt,extradata:data,file:filename});
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
    var getMagnitude = function(a, origin) {
      return Math.sqrt(
          Math.pow(a[1] + 0.5 - origin[1], 2) +
          Math.pow(a[2] + 0.5 - origin[2], 2) +
          Math.pow(a[0] - origin[0], 2));
    };
    
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
	function transformIfAgnostic(url) {
	          if (/^\/\//.test(url)) {
	            url = location.protocol + url;
	          }
	          return url;
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
			console.log("ol.tilecoord.createOrUpdate",z, x, y, opt_tileCoord)
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
			console.log(extent, resolution, opt_tileRange)
		  var tileCoord = ol.tilegrid.TileGrid.tmpTileCoord_;
		  console.log(tileCoord)
		  
		  this.getTileCoordForXYAndResolution_(extent[0], extent[1], resolution, false, tileCoord);
		  var minX = tileCoord[1];
		  var minY = tileCoord[2];
		   console.log(tileCoord)
		  this.getTileCoordForXYAndResolution_(extent[2], extent[3], resolution, true, tileCoord);
		  return ol.TileRange.createOrUpdate(minX, tileCoord[1], minY, tileCoord[2], opt_tileRange);
		};
		ol.tilegrid.TileGrid.prototype.getTileCoordForXYAndResolution_ = function(x, y, resolution, reverseIntersectionPolicy, opt_tileCoord) {
			console.log("getTileCoordForXYAndResolution_",x, y, resolution, reverseIntersectionPolicy, opt_tileCoord)
		  var z = this.getZForResolution(resolution);
		  var scale = resolution / this.getResolution(z);
		  var origin = this.getOrigin(z);
		  var tileSize = this.getTileSize(z);
		console.log("concha tu madre",scale,origin,tileSize)

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
	var isInitialized = false;
	// public API
	var dataFactory 		= {
						
								init: 		init,
								getItem:	getItem,
								setItem:	setItem,
								removeItem:	removeItem,
								getTile:	getTile,
								setTile: 	setTile,
								clearTiles:	clearTiles
												
							};
	return dataFactory;

	//****************************************************************
	//***********************         METHODS   **********************
	//**************************************************************** 





	function init() {
		//OJO cOJO OJO chequea si es movil
        if (!isInitialized && $window.localforage) {
            $window.localforage.config({
              name: 'map.geo.admin.ch',
              storeName: 'ga',
              size: 50 * 1024 * 1024, // Only use by webSQL
              //version: (gaBrowserSniffer.msie) ? 1 : '1.0',
              version: '1.0',
              description: 'Storage for map.geo.admin.ch'
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
        this.init();
        console.log(key, dataURI, callback)
		$window.localforage.setItem(key, compress(dataURI), callback);
    };
	
	function clearTiles(callback) {
        this.init();
        $window.localforage.clear(callback);
    };
    
    
    

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
 
    //****************************************************************
	//***********************     END HELPERS    *********************
	//****************************************************************      

 
     
  }]);
  
})();(function() {
'use strict';
/**
 * Factory for map TOC
 
 Author: Leandro Lopez-Guerrero Hirsch
 @Leo_lopezg
 
 May 2016 
*/

angular.module('app').factory('mapToc', ['$http','$rootScope','mapFactory', function ($http,$rootScope,mapFactory) {

	
	var filename 				= "mapToc.js",
		app_name				= null,
		mc						= null,
		use_layer_auth			= false,
		user_permissions		= null,
		token					= null;

	// public API
	var dataFactory 				= {
										init: 				init,
										formatLayers:		formatLayers,
										setActiveLayer:		setActiveLayer,
										userCanSeeLayer:	userCanSeeLayer,
										addRemoveLayer:		addRemoveLayer,
										userCanEditLayer:	userCanEditLayer,
										addRemoveContainer: addRemoveContainer,
										markActiveLayer:    markActiveLayer
										
									
						};
	return dataFactory;

	//****************************************************************
	//***********************       INIT       ***********************
    //****************************************************************

	function init(_token,_app_name,_mc,_use_layer_auth,_user_permissions){	
		token					= _token;
		app_name				= _app_name;
		mc 						= _mc;
		use_layer_auth			= _use_layer_auth;
		user_permissions		= _user_permissions;
		log("init()");
	}
	
	//****************************************************************
	//***********************      END INIT    ***********************
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
					$rootScope.$broadcast('legendEvent',{});
				}
			}else{
    			$rootScope.$broadcast('legendEvent',{});
			}
		}else{
			item.isSelected 	= false;
		}
		mapFactory.addLayer(item.Name);
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
    
    function removeLayer(layer_name){
        log("removeLayer("+layer_name+")");
        mapFactory.removeLayer(layer_name);
        selectNextAvailableActiveLayer();
    }
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
                                    //mc.layers[i].Layer[s].Layer[t].isActiveLayer = false;
                                    mc.layers[i].Layer[s].Layer[t].isSelected = active;
                                    removeLayer(mc.layers[i].Layer[s].Layer[t].Name);
                                }else{
                                    if(active){
                    				    addRemoveLayer(mc.layers[i].Layer[s].Layer[t],null);
                    				}
                                }
    						}				
    					}
					}
				}				
			}
		}   
    }
    
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
					mapFactory.addLayer(item.Name);	
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
				$rootScope.$broadcast('legendEvent',{});
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

    
	function markActiveLayer(name){
		log("markActiveLayer("+name+")");

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
	
    function userCanEditLayer(layer){
		log("userCanEditLayer("+layer+")");
		$rootScope.addPointDisabled			= true;
		$rootScope.addLineDisabled			= true;
		$rootScope.addPopolygonDisabled		= true;
		if(use_layer_auth){
			for (var i=0;i<user_permissions.length;i++){
				if(user_permissions[i].qgis_name===layer && user_permissions[i].edit===1){
					if(user_permissions[i].geometry==="Point"){
						$rootScope.addPointDisabled	= false;
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
	
	function formatLayers(rawlayers){
		log("formatLayers()",rawlayers);
		//first Level
		for (var i=0;i<rawlayers.length;i++){
			rawlayers[i].isContainer = false;
			rawlayers[i].isActiveLayer = false;
			//second level
			if (typeof rawlayers[i].Layer != 'undefined'){
				rawlayers[i].isContainer = true;
				for (var s=0;s<rawlayers[i].Layer.length;s++){
					rawlayers[i].Layer[s].isContainer = false;
					rawlayers[i].Layer[s].isActiveLayer = false;
					
					//third level
					if (typeof rawlayers[i].Layer[s].Layer != 'undefined'){
						rawlayers[i].Layer[s].isContainer = true;
						rawlayers[i].Layer[s].isActiveLayer = false;

						for (var t=0;t<rawlayers[i].Layer[s].Layer.length;t++){
							//fourth level
							rawlayers[i].Layer[s].Layer[t].isContainer = false;
							rawlayers[i].Layer[s].Layer[t].isActiveLayer = false;
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

	function selectNextAvailableActiveLayer(){
		log("selectNextAvailableActiveLayer()");
		resetActiveLayer();
		var layerDisplayed		= false;
		var layers_displayed = mapFactory.getLayersDisplayed();
		//find first available layer for select
		for (var i=0;i<layers_displayed.length;i++){
			if(!layerIsContainer(layers_displayed[i])){
				markActiveLayer(layers_displayed[i]);
				$rootScope.$broadcast('legendEvent',{});
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
			selectNextAvailableALegend();			
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
		templateUrl: 	'../../tpl/default/directives_tpl/selectMore.htm',
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
		templateUrl: 	'../../tpl/default/directives_tpl/selectArea.htm',
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
		templateUrl: 	'../../tpl/default/directives_tpl/addPoint.htm',
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
			setState(false);
		}
    });
    $rootScope.$on('define_geometryTypeInTools',  function(event,data){
		toolName 	= data.toolName;
    });
	return {
		restrict: 		'E',
		replace: 		'true',
		templateUrl: 	'../../tpl/default/directives_tpl/addPolygon.htm',
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
			setState(false);
		}
    });
    //reset button 
	$rootScope.$on('define_geometryTypeInTools',  function(event,data){
		toolName 	= data.toolName;
    });
    
	return {
		restrict: 		'E',
		replace: 		'true',
		templateUrl: 	'../../tpl/default/directives_tpl/addLine.htm',
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
		templateUrl: 	'../../tpl/default/directives_tpl/mesure.htm',
		link: 			function(scope, _elem, attrs) {
							scope.tooltipmeasure	= attrs.tooltip;
					
							elem 	= _elem;
							elem.find("img").embedSVG();
							elem.bind('click touchstart', function() {
							
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
		templateUrl: 	'../../tpl/default/directives_tpl/mesureArea.htm',
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
		templateUrl: 	'../../tpl/default/directives_tpl/delete.htm',
		link: 			function(scope, _elem, attrs) {
							scope.tooltipmeasureArea	= attrs.tooltip;
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






app.directive("featureAttribute",function($rootScope){
	var elem 			= null;
	
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
		env				= _env;	
		token			= _token;
		urlSocket		= _urlSocket;
		app_name		= _app_name;
		project_name	= _project_name;
		project_id      = _project_id;
		ws_token        = _ws_token;
		baseHref        = _baseHref;
		
		log("init("+_env+","+_token+","+_app_name+","+_urlSocket+","+_project_id+","+_ws_token+","+_baseHref+")");
		socket = io(urlSocket,{secure:true,reconnection:true});
		
		socket.on('connect', function () {
			log("Socket succesfully connected");
			var user_data				= {};
			user_data.roomName			= project_name;
			user_data.ws_token          = ws_token;
			user_data.project_id        = project_id;
			user_data.baseHref          = baseHref;
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
        socket.on('connection_rejected', function (data) {
			log("Socket connection_rejected",data);
		});	
		
		socket.on('new_geometry', function (data) {
			log("Socket new_geometry",data);
			try{
//				var payload 	= data.payload.split(";");
				var payload 	= data;
				$rootScope.$broadcast('socket_new_geometry',{id:parseInt(payload.id),geom:payload.geom,epsg:"EPSG:"+payload.epsg,layer:payload.layer});
			}catch(err) {
				log("Socket new_geometry error parsing: "+err);
			}
		});	
		socket.on('externalEvent', function (data) {
			log("External event",data);
			$rootScope.$broadcast('externalEvent',{msg:data.msg,value:data.value});	
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