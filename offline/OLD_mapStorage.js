/* jshint esversion: 6 */
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
	var getUrl 							= window.location;
	var databaseName        = getUrl .protocol + "//" + getUrl.host + "/";
	var isInitialized       = false;
	var _fs									= null;
	var filename						= "mapStorage.js";
	// public API
/*	var dataFactory 		= {

								init: 							init,
								getItem:						getItem,
								setItem:						setItem,
								removeItem:					removeItem,
								getTile:						getTile,
								setTile: 						setTile,
								clearTiles:					clearTiles,
								removeTile:					removeTile,
								decompress: 							decompress,
								compress:   							compress,
								clearDatabase: 						clearDatabase,
								clearCacheStorage:				clearCacheStorage,
								localStorageSpace:				localStorageSpace,
								writeFileOnFileSystem: 		writeFileOnFileSystem,
								readFileFromFileSystem: 	readFileFromFileSystem,
								removeFileFromFileSystem: removeFileFromFileSystem,
								resetFileSystem:					resetFileSystem

							};
	return dataFactory;*/

	//****************************************************************
	//***********************         METHODS   **********************
	//****************************************************************
	//log function
	function log(evt,level,data){
	//	$rootScope.$broadcast('logEvent',{evt:evt,extradata:data,file:filename,level:level});
	}
	function init(storeName) {
			log("init("+storeName+")","info");
		//OJO cOJO OJO chequea si es movil
				if (!isInitialized && $window.localforage) {
						$window.localforage.config({
							name: databaseName,
							storeName: storeName,
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
						startFs(function(err,msg){
							if(err){
								return false
							}
							readFilesFromFileSystem(listResults);
						});


						//Request quota - It works????
						var requestedBytes = 1024*1024*1000; // 1GB
						navigator.webkitPersistentStorage.requestQuota (
							requestedBytes, function(grantedBytes) {
									log('we were granted '+grantedBytes+'bytes',"success");


							}, function(e) { 	log("Error grantig space file system","error",e); }
						);


						isInitialized = true;
				}
		};

	//******************** FILE SYSTEM ******************
	function errorHandler(e) {
		log("filesystem error","error",e)

	}

	function writeFileOnFileSystem(fileName,dataToSave,cb){
		log("writeFileOnFileSystem("+fileName+")","info",dataToSave);

		 //removeFileFromFileSystem(fileName)
		_fs.root.getFile(fileName, {create: true}, function(fileEntry) {

    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function(fileWriter) {

      fileWriter.onwriteend = function(e) {
				log("writeFileOnFileSystem - Write completed.","success");
        console.log('Write completed.');
				cb(null,"ok");
      };

      fileWriter.onerror = function(e) {
				log("writeFileOnFileSystem - error writing completed.","error",e.toString());
				cb(e.toString(),null);
      };

      // Create a new Blob and write it to log.txt.

			var blob = new Blob([dataToSave], {
						type: 'application/javascript'
					});
      fileWriter.write(blob);


    }, function(e){
			cb(e.toString(),null);
		});
	},  function(e){
		cb(e.toString(),null);
	});

}

function startFs(cb){
	//file System
	window.webkitRequestFileSystem(window.PERSISTENT, 1024*1024*1024 /*1GB*/, function(fs){
		log("Opened file system","info",fs);
		_fs = fs;
		cb(null,true);
	}, function(e) {
		log("Error opening file system","error",e);
		cb(e,false);
	});
}
function _doReadFile(fileName,cb){
	_fs.root.getFile(fileName, {}, function(fileEntry) {

			// Get a File object representing the file,
			// then use FileReader to read its contents.
			fileEntry.file(function(file) {
				 var reader = new FileReader();

				 reader.onloadend = function(e) {
					//console.log("mapStorage readFileFromFileSystem",this.result);
					var storedStyle = this.result;
					cb(null,storedStyle);
				 };

				 reader.readAsText(file);
			}, function(e){

				cb("Error reading file",null);
			});
	}, function(e){
		cb("file not found",null);
	});
}
function readFileFromFileSystem(fileName,cb){
	log("readFileFromFileSystem("+fileName+")","info");

	if(_fs===null){
		startFs(function(err,msg){
			if(err){
				cb("Error opening file system",null);
				return false;
			}
			_doReadFile(fileName,cb);
		});
	}else{
		_doReadFile(fileName,cb);
	}
}






function listResults(entries) {
	log("listResults()","info",entries);
  entries.forEach(function(entry, i) {
		//console.log("culo",entry)
  });
}



function readFilesFromFileSystem(cb) {
	log("readFilesFromFileSystem()","info");
  var dirReader = _fs.root.createReader();
  var entries = [];

  // Call the reader.readEntries() until no more results are returned.
  var readEntries = function() {
     dirReader.readEntries (function(results) {
			 if (!results.length) {
        cb(entries.sort());
      } else {
        entries = entries.concat(toArray(results));
        readEntries();
      }


    }, function(e){
			log("readFilesFromFileSystem() - error","error",e);
		});
  };

  readEntries(); // Start reading dirs.

}

//******************** FILE SYSTEM ******************




	function setItem(key, data) {
		if (localStorageSupport) {
			return $window.localStorage.setItem(key, data);
		}
	};

	function

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


	//****************************************************************
	//***********************    END  METHODS   **********************
	//****************************************************************

	//****************************************************************
	//***********************        HELPERS    **********************
	//****************************************************************



	//****************************************************************
	//***********************     END HELPERS    *********************
	//****************************************************************
