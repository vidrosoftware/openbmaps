(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _richLogger = _interopRequireDefault(require("../src/richLogger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _self = null,
    _version = '1.0.0',
    _events = null,
    _logger = null;

var FormUtils =
/*#__PURE__*/
function () {
  function FormUtils(options, events, logger) {
    _classCallCheck(this, FormUtils);

    if (typeof options === 'undefined') {
      throw new TypeError('no data');
    }

    if (typeof options.baseHref === 'undefined') {
      throw new TypeError('no options baseHref');
    }

    if (typeof events === 'undefined') {
      throw new TypeError('no events');
    }

    _events = events;

    if (typeof logger === 'undefined') {
      throw new TypeError('no logger');
    }

    _logger = logger;
    _self = this;
    _self._fileName = 'form_utils.js';
    _self.options = options;

    _logger.info(_self._fileName, "Module loaded v.".concat(_version), options);
  }
  /*
    formatPhotoData
      used in visits v.2, creates json for api insertion
     @param fileName
    @param photo_id
    @param visit_id
    @param deviceTrace
     @return JSON
   */


  _createClass(FormUtils, [{
    key: "formatPhotoData",
    value: function formatPhotoData(fileName, photo_id, visit_id, deviceTrace) {
      _logger.info(_self._fileName, 'formatPhotoData()', {
        'fileName': fileName,
        'photo_id': photo_id,
        'visit_id': visit_id,
        'deviceTrace': deviceTrace
      });

      var processedName = fileName.split('\\').pop();
      var idval = processedName.replace(/^.*[\\\/]/, '');
      idval = idval.split('.');
      var fextension = processedName.substr(processedName.lastIndexOf('.') + 1);
      var link = "".concat(_self.options.baseHref, "external.image.php?img=").concat(photo_id);
      /*if(fextension!="jpg" && fextension!="png"){
        link = 	`${_self.options.baseHref}external.doc.php?img=${photo_id}&extension=${fextension}&name=${idval}`;
      }
       return {"newFile":{
                          "fileFields":{
                                "visit_id":visit_id, "hash":photo_id,
                                "url":link,
                                "fextension":fextension,
                                "idval": idval[0]
                              },
                            deviceTrace
                          }
                    };*/

      return {
        'photo_url': "".concat(_self.options.baseHref, "external.image.php?img="),
        'hash': photo_id
      };
    }
  }]);

  return FormUtils;
}();

exports["default"] = FormUtils;

},{"../src/richLogger":61}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _events2 = require("events");

var _axios = _interopRequireDefault(require("axios"));

var _visits_offline = _interopRequireDefault(require("../offline/visits_offline"));

var _offline2 = _interopRequireDefault(require("../offline/offline"));

var _richLogger = _interopRequireDefault(require("../src/richLogger"));

var _package = require("./package");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var _self = null,
    _events = null,
    _options = null,
    _logger = null;
var _offline = null;

var Home =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(Home, _EventEmitter);

  function Home(options) {
    var _this;

    _classCallCheck(this, Home);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Home).call(this));

    if (typeof options === 'undefined') {
      throw new TypeError('no data');
    }

    if (typeof options.baseHref === 'undefined') {
      throw new TypeError('no options baseHref');
    }

    if (typeof options.user_id === 'undefined') {
      throw new TypeError('no options user_id');
    }

    if (typeof options.useOffline === 'undefined') {
      options.useOffline = 0;
    }

    if (typeof options.env === 'undefined') {
      options.env = 'prod';
    }

    _self = _assertThisInitialized(_this);
    _events = _events2.EventEmitter;
    _self._fileName = 'home.js';
    _options = options;
    _logger = new _richLogger["default"](options.env, {});
    _offline = new _offline2["default"](options, _self);
    options.visited_spots_layer = 0; //no visited spots layer!!

    _logger.info(_self._fileName, "Module loaded v.".concat(_package.version), options);

    return _this;
  }

  _createClass(Home, [{
    key: "loadUserProjects",
    value: function loadUserProjects() {
      return new Promise(function (resolve, reject) {
        var dataToSend = {};
        dataToSend.what = 'GET_USER_PROJECTS';
        dataToSend.token = _options.token;

        if (navigator.onLine) {
          _logger.info(_self._fileName, 'try ONLINE loadUserProjects');

          _axios["default"].post("".concat(_options.baseHref, "/ajax.home.php"), dataToSend).then(function (response) {
            _logger.success(_self._fileName, 'loadUserProjects', response.data);

            var projects = _self._processUserProjects(response.data.message);

            resolve({
              'status': response.data.status,
              'message': projects
            });

            if (response.data.status === 'Accepted' && _options.useOffline === 1) {
              //store projects for offline use
              try {
                _offline.setStoredProjects(_options.user_id, JSON.stringify(response.data.message));
              } catch (er) {
                _logger.error(_self._fileName, 'loadUserProjects error storing user projects', er);
              }
            }
          })["catch"](function (error) {
            _logger.error(_self._fileName, 'loadUserProjects', error);

            reject({
              'status': 'Failed',
              'message': error
            });
          });
        } else {
          var offlinePro = _offline.getStoredProjects(_options.user_id);

          _logger.info(_self._fileName, 'try OFFLINE loadUserProjects', "user_projects_".concat(_options.user_id), offlinePro);

          if (offlinePro) {
            resolve({
              'status': 'Accepted',
              'message': JSON.parse(offlinePro)
            });
          } else {
            reject({
              'status': 'Failed',
              'message': {
                'msg': 'No stored projects'
              }
            });
          }
        }
      });
    }
  }, {
    key: "_processUserProjects",
    value: function _processUserProjects(projects) {
      for (var i = 0; i < projects.length; i++) {
        //get offline visits
        if (_options.useOffline) {
          projects[i].offlineVisits = _offline.getOfflineVisits(projects[i].project_id).length;
        } else {
          projects[i].offlineVisits = 0;
        }
      }

      return projects;
    }
  }, {
    key: "dumpOfflineVisits",
    value: function dumpOfflineVisits(item) {
      _logger.info(_self._fileName, 'dumpOfflineVisits', item);

      return new Promise(function (resolve, reject) {
        _offline.closeLocalforage();

        _offline.initLocalForage({
          'storeName': "bmaps_".concat(item.project_id),
          'localForageVersion': _options.localForageVersion
        });

        var dataToSend = {};
        dataToSend.what = 'SET_CURRENT_PROJECT';
        dataToSend.token = _options.token;
        dataToSend.project_id = item.project_id;

        _axios["default"].post(_options.baseHref + '/ajax.sewernet.php', dataToSend).then(function (response) {
          _logger.success(_self._fileName, 'dumpOfflineVisits SET_CURRENT_PROJECT', response.data.message);

          return _offline.dumpOfflineVisits({
            'project_id': item.project_id
          }).then(function (msg) {
            resolve(msg);
          })["catch"](function (error) {
            _logger.error(_self._fileName, 'dumpOfflineVisits error', error);

            reject(error);
          });
        })["catch"](function (error) {
          _logger.error(_self._fileName, 'dumpOfflineVisits error', error);

          reject(error);
        });
      });
    }
  }, {
    key: "getLocalizedStrings",
    value: function getLocalizedStrings() {
      return new Promise(function (resolve, reject) {
        var dataToSend = {};
        var localized_strings = {};
        dataToSend.token = _options.token;

        if (navigator.onLine) {
          _logger.info(_self._fileName, 'try ONLINE getLocalizedStrings');

          _axios["default"].post("".concat(_options.baseHref, "/ajax.strings.php"), dataToSend).then(function (response) {
            _logger.success(_self._fileName, 'getLocalizedStrings', response.data);

            for (var i = 0; i < response.data.message.length; i++) {
              var key = Object.keys(response.data.message[i])[0];
              var value = Object.values(response.data.message[i])[0];
              localized_strings[key] = value;
            }

            resolve({
              'status': response.data.status,
              'message': localized_strings
            });
          })["catch"](function (error) {
            _logger.error(_self._fileName, 'getLocalizedStrings', error);

            reject('projects', {
              'status': 'Failed',
              'message': error
            });
          });
        } else {
          _logger.info(_self._fileName, 'try OFFLINE getLocalizedStrings');

          var offlinestrings = _offline.getStrings(117);

          if (offlinestrings) {//send strings to controller
            //esolve({'status': response.data.status, 'message': projects});
          }
        }
      });
    }
  }]);

  return Home;
}(_events2.EventEmitter);

exports["default"] = Home;
window.Home = Home;

},{"../offline/offline":58,"../offline/visits_offline":60,"../src/richLogger":61,"./package":29,"axios":3,"events":62}],3:[function(require,module,exports){
"use strict";

module.exports = require('./lib/axios');

},{"./lib/axios":5}],4:[function(require,module,exports){
(function (process){
'use strict';

var utils = require('./../utils');

var settle = require('./../core/settle');

var buildURL = require('./../helpers/buildURL');

var parseHeaders = require('./../helpers/parseHeaders');

var isURLSameOrigin = require('./../helpers/isURLSameOrigin');

var createError = require('../core/createError');

var btoa = typeof window !== 'undefined' && window.btoa && window.btoa.bind(window) || require('./../helpers/btoa');

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();
    var loadEvent = 'onreadystatechange';
    var xDomain = false; // For IE 8/9 CORS support
    // Only supports POST and GET calls and doesn't returns the response headers.
    // DON'T do this for testing b/c XMLHttpRequest is mocked, not XDomainRequest.

    if (process.env.NODE_ENV !== 'test' && typeof window !== 'undefined' && window.XDomainRequest && !('withCredentials' in request) && !isURLSameOrigin(config.url)) {
      request = new window.XDomainRequest();
      loadEvent = 'onload';
      xDomain = true;

      request.onprogress = function handleProgress() {};

      request.ontimeout = function handleTimeout() {};
    } // HTTP basic authentication


    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true); // Set the request timeout in MS

    request.timeout = config.timeout; // Listen for ready state

    request[loadEvent] = function handleLoad() {
      if (!request || request.readyState !== 4 && !xDomain) {
        return;
      } // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request


      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      } // Prepare the response


      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      var response = {
        data: responseData,
        // IE sends 1223 instead of 204 (https://github.com/axios/axios/issues/201)
        status: request.status === 1223 ? 204 : request.status,
        statusText: request.status === 1223 ? 'No Content' : request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };
      settle(resolve, reject, response); // Clean up request

      request = null;
    }; // Handle low level network errors


    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request)); // Clean up request

      request = null;
    }; // Handle timeout


    request.ontimeout = function handleTimeout() {
      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED', request)); // Clean up request

      request = null;
    }; // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.


    if (utils.isStandardBrowserEnv()) {
      var cookies = require('./../helpers/cookies'); // Add xsrf header


      var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ? cookies.read(config.xsrfCookieName) : undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    } // Add headers to the request


    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    } // Add withCredentials to request if needed


    if (config.withCredentials) {
      request.withCredentials = true;
    } // Add responseType to request if needed


    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e;
        }
      }
    } // Handle progress if needed


    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    } // Not all browsers support upload events


    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel); // Clean up request

        request = null;
      });
    }

    if (requestData === undefined) {
      requestData = null;
    } // Send the request


    request.send(requestData);
  });
};

}).call(this,require('_process'))
},{"../core/createError":11,"./../core/settle":14,"./../helpers/btoa":18,"./../helpers/buildURL":19,"./../helpers/cookies":21,"./../helpers/isURLSameOrigin":23,"./../helpers/parseHeaders":25,"./../utils":27,"_process":63}],5:[function(require,module,exports){
'use strict';

var utils = require('./utils');

var bind = require('./helpers/bind');

var Axios = require('./core/Axios');

var defaults = require('./defaults');
/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */


function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context); // Copy axios.prototype to instance

  utils.extend(instance, Axios.prototype, context); // Copy context to instance

  utils.extend(instance, context);
  return instance;
} // Create the default instance to be exported


var axios = createInstance(defaults); // Expose Axios class to allow class inheritance

axios.Axios = Axios; // Factory for creating new instances

axios.create = function create(instanceConfig) {
  return createInstance(utils.merge(defaults, instanceConfig));
}; // Expose Cancel & CancelToken


axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel'); // Expose all/spread

axios.all = function all(promises) {
  return Promise.all(promises);
};

axios.spread = require('./helpers/spread');
module.exports = axios; // Allow use of default import syntax in TypeScript

module.exports["default"] = axios;

},{"./cancel/Cancel":6,"./cancel/CancelToken":7,"./cancel/isCancel":8,"./core/Axios":9,"./defaults":16,"./helpers/bind":17,"./helpers/spread":26,"./utils":27}],6:[function(require,module,exports){
'use strict';
/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */

function Cancel(message) {
  this.message = message;
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

Cancel.prototype.__CANCEL__ = true;
module.exports = Cancel;

},{}],7:[function(require,module,exports){
'use strict';

var Cancel = require('./Cancel');
/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */


function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });
  var token = this;
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}
/**
 * Throws a `Cancel` if cancellation has been requested.
 */


CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};
/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */


CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;

},{"./Cancel":6}],8:[function(require,module,exports){
'use strict';

module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

},{}],9:[function(require,module,exports){
'use strict';

var defaults = require('./../defaults');

var utils = require('./../utils');

var InterceptorManager = require('./InterceptorManager');

var dispatchRequest = require('./dispatchRequest');
/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */


function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}
/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */


Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = utils.merge({
      url: arguments[0]
    }, arguments[1]);
  }

  config = utils.merge(defaults, {
    method: 'get'
  }, this.defaults, config);
  config.method = config.method.toLowerCase(); // Hook up interceptors middleware

  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
}; // Provide aliases for supported request methods


utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function (url, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url
    }));
  };
});
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function (url, data, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});
module.exports = Axios;

},{"./../defaults":16,"./../utils":27,"./InterceptorManager":10,"./dispatchRequest":12}],10:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function InterceptorManager() {
  this.handlers = [];
}
/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */


InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};
/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */


InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};
/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */


InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;

},{"./../utils":27}],11:[function(require,module,exports){
'use strict';

var enhanceError = require('./enhanceError');
/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */


module.exports = function createError(message, config, code, request, response) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};

},{"./enhanceError":13}],12:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

var transformData = require('./transformData');

var isCancel = require('../cancel/isCancel');

var defaults = require('../defaults');

var isAbsoluteURL = require('./../helpers/isAbsoluteURL');

var combineURLs = require('./../helpers/combineURLs');
/**
 * Throws a `Cancel` if cancellation has been requested.
 */


function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}
/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */


module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config); // Support baseURL config

  if (config.baseURL && !isAbsoluteURL(config.url)) {
    config.url = combineURLs(config.baseURL, config.url);
  } // Ensure headers exist


  config.headers = config.headers || {}; // Transform request data

  config.data = transformData(config.data, config.headers, config.transformRequest); // Flatten headers

  config.headers = utils.merge(config.headers.common || {}, config.headers[config.method] || {}, config.headers || {});
  utils.forEach(['delete', 'get', 'head', 'post', 'put', 'patch', 'common'], function cleanHeaderConfig(method) {
    delete config.headers[method];
  });
  var adapter = config.adapter || defaults.adapter;
  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config); // Transform response data

    response.data = transformData(response.data, response.headers, config.transformResponse);
    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config); // Transform response data

      if (reason && reason.response) {
        reason.response.data = transformData(reason.response.data, reason.response.headers, config.transformResponse);
      }
    }

    return Promise.reject(reason);
  });
};

},{"../cancel/isCancel":8,"../defaults":16,"./../helpers/combineURLs":20,"./../helpers/isAbsoluteURL":22,"./../utils":27,"./transformData":15}],13:[function(require,module,exports){
'use strict';
/**
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */

module.exports = function enhanceError(error, config, code, request, response) {
  error.config = config;

  if (code) {
    error.code = code;
  }

  error.request = request;
  error.response = response;
  return error;
};

},{}],14:[function(require,module,exports){
'use strict';

var createError = require('./createError');
/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */


module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus; // Note: status is not exposed by XDomainRequest

  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError('Request failed with status code ' + response.status, response.config, null, response.request, response));
  }
};

},{"./createError":11}],15:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */


module.exports = function transformData(data, headers, fns) {
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn(data, headers);
  });
  return data;
};

},{"./../utils":27}],16:[function(require,module,exports){
(function (process){
'use strict';

var utils = require('./utils');

var normalizeHeaderName = require('./helpers/normalizeHeaderName');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;

  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr');
  } else if (typeof process !== 'undefined') {
    // For node use HTTP adapter
    adapter = require('./adapters/http');
  }

  return adapter;
}

var defaults = {
  adapter: getDefaultAdapter(),
  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Content-Type');

    if (utils.isFormData(data) || utils.isArrayBuffer(data) || utils.isBuffer(data) || utils.isStream(data) || utils.isFile(data) || utils.isBlob(data)) {
      return data;
    }

    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }

    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }

    if (utils.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      return JSON.stringify(data);
    }

    return data;
  }],
  transformResponse: [function transformResponse(data) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        /* Ignore */
      }
    }

    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  maxContentLength: -1,
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  }
};
defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};
utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});
module.exports = defaults;

}).call(this,require('_process'))
},{"./adapters/http":4,"./adapters/xhr":4,"./helpers/normalizeHeaderName":24,"./utils":27,"_process":63}],17:[function(require,module,exports){
'use strict';

module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);

    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    return fn.apply(thisArg, args);
  };
};

},{}],18:[function(require,module,exports){
'use strict'; // btoa polyfill for IE<10 courtesy https://github.com/davidchambers/Base64.js

var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function E() {
  this.message = 'String contains an invalid character';
}

E.prototype = new Error();
E.prototype.code = 5;
E.prototype.name = 'InvalidCharacterError';

function btoa(input) {
  var str = String(input);
  var output = '';

  for ( // initialize result and counter
  var block, charCode, idx = 0, map = chars; // if the next str index does not exist:
  //   change the mapping table to "="
  //   check if d has no fractional digits
  str.charAt(idx | 0) || (map = '=', idx % 1); // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
  output += map.charAt(63 & block >> 8 - idx % 1 * 8)) {
    charCode = str.charCodeAt(idx += 3 / 4);

    if (charCode > 0xFF) {
      throw new E();
    }

    block = block << 8 | charCode;
  }

  return output;
}

module.exports = btoa;

},{}],19:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).replace(/%40/gi, '@').replace(/%3A/gi, ':').replace(/%24/g, '$').replace(/%2C/gi, ',').replace(/%20/g, '+').replace(/%5B/gi, '[').replace(/%5D/gi, ']');
}
/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */


module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;

  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];
    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }

        parts.push(encode(key) + '=' + encode(v));
      });
    });
    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

},{"./../utils":27}],20:[function(require,module,exports){
'use strict';
/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */

module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '') : baseURL;
};

},{}],21:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = utils.isStandardBrowserEnv() ? // Standard browser envs support document.cookie
function standardBrowserEnv() {
  return {
    write: function write(name, value, expires, path, domain, secure) {
      var cookie = [];
      cookie.push(name + '=' + encodeURIComponent(value));

      if (utils.isNumber(expires)) {
        cookie.push('expires=' + new Date(expires).toGMTString());
      }

      if (utils.isString(path)) {
        cookie.push('path=' + path);
      }

      if (utils.isString(domain)) {
        cookie.push('domain=' + domain);
      }

      if (secure === true) {
        cookie.push('secure');
      }

      document.cookie = cookie.join('; ');
    },
    read: function read(name) {
      var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      return match ? decodeURIComponent(match[3]) : null;
    },
    remove: function remove(name) {
      this.write(name, '', Date.now() - 86400000);
    }
  };
}() : // Non standard browser env (web workers, react-native) lack needed support.
function nonStandardBrowserEnv() {
  return {
    write: function write() {},
    read: function read() {
      return null;
    },
    remove: function remove() {}
  };
}();

},{"./../utils":27}],22:[function(require,module,exports){
'use strict';
/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */

module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};

},{}],23:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = utils.isStandardBrowserEnv() ? // Standard browser envs have full support of the APIs needed to test
// whether the request URL is of the same origin as current location.
function standardBrowserEnv() {
  var msie = /(msie|trident)/i.test(navigator.userAgent);
  var urlParsingNode = document.createElement('a');
  var originURL;
  /**
  * Parse a URL to discover it's components
  *
  * @param {String} url The URL to be parsed
  * @returns {Object}
  */

  function resolveURL(url) {
    var href = url;

    if (msie) {
      // IE needs attribute set twice to normalize properties
      urlParsingNode.setAttribute('href', href);
      href = urlParsingNode.href;
    }

    urlParsingNode.setAttribute('href', href); // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils

    return {
      href: urlParsingNode.href,
      protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
      host: urlParsingNode.host,
      search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
      hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
      hostname: urlParsingNode.hostname,
      port: urlParsingNode.port,
      pathname: urlParsingNode.pathname.charAt(0) === '/' ? urlParsingNode.pathname : '/' + urlParsingNode.pathname
    };
  }

  originURL = resolveURL(window.location.href);
  /**
  * Determine if a URL shares the same origin as the current location
  *
  * @param {String} requestURL The URL to test
  * @returns {boolean} True if URL shares the same origin, otherwise false
  */

  return function isURLSameOrigin(requestURL) {
    var parsed = utils.isString(requestURL) ? resolveURL(requestURL) : requestURL;
    return parsed.protocol === originURL.protocol && parsed.host === originURL.host;
  };
}() : // Non standard browser envs (web workers, react-native) lack needed support.
function nonStandardBrowserEnv() {
  return function isURLSameOrigin() {
    return true;
  };
}();

},{"./../utils":27}],24:[function(require,module,exports){
'use strict';

var utils = require('../utils');

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};

},{"../utils":27}],25:[function(require,module,exports){
'use strict';

var utils = require('./../utils'); // Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers


var ignoreDuplicateOf = ['age', 'authorization', 'content-length', 'content-type', 'etag', 'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since', 'last-modified', 'location', 'max-forwards', 'proxy-authorization', 'referer', 'retry-after', 'user-agent'];
/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */

module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) {
    return parsed;
  }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }

      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });
  return parsed;
};

},{"./../utils":27}],26:[function(require,module,exports){
'use strict';
/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */

module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

},{}],27:[function(require,module,exports){
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var bind = require('./helpers/bind');

var isBuffer = require('is-buffer');
/*global toString:true*/
// utils is a library of generic helper functions non-specific to axios


var toString = Object.prototype.toString;
/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */

function isArray(val) {
  return toString.call(val) === '[object Array]';
}
/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */


function isArrayBuffer(val) {
  return toString.call(val) === '[object ArrayBuffer]';
}
/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */


function isFormData(val) {
  return typeof FormData !== 'undefined' && val instanceof FormData;
}
/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */


function isArrayBufferView(val) {
  var result;

  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && val.buffer instanceof ArrayBuffer;
  }

  return result;
}
/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */


function isString(val) {
  return typeof val === 'string';
}
/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */


function isNumber(val) {
  return typeof val === 'number';
}
/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */


function isUndefined(val) {
  return typeof val === 'undefined';
}
/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */


function isObject(val) {
  return val !== null && _typeof(val) === 'object';
}
/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */


function isDate(val) {
  return toString.call(val) === '[object Date]';
}
/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */


function isFile(val) {
  return toString.call(val) === '[object File]';
}
/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */


function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}
/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */


function isFunction(val) {
  return toString.call(val) === '[object Function]';
}
/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */


function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}
/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */


function isURLSearchParams(val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}
/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */


function trim(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}
/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 */


function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return false;
  }

  return typeof window !== 'undefined' && typeof document !== 'undefined';
}
/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */


function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  } // Force an array if not already something iterable


  if (_typeof(obj) !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}
/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */


function merge()
/* obj1, obj2, obj3, ... */
{
  var result = {};

  function assignValue(val, key) {
    if (_typeof(result[key]) === 'object' && _typeof(val) === 'object') {
      result[key] = merge(result[key], val);
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }

  return result;
}
/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */


function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim
};

},{"./helpers/bind":17,"is-buffer":28}],28:[function(require,module,exports){
"use strict";

/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer);
};

function isBuffer(obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
} // For Node v0.10 support. Remove this eventually.


function isSlowBuffer(obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0));
}

},{}],29:[function(require,module,exports){
module.exports={
  "name": "home",
  "version": "1.0.1",
  "description": "",
  "main": "home.js",
  "scripts": {
    "watch": "watchify -g [ babelify --presets [ @babel/preset-env ] ] home.js -o ../src/homeBundle.js",
    "build": "browserify -g [ babelify --presets [ @babel/preset-env ] ] home.js -o ../src/homeBundle.js",
    "dist": "browserify -g [ babelify --presets [ @babel/preset-env ] ] home.js -o ../src/homeBundle.js | uglifyjs ../src/homeBundle.js -mc > ../dist/homeBundle.$npm_package_version.min.js"

  },
  "author": "Vidro Software SL",
  "license": "ISC",
  "devDependencies": {
    "@babel/core": "^7.3.3",
    "@babel/preset-env": "^7.3.1",
    "babelify": "^10.0.0"
  },
  "dependencies": {
    "axios": "^0.18.0"
  }
}

},{}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _localforage = _interopRequireDefault(require("localforage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _version = '2.0.0',
    _script = 'mapStorage';
var _logger = null,
    _options = null,
    _localStorageSupport = false,
    _databaseName = null,
    isInitialized = false,
    _fs = null,
    _self = null;

var MapStorage =
/*#__PURE__*/
function () {
  function MapStorage(options, events, logger) {
    _classCallCheck(this, MapStorage);

    _logger = logger;
    _self = this;

    _logger.info(_script + " v." + _version, "Loaded", options);

    if (typeof options.localForageVersion === 'undefined') {
      options.localForageVersion = '2.0';
    }

    if (typeof options.storeName === 'undefined') {
      options.storeName = 'bmaps-default';
    }

    var getUrl = window.location;
    _databaseName = getUrl.protocol + "//" + getUrl.host + "/";

    try {
      window.localStorage.getItem('testkey');
      _localStorageSupport = true;
    } catch (e) {
      _logger.warn(_script + " v." + _version, "No localStorage support");
    }

    _options = options;

    _self.initLocalForage(_options);
  }

  _createClass(MapStorage, [{
    key: "closeLocalforage",
    value: function closeLocalforage() {
      _logger.info(_script + " v." + _version, "closeLocalforage()");

      isInitialized = false;
    }
  }, {
    key: "initLocalForage",
    value: function initLocalForage(options) {
      _logger.info(_script + " v." + _version, "initLocalForage()", {
        'databaseName': _databaseName,
        'storeName': options.storeName,
        'localForageVersion': options.localForageVersion
      });

      if (!isInitialized && _localforage["default"]) {
        _localforage["default"].config({
          name: _databaseName,
          storeName: options.storeName,
          size: 50 * 1024 * 1024,
          // Only use by webSQL
          version: options.localForageVersion,
          description: 'Storage for ' + _databaseName
        });

        var requestedBytes = 1024 * 1024 * 1000; // 1GB

        navigator.webkitPersistentStorage.requestQuota(requestedBytes, function (grantedBytes) {
          _logger.success(_script + " v." + _version, "granted ".concat(grantedBytes, " bytes"));

          isInitialized = true;
        }, function (e) {
          _logger.error(_script + " v." + _version, 'Error grantig space file system', e);
        }); //file System

        window.webkitRequestFileSystem(window.PERSISTENT, 1024 * 1024 * 1024
        /*1GB*/
        , function (fs) {
          _logger.info(_script + " v." + _version, "Opened file system", fs);

          _fs = fs;
        }, function (e) {
          _logger.error(_script + " v." + _version, "Error opening file system", e);
        });
      }
    }
  }, {
    key: "localStorageSpace",
    value: function localStorageSpace() {
      _logger.info(_script + " v." + _version, "localStorageSpace()");

      return new Promise(function (resolve, reject) {
        var data = '';
        var returnInfo = {};

        for (var key in window.localStorage) {
          if (window.localStorage.hasOwnProperty(key)) {
            data += window.localStorage[key];
          }
        }

        returnInfo.localStorageUsed = data.length;
        navigator.webkitTemporaryStorage.queryUsageAndQuota(function (usedBytes, grantedBytes) {
          returnInfo.indexDbUsedMb = (usedBytes / (1024 * 1024)).toFixed(2);
          returnInfo.indexDbGrantedMb = (grantedBytes / (1024 * 1024)).toFixed(2);
          returnInfo.totalUsed = ((usedBytes + returnInfo.localStorageUsed) / (1024 * 1024)).toFixed(2);
          returnInfo.localStorageUsed = (returnInfo.localStorageUsed / (1024 * 1024)).toFixed(2);
          returnInfo.usedPercentage = _self.usedPercentage(returnInfo.indexDbUsedMb, returnInfo.indexDbGrantedMb); //console.log('we are using ', usedBytes, ' of ', grantedBytes, 'bytes');
          //console.log('we are using ', usedMb, ' of ', granteMb, 'MB');

          resolve(returnInfo);
        }, function (e) {
          console.log('Error', e);
          reject(e);
        });
      });
    } //****************************************************************
    //******************     fileSystem HELPERS      *****************
    //****************************************************************

  }, {
    key: "readFilesFromFileSystem",
    value: function readFilesFromFileSystem() {
      _logger.info(_script + " v." + _version, "readFilesFromFileSystem()");

      return new Promise(function (resolve, reject) {
        var dirReader = _fs.root.createReader();

        var entries = []; // Call the reader.readEntries() until no more results are returned.

        var readEntries = function readEntries() {
          dirReader.readEntries(function (results) {
            if (!results.length) {
              resolve(entries.sort());
            } else {
              entries = entries.concat(_self.toArray(results));
              readEntries();
            }
          }, function (e) {
            _logger.error(_script + " v." + _version, "readFilesFromFileSystem() - error", e);

            reject(e);
          });
        };

        readEntries(); // Start reading dirs.
      });
    }
  }, {
    key: "resetFileSystem",
    value: function resetFileSystem() {
      _logger.info(_script + " v." + _version, "resetFileSystem()");

      _self.readFilesFromFileSystem().then(function (response) {
        response.forEach(function (entry, i) {
          _self.removeFileFromFileSystem(entry);
        });
      })["catch"](function (e) {
        _logger.error(_script + " v." + _version, "resetFileSystem() error reading files", e);
      });
    }
  }, {
    key: "removeFileFromFileSystem",
    value: function removeFileFromFileSystem(fileName) {
      _logger.info(_script + " v." + _version, "removeFileFromFileSystem(" + fileName + ")");

      _fs.root.getFile(fileName, {}, function (fileEntry) {
        fileEntry.remove(function () {
          _logger.success(_script + " v." + _version, "removeFileFromFileSystem(" + fileName + ") - File removed");
        }, function (e) {
          _logger.error(_script + " v." + _version, "removeFileFromFileSystem(" + fileName + ") - error removing file", e);
        });
      }, function (e) {
        _logger.warn(_script + " v." + _version, "removeFileFromFileSystem(" + fileName + ") - - could not find file", e);
      });
    } //****************************************************************
    //***************    END fileSystem HELPERS      *****************
    //****************************************************************
    //****************************************************************
    //******************     indexedDB HELPERS      ******************
    //****************************************************************

  }, {
    key: "clearIndexedDb",
    value: function clearIndexedDb() {
      _logger.info(_script + " v." + _version, "clearIndexedDb()", _databaseName);

      var req = indexedDB.deleteDatabase(_databaseName);

      req.onsuccess = function () {
        _logger.success(_script + " v." + _version, "Deleted database successfully");
      };

      req.onerror = function () {
        _logger.error(_script + " v." + _version, "Couldn't delete database", e);
      };

      req.onblocked = function () {
        _logger.error(_script + " v." + _version, "Couldn't delete database due to the operation being blocke");
      };
    } //****************************************************************
    //****************    END indexedDB HELPERS      *****************
    //****************************************************************
    //****************************************************************
    //***************     LocalStorage HELPERS      ******************
    //****************************************************************

  }, {
    key: "clearLocalStorage",
    value: function clearLocalStorage() {
      _logger.info(_script + " v." + _version, "clearLocalStorage()");

      return window.localStorage.clear();
    }
  }, {
    key: "getItem",
    value: function getItem(key) {
      if (_localStorageSupport) {
        return window.localStorage.getItem(key);
      }
    }
  }, {
    key: "setItem",
    value: function setItem(key, data) {
      if (_localStorageSupport) {
        return window.localStorage.setItem(key, data);
      }
    }
  }, {
    key: "removeItem",
    value: function removeItem(key) {
      if (_localStorageSupport) {
        return window.localStorage.removeItem(key);
      }
    } //****************************************************************
    //***************    END LocalStorage HELPERS      ***************
    //****************************************************************
    //****************************************************************
    //***************      LocalForage HELPERS         ***************
    //****************************************************************

  }, {
    key: "setTile",
    value: function setTile(key, dataURI) {
      _logger.info(_script + " v." + _version, "setTile(".concat(key, ")"), dataURI);

      return new Promise(function (resolve, reject) {
        if (isInitialized) {
          _localforage["default"].setItem(key, dataURI).then(function (value) {
            _logger.success(_script + " v." + _version, "setTile(".concat(key, ")"));

            resolve();
          })["catch"](function (err) {
            _logger.error(_script + " v." + _version, "setTile(".concat(key, ")"), err);

            reject(err);
          });
        } else {
          _logger.error(_script + " v." + _version, "setTile(".concat(key, ")"), 'localForage not initiated');

          reject('localForage not initiated');
        }
      });
    }
  }, {
    key: "getTile",
    value: function getTile(key) {
      _logger.info(_script + " v." + _version, "getTile(".concat(key, ")"), isInitialized);

      return new Promise(function (resolve, reject) {
        if (isInitialized) {
          _localforage["default"].getItem(key, function (err, compressedDataURI) {
            if (err) {
              _logger.error(_script + " v." + _version, "getTile(".concat(key, ")"), err);

              reject(err);
              return;
            }

            _logger.success(_script + " v." + _version, "getTile(".concat(key, ")"), compressedDataURI);

            resolve(_self.decompress(compressedDataURI));
          });
        } else {
          _logger.error(_script + " v." + _version, "setTile(".concat(key, ")"), 'localForage not initiated');

          reject('localForage not initiated');
        }
      });
    }
  }, {
    key: "removeTile",
    value: function removeTile(key) {
      _logger.info(_script + " v." + _version, "removeTile(".concat(key, ")"));

      return _localforage["default"].removeItem(key);
    } //****************************************************************
    //***************     END LocalForage HELPERS      ***************
    //****************************************************************
    //****************************************************************
    //***************     CacheStorage HELPERS      ******************
    //****************************************************************

  }, {
    key: "clearCacheStorage",
    value: function clearCacheStorage(version) {
      _logger.info(_script + " v." + _version, "clearCacheStorage(" + version + ")");

      caches.open(version).then(function (cache) {
        cache.keys().then(function (keys) {
          keys.forEach(function (request, index, array) {
            cache["delete"](request);
          });
        });
      });
    } //****************************************************************
    //***************    END CacheStorage HELPERS    *****************
    //****************************************************************
    //****************************************************************
    //***********************       HELPERS     **********************
    //****************************************************************

  }, {
    key: "usedPercentage",
    value: function usedPercentage(used, total) {
      return (100 * used / total).toFixed(2);
    }
  }, {
    key: "compress",
    value: function compress(s) {
      if (!s) {
        return s;
      }

      var i,
          l,
          out = '';

      if (s.length % 2 !== 0) {
        s += ' ';
      }

      for (i = 0, l = s.length; i < l; i += 2) {
        out += String.fromCharCode(s.charCodeAt(i) * 256 + s.charCodeAt(i + 1));
      }

      return String.fromCharCode(9731) + out;
    }
  }, {
    key: "decompress",
    value: function decompress(s) {
      if (!s) {
        return s;
      }

      var i,
          l,
          n,
          m,
          out = '';

      if (s.charCodeAt(0) !== 9731) {
        return s;
      }

      for (i = 1, l = s.length; i < l; i++) {
        n = s.charCodeAt(i);
        m = Math.floor(n / 256);
        out += String.fromCharCode(m, n % 256);
      }

      return out;
    }
  }, {
    key: "toArray",
    value: function toArray(list) {
      return Array.prototype.slice.call(list || [], 0);
    } //****************************************************************
    //***********************    END HELPERS    **********************
    //****************************************************************

  }]);

  return MapStorage;
}();

exports["default"] = MapStorage;

},{"localforage":57}],31:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"./lib/axios":33,"dup":3}],32:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

var settle = require('./../core/settle');

var buildURL = require('./../helpers/buildURL');

var parseHeaders = require('./../helpers/parseHeaders');

var isURLSameOrigin = require('./../helpers/isURLSameOrigin');

var createError = require('../core/createError');

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest(); // HTTP basic authentication

    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true); // Set the request timeout in MS

    request.timeout = config.timeout; // Listen for ready state

    request.onreadystatechange = function handleLoad() {
      if (!request || request.readyState !== 4) {
        return;
      } // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request


      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      } // Prepare the response


      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };
      settle(resolve, reject, response); // Clean up request

      request = null;
    }; // Handle browser request cancellation (as opposed to a manual cancellation)


    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request)); // Clean up request

      request = null;
    }; // Handle low level network errors


    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request)); // Clean up request

      request = null;
    }; // Handle timeout


    request.ontimeout = function handleTimeout() {
      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED', request)); // Clean up request

      request = null;
    }; // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.


    if (utils.isStandardBrowserEnv()) {
      var cookies = require('./../helpers/cookies'); // Add xsrf header


      var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ? cookies.read(config.xsrfCookieName) : undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    } // Add headers to the request


    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    } // Add withCredentials to request if needed


    if (config.withCredentials) {
      request.withCredentials = true;
    } // Add responseType to request if needed


    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e;
        }
      }
    } // Handle progress if needed


    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    } // Not all browsers support upload events


    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel); // Clean up request

        request = null;
      });
    }

    if (requestData === undefined) {
      requestData = null;
    } // Send the request


    request.send(requestData);
  });
};

},{"../core/createError":39,"./../core/settle":43,"./../helpers/buildURL":47,"./../helpers/cookies":49,"./../helpers/isURLSameOrigin":51,"./../helpers/parseHeaders":53,"./../utils":55}],33:[function(require,module,exports){
'use strict';

var utils = require('./utils');

var bind = require('./helpers/bind');

var Axios = require('./core/Axios');

var mergeConfig = require('./core/mergeConfig');

var defaults = require('./defaults');
/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */


function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context); // Copy axios.prototype to instance

  utils.extend(instance, Axios.prototype, context); // Copy context to instance

  utils.extend(instance, context);
  return instance;
} // Create the default instance to be exported


var axios = createInstance(defaults); // Expose Axios class to allow class inheritance

axios.Axios = Axios; // Factory for creating new instances

axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
}; // Expose Cancel & CancelToken


axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel'); // Expose all/spread

axios.all = function all(promises) {
  return Promise.all(promises);
};

axios.spread = require('./helpers/spread');
module.exports = axios; // Allow use of default import syntax in TypeScript

module.exports["default"] = axios;

},{"./cancel/Cancel":34,"./cancel/CancelToken":35,"./cancel/isCancel":36,"./core/Axios":37,"./core/mergeConfig":42,"./defaults":45,"./helpers/bind":46,"./helpers/spread":54,"./utils":55}],34:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],35:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"./Cancel":34,"dup":7}],36:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],37:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

var buildURL = require('../helpers/buildURL');

var InterceptorManager = require('./InterceptorManager');

var dispatchRequest = require('./dispatchRequest');

var mergeConfig = require('./mergeConfig');
/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */


function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}
/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */


Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    config = config || {};
  }

  config = mergeConfig(this.defaults, config);
  config.method = config.method ? config.method.toLowerCase() : 'get'; // Hook up interceptors middleware

  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
}; // Provide aliases for supported request methods


utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function (url, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url
    }));
  };
});
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function (url, data, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});
module.exports = Axios;

},{"../helpers/buildURL":47,"./../utils":55,"./InterceptorManager":38,"./dispatchRequest":40,"./mergeConfig":42}],38:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"./../utils":55,"dup":10}],39:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"./enhanceError":41,"dup":11}],40:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"../cancel/isCancel":36,"../defaults":45,"./../helpers/combineURLs":48,"./../helpers/isAbsoluteURL":50,"./../utils":55,"./transformData":44,"dup":12}],41:[function(require,module,exports){
'use strict';
/**
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */

module.exports = function enhanceError(error, config, code, request, response) {
  error.config = config;

  if (code) {
    error.code = code;
  }

  error.request = request;
  error.response = response;
  error.isAxiosError = true;

  error.toJSON = function () {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code
    };
  };

  return error;
};

},{}],42:[function(require,module,exports){
'use strict';

var utils = require('../utils');
/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */


module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};
  utils.forEach(['url', 'method', 'params', 'data'], function valueFromConfig2(prop) {
    if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop];
    }
  });
  utils.forEach(['headers', 'auth', 'proxy'], function mergeDeepProperties(prop) {
    if (utils.isObject(config2[prop])) {
      config[prop] = utils.deepMerge(config1[prop], config2[prop]);
    } else if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop];
    } else if (utils.isObject(config1[prop])) {
      config[prop] = utils.deepMerge(config1[prop]);
    } else if (typeof config1[prop] !== 'undefined') {
      config[prop] = config1[prop];
    }
  });
  utils.forEach(['baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer', 'timeout', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName', 'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'maxContentLength', 'validateStatus', 'maxRedirects', 'httpAgent', 'httpsAgent', 'cancelToken', 'socketPath'], function defaultToConfig2(prop) {
    if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop];
    } else if (typeof config1[prop] !== 'undefined') {
      config[prop] = config1[prop];
    }
  });
  return config;
};

},{"../utils":55}],43:[function(require,module,exports){
'use strict';

var createError = require('./createError');
/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */


module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;

  if (!validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError('Request failed with status code ' + response.status, response.config, null, response.request, response));
  }
};

},{"./createError":39}],44:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"./../utils":55,"dup":15}],45:[function(require,module,exports){
(function (process){
'use strict';

var utils = require('./utils');

var normalizeHeaderName = require('./helpers/normalizeHeaderName');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter; // Only Node.JS has a process variable that is of [[Class]] process

  if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('./adapters/http');
  } else if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr');
  }

  return adapter;
}

var defaults = {
  adapter: getDefaultAdapter(),
  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');

    if (utils.isFormData(data) || utils.isArrayBuffer(data) || utils.isBuffer(data) || utils.isStream(data) || utils.isFile(data) || utils.isBlob(data)) {
      return data;
    }

    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }

    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }

    if (utils.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      return JSON.stringify(data);
    }

    return data;
  }],
  transformResponse: [function transformResponse(data) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        /* Ignore */
      }
    }

    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  maxContentLength: -1,
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  }
};
defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};
utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});
module.exports = defaults;

}).call(this,require('_process'))
},{"./adapters/http":32,"./adapters/xhr":32,"./helpers/normalizeHeaderName":52,"./utils":55,"_process":63}],46:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17}],47:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).replace(/%40/gi, '@').replace(/%3A/gi, ':').replace(/%24/g, '$').replace(/%2C/gi, ',').replace(/%20/g, '+').replace(/%5B/gi, '[').replace(/%5D/gi, ']');
}
/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */


module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;

  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];
    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }

        parts.push(encode(key) + '=' + encode(v));
      });
    });
    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');

    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

},{"./../utils":55}],48:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],49:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = utils.isStandardBrowserEnv() ? // Standard browser envs support document.cookie
function standardBrowserEnv() {
  return {
    write: function write(name, value, expires, path, domain, secure) {
      var cookie = [];
      cookie.push(name + '=' + encodeURIComponent(value));

      if (utils.isNumber(expires)) {
        cookie.push('expires=' + new Date(expires).toGMTString());
      }

      if (utils.isString(path)) {
        cookie.push('path=' + path);
      }

      if (utils.isString(domain)) {
        cookie.push('domain=' + domain);
      }

      if (secure === true) {
        cookie.push('secure');
      }

      document.cookie = cookie.join('; ');
    },
    read: function read(name) {
      var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      return match ? decodeURIComponent(match[3]) : null;
    },
    remove: function remove(name) {
      this.write(name, '', Date.now() - 86400000);
    }
  };
}() : // Non standard browser env (web workers, react-native) lack needed support.
function nonStandardBrowserEnv() {
  return {
    write: function write() {},
    read: function read() {
      return null;
    },
    remove: function remove() {}
  };
}();

},{"./../utils":55}],50:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],51:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = utils.isStandardBrowserEnv() ? // Standard browser envs have full support of the APIs needed to test
// whether the request URL is of the same origin as current location.
function standardBrowserEnv() {
  var msie = /(msie|trident)/i.test(navigator.userAgent);
  var urlParsingNode = document.createElement('a');
  var originURL;
  /**
  * Parse a URL to discover it's components
  *
  * @param {String} url The URL to be parsed
  * @returns {Object}
  */

  function resolveURL(url) {
    var href = url;

    if (msie) {
      // IE needs attribute set twice to normalize properties
      urlParsingNode.setAttribute('href', href);
      href = urlParsingNode.href;
    }

    urlParsingNode.setAttribute('href', href); // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils

    return {
      href: urlParsingNode.href,
      protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
      host: urlParsingNode.host,
      search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
      hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
      hostname: urlParsingNode.hostname,
      port: urlParsingNode.port,
      pathname: urlParsingNode.pathname.charAt(0) === '/' ? urlParsingNode.pathname : '/' + urlParsingNode.pathname
    };
  }

  originURL = resolveURL(window.location.href);
  /**
  * Determine if a URL shares the same origin as the current location
  *
  * @param {String} requestURL The URL to test
  * @returns {boolean} True if URL shares the same origin, otherwise false
  */

  return function isURLSameOrigin(requestURL) {
    var parsed = utils.isString(requestURL) ? resolveURL(requestURL) : requestURL;
    return parsed.protocol === originURL.protocol && parsed.host === originURL.host;
  };
}() : // Non standard browser envs (web workers, react-native) lack needed support.
function nonStandardBrowserEnv() {
  return function isURLSameOrigin() {
    return true;
  };
}();

},{"./../utils":55}],52:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"../utils":55,"dup":24}],53:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"./../utils":55,"dup":25}],54:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],55:[function(require,module,exports){
'use strict';

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var bind = require('./helpers/bind');

var isBuffer = require('is-buffer');
/*global toString:true*/
// utils is a library of generic helper functions non-specific to axios


var toString = Object.prototype.toString;
/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */

function isArray(val) {
  return toString.call(val) === '[object Array]';
}
/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */


function isArrayBuffer(val) {
  return toString.call(val) === '[object ArrayBuffer]';
}
/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */


function isFormData(val) {
  return typeof FormData !== 'undefined' && val instanceof FormData;
}
/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */


function isArrayBufferView(val) {
  var result;

  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && val.buffer instanceof ArrayBuffer;
  }

  return result;
}
/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */


function isString(val) {
  return typeof val === 'string';
}
/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */


function isNumber(val) {
  return typeof val === 'number';
}
/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */


function isUndefined(val) {
  return typeof val === 'undefined';
}
/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */


function isObject(val) {
  return val !== null && _typeof(val) === 'object';
}
/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */


function isDate(val) {
  return toString.call(val) === '[object Date]';
}
/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */


function isFile(val) {
  return toString.call(val) === '[object File]';
}
/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */


function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}
/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */


function isFunction(val) {
  return toString.call(val) === '[object Function]';
}
/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */


function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}
/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */


function isURLSearchParams(val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}
/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */


function trim(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}
/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */


function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' || navigator.product === 'NativeScript' || navigator.product === 'NS')) {
    return false;
  }

  return typeof window !== 'undefined' && typeof document !== 'undefined';
}
/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */


function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  } // Force an array if not already something iterable


  if (_typeof(obj) !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}
/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */


function merge()
/* obj1, obj2, obj3, ... */
{
  var result = {};

  function assignValue(val, key) {
    if (_typeof(result[key]) === 'object' && _typeof(val) === 'object') {
      result[key] = merge(result[key], val);
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }

  return result;
}
/**
 * Function equal to merge with the difference being that no reference
 * to original objects is kept.
 *
 * @see merge
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */


function deepMerge()
/* obj1, obj2, obj3, ... */
{
  var result = {};

  function assignValue(val, key) {
    if (_typeof(result[key]) === 'object' && _typeof(val) === 'object') {
      result[key] = deepMerge(result[key], val);
    } else if (_typeof(val) === 'object') {
      result[key] = deepMerge({}, val);
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }

  return result;
}
/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */


function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  deepMerge: deepMerge,
  extend: extend,
  trim: trim
};

},{"./helpers/bind":46,"is-buffer":56}],56:[function(require,module,exports){
"use strict";

/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
module.exports = function isBuffer(obj) {
  return obj != null && obj.constructor != null && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
};

},{}],57:[function(require,module,exports){
(function (global){
"use strict";

function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

/*!
    localForage -- Offline Storage, Improved
    Version 1.7.3
    https://localforage.github.io/localForage
    (c) 2013-2017 Mozilla, Apache License 2.0
*/
(function (f) {
  if ((typeof exports === "undefined" ? "undefined" : _typeof2(exports)) === "object" && typeof module !== "undefined") {
    module.exports = f();
  } else if (typeof define === "function" && define.amd) {
    define([], f);
  } else {
    var g;

    if (typeof window !== "undefined") {
      g = window;
    } else if (typeof global !== "undefined") {
      g = global;
    } else if (typeof self !== "undefined") {
      g = self;
    } else {
      g = this;
    }

    g.localforage = f();
  }
})(function () {
  var define, module, exports;
  return function e(t, n, r) {
    function s(o, u) {
      if (!n[o]) {
        if (!t[o]) {
          var a = typeof require == "function" && require;
          if (!u && a) return a(o, !0);
          if (i) return i(o, !0);
          var f = new Error("Cannot find module '" + o + "'");
          throw f.code = "MODULE_NOT_FOUND", f;
        }

        var l = n[o] = {
          exports: {}
        };
        t[o][0].call(l.exports, function (e) {
          var n = t[o][1][e];
          return s(n ? n : e);
        }, l, l.exports, e, t, n, r);
      }

      return n[o].exports;
    }

    var i = typeof require == "function" && require;

    for (var o = 0; o < r.length; o++) {
      s(r[o]);
    }

    return s;
  }({
    1: [function (_dereq_, module, exports) {
      (function (global) {
        'use strict';

        var Mutation = global.MutationObserver || global.WebKitMutationObserver;
        var scheduleDrain;
        {
          if (Mutation) {
            var called = 0;
            var observer = new Mutation(nextTick);
            var element = global.document.createTextNode('');
            observer.observe(element, {
              characterData: true
            });

            scheduleDrain = function scheduleDrain() {
              element.data = called = ++called % 2;
            };
          } else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
            var channel = new global.MessageChannel();
            channel.port1.onmessage = nextTick;

            scheduleDrain = function scheduleDrain() {
              channel.port2.postMessage(0);
            };
          } else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
            scheduleDrain = function scheduleDrain() {
              // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
              // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
              var scriptEl = global.document.createElement('script');

              scriptEl.onreadystatechange = function () {
                nextTick();
                scriptEl.onreadystatechange = null;
                scriptEl.parentNode.removeChild(scriptEl);
                scriptEl = null;
              };

              global.document.documentElement.appendChild(scriptEl);
            };
          } else {
            scheduleDrain = function scheduleDrain() {
              setTimeout(nextTick, 0);
            };
          }
        }
        var draining;
        var queue = []; //named nextTick for less confusing stack traces

        function nextTick() {
          draining = true;
          var i, oldQueue;
          var len = queue.length;

          while (len) {
            oldQueue = queue;
            queue = [];
            i = -1;

            while (++i < len) {
              oldQueue[i]();
            }

            len = queue.length;
          }

          draining = false;
        }

        module.exports = immediate;

        function immediate(task) {
          if (queue.push(task) === 1 && !draining) {
            scheduleDrain();
          }
        }
      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {}],
    2: [function (_dereq_, module, exports) {
      'use strict';

      var immediate = _dereq_(1);
      /* istanbul ignore next */


      function INTERNAL() {}

      var handlers = {};
      var REJECTED = ['REJECTED'];
      var FULFILLED = ['FULFILLED'];
      var PENDING = ['PENDING'];
      module.exports = Promise;

      function Promise(resolver) {
        if (typeof resolver !== 'function') {
          throw new TypeError('resolver must be a function');
        }

        this.state = PENDING;
        this.queue = [];
        this.outcome = void 0;

        if (resolver !== INTERNAL) {
          safelyResolveThenable(this, resolver);
        }
      }

      Promise.prototype["catch"] = function (onRejected) {
        return this.then(null, onRejected);
      };

      Promise.prototype.then = function (onFulfilled, onRejected) {
        if (typeof onFulfilled !== 'function' && this.state === FULFILLED || typeof onRejected !== 'function' && this.state === REJECTED) {
          return this;
        }

        var promise = new this.constructor(INTERNAL);

        if (this.state !== PENDING) {
          var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
          unwrap(promise, resolver, this.outcome);
        } else {
          this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
        }

        return promise;
      };

      function QueueItem(promise, onFulfilled, onRejected) {
        this.promise = promise;

        if (typeof onFulfilled === 'function') {
          this.onFulfilled = onFulfilled;
          this.callFulfilled = this.otherCallFulfilled;
        }

        if (typeof onRejected === 'function') {
          this.onRejected = onRejected;
          this.callRejected = this.otherCallRejected;
        }
      }

      QueueItem.prototype.callFulfilled = function (value) {
        handlers.resolve(this.promise, value);
      };

      QueueItem.prototype.otherCallFulfilled = function (value) {
        unwrap(this.promise, this.onFulfilled, value);
      };

      QueueItem.prototype.callRejected = function (value) {
        handlers.reject(this.promise, value);
      };

      QueueItem.prototype.otherCallRejected = function (value) {
        unwrap(this.promise, this.onRejected, value);
      };

      function unwrap(promise, func, value) {
        immediate(function () {
          var returnValue;

          try {
            returnValue = func(value);
          } catch (e) {
            return handlers.reject(promise, e);
          }

          if (returnValue === promise) {
            handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
          } else {
            handlers.resolve(promise, returnValue);
          }
        });
      }

      handlers.resolve = function (self, value) {
        var result = tryCatch(getThen, value);

        if (result.status === 'error') {
          return handlers.reject(self, result.value);
        }

        var thenable = result.value;

        if (thenable) {
          safelyResolveThenable(self, thenable);
        } else {
          self.state = FULFILLED;
          self.outcome = value;
          var i = -1;
          var len = self.queue.length;

          while (++i < len) {
            self.queue[i].callFulfilled(value);
          }
        }

        return self;
      };

      handlers.reject = function (self, error) {
        self.state = REJECTED;
        self.outcome = error;
        var i = -1;
        var len = self.queue.length;

        while (++i < len) {
          self.queue[i].callRejected(error);
        }

        return self;
      };

      function getThen(obj) {
        // Make sure we only access the accessor once as required by the spec
        var then = obj && obj.then;

        if (obj && (_typeof2(obj) === 'object' || typeof obj === 'function') && typeof then === 'function') {
          return function appyThen() {
            then.apply(obj, arguments);
          };
        }
      }

      function safelyResolveThenable(self, thenable) {
        // Either fulfill, reject or reject with error
        var called = false;

        function onError(value) {
          if (called) {
            return;
          }

          called = true;
          handlers.reject(self, value);
        }

        function onSuccess(value) {
          if (called) {
            return;
          }

          called = true;
          handlers.resolve(self, value);
        }

        function tryToUnwrap() {
          thenable(onSuccess, onError);
        }

        var result = tryCatch(tryToUnwrap);

        if (result.status === 'error') {
          onError(result.value);
        }
      }

      function tryCatch(func, value) {
        var out = {};

        try {
          out.value = func(value);
          out.status = 'success';
        } catch (e) {
          out.status = 'error';
          out.value = e;
        }

        return out;
      }

      Promise.resolve = resolve;

      function resolve(value) {
        if (value instanceof this) {
          return value;
        }

        return handlers.resolve(new this(INTERNAL), value);
      }

      Promise.reject = reject;

      function reject(reason) {
        var promise = new this(INTERNAL);
        return handlers.reject(promise, reason);
      }

      Promise.all = all;

      function all(iterable) {
        var self = this;

        if (Object.prototype.toString.call(iterable) !== '[object Array]') {
          return this.reject(new TypeError('must be an array'));
        }

        var len = iterable.length;
        var called = false;

        if (!len) {
          return this.resolve([]);
        }

        var values = new Array(len);
        var resolved = 0;
        var i = -1;
        var promise = new this(INTERNAL);

        while (++i < len) {
          allResolver(iterable[i], i);
        }

        return promise;

        function allResolver(value, i) {
          self.resolve(value).then(resolveFromAll, function (error) {
            if (!called) {
              called = true;
              handlers.reject(promise, error);
            }
          });

          function resolveFromAll(outValue) {
            values[i] = outValue;

            if (++resolved === len && !called) {
              called = true;
              handlers.resolve(promise, values);
            }
          }
        }
      }

      Promise.race = race;

      function race(iterable) {
        var self = this;

        if (Object.prototype.toString.call(iterable) !== '[object Array]') {
          return this.reject(new TypeError('must be an array'));
        }

        var len = iterable.length;
        var called = false;

        if (!len) {
          return this.resolve([]);
        }

        var i = -1;
        var promise = new this(INTERNAL);

        while (++i < len) {
          resolver(iterable[i]);
        }

        return promise;

        function resolver(value) {
          self.resolve(value).then(function (response) {
            if (!called) {
              called = true;
              handlers.resolve(promise, response);
            }
          }, function (error) {
            if (!called) {
              called = true;
              handlers.reject(promise, error);
            }
          });
        }
      }
    }, {
      "1": 1
    }],
    3: [function (_dereq_, module, exports) {
      (function (global) {
        'use strict';

        if (typeof global.Promise !== 'function') {
          global.Promise = _dereq_(2);
        }
      }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, {
      "2": 2
    }],
    4: [function (_dereq_, module, exports) {
      'use strict';

      var _typeof = typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol" ? function (obj) {
        return _typeof2(obj);
      } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
      };

      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }

      function getIDB() {
        /* global indexedDB,webkitIndexedDB,mozIndexedDB,OIndexedDB,msIndexedDB */
        try {
          if (typeof indexedDB !== 'undefined') {
            return indexedDB;
          }

          if (typeof webkitIndexedDB !== 'undefined') {
            return webkitIndexedDB;
          }

          if (typeof mozIndexedDB !== 'undefined') {
            return mozIndexedDB;
          }

          if (typeof OIndexedDB !== 'undefined') {
            return OIndexedDB;
          }

          if (typeof msIndexedDB !== 'undefined') {
            return msIndexedDB;
          }
        } catch (e) {
          return;
        }
      }

      var idb = getIDB();

      function isIndexedDBValid() {
        try {
          // Initialize IndexedDB; fall back to vendor-prefixed versions
          // if needed.
          if (!idb) {
            return false;
          } // We mimic PouchDB here;
          //
          // We test for openDatabase because IE Mobile identifies itself
          // as Safari. Oh the lulz...


          var isSafari = typeof openDatabase !== 'undefined' && /(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/BlackBerry/.test(navigator.platform);
          var hasFetch = typeof fetch === 'function' && fetch.toString().indexOf('[native code') !== -1; // Safari <10.1 does not meet our requirements for IDB support (#5572)
          // since Safari 10.1 shipped with fetch, we can use that to detect it

          return (!isSafari || hasFetch) && typeof indexedDB !== 'undefined' && // some outdated implementations of IDB that appear on Samsung
          // and HTC Android devices <4.4 are missing IDBKeyRange
          // See: https://github.com/mozilla/localForage/issues/128
          // See: https://github.com/mozilla/localForage/issues/272
          typeof IDBKeyRange !== 'undefined';
        } catch (e) {
          return false;
        }
      } // Abstracts constructing a Blob object, so it also works in older
      // browsers that don't support the native Blob constructor. (i.e.
      // old QtWebKit versions, at least).
      // Abstracts constructing a Blob object, so it also works in older
      // browsers that don't support the native Blob constructor. (i.e.
      // old QtWebKit versions, at least).


      function createBlob(parts, properties) {
        /* global BlobBuilder,MSBlobBuilder,MozBlobBuilder,WebKitBlobBuilder */
        parts = parts || [];
        properties = properties || {};

        try {
          return new Blob(parts, properties);
        } catch (e) {
          if (e.name !== 'TypeError') {
            throw e;
          }

          var Builder = typeof BlobBuilder !== 'undefined' ? BlobBuilder : typeof MSBlobBuilder !== 'undefined' ? MSBlobBuilder : typeof MozBlobBuilder !== 'undefined' ? MozBlobBuilder : WebKitBlobBuilder;
          var builder = new Builder();

          for (var i = 0; i < parts.length; i += 1) {
            builder.append(parts[i]);
          }

          return builder.getBlob(properties.type);
        }
      } // This is CommonJS because lie is an external dependency, so Rollup
      // can just ignore it.


      if (typeof Promise === 'undefined') {
        // In the "nopromises" build this will just throw if you don't have
        // a global promise object, but it would throw anyway later.
        _dereq_(3);
      }

      var Promise$1 = Promise;

      function executeCallback(promise, callback) {
        if (callback) {
          promise.then(function (result) {
            callback(null, result);
          }, function (error) {
            callback(error);
          });
        }
      }

      function executeTwoCallbacks(promise, callback, errorCallback) {
        if (typeof callback === 'function') {
          promise.then(callback);
        }

        if (typeof errorCallback === 'function') {
          promise["catch"](errorCallback);
        }
      }

      function normalizeKey(key) {
        // Cast the key to a string, as that's all we can set as a key.
        if (typeof key !== 'string') {
          console.warn(key + ' used as a key, but it is not a string.');
          key = String(key);
        }

        return key;
      }

      function getCallback() {
        if (arguments.length && typeof arguments[arguments.length - 1] === 'function') {
          return arguments[arguments.length - 1];
        }
      } // Some code originally from async_storage.js in
      // [Gaia](https://github.com/mozilla-b2g/gaia).


      var DETECT_BLOB_SUPPORT_STORE = 'local-forage-detect-blob-support';
      var supportsBlobs = void 0;
      var dbContexts = {};
      var toString = Object.prototype.toString; // Transaction Modes

      var READ_ONLY = 'readonly';
      var READ_WRITE = 'readwrite'; // Transform a binary string to an array buffer, because otherwise
      // weird stuff happens when you try to work with the binary string directly.
      // It is known.
      // From http://stackoverflow.com/questions/14967647/ (continues on next line)
      // encode-decode-image-with-base64-breaks-image (2013-04-21)

      function _binStringToArrayBuffer(bin) {
        var length = bin.length;
        var buf = new ArrayBuffer(length);
        var arr = new Uint8Array(buf);

        for (var i = 0; i < length; i++) {
          arr[i] = bin.charCodeAt(i);
        }

        return buf;
      } //
      // Blobs are not supported in all versions of IndexedDB, notably
      // Chrome <37 and Android <5. In those versions, storing a blob will throw.
      //
      // Various other blob bugs exist in Chrome v37-42 (inclusive).
      // Detecting them is expensive and confusing to users, and Chrome 37-42
      // is at very low usage worldwide, so we do a hacky userAgent check instead.
      //
      // content-type bug: https://code.google.com/p/chromium/issues/detail?id=408120
      // 404 bug: https://code.google.com/p/chromium/issues/detail?id=447916
      // FileReader bug: https://code.google.com/p/chromium/issues/detail?id=447836
      //
      // Code borrowed from PouchDB. See:
      // https://github.com/pouchdb/pouchdb/blob/master/packages/node_modules/pouchdb-adapter-idb/src/blobSupport.js
      //


      function _checkBlobSupportWithoutCaching(idb) {
        return new Promise$1(function (resolve) {
          var txn = idb.transaction(DETECT_BLOB_SUPPORT_STORE, READ_WRITE);
          var blob = createBlob(['']);
          txn.objectStore(DETECT_BLOB_SUPPORT_STORE).put(blob, 'key');

          txn.onabort = function (e) {
            // If the transaction aborts now its due to not being able to
            // write to the database, likely due to the disk being full
            e.preventDefault();
            e.stopPropagation();
            resolve(false);
          };

          txn.oncomplete = function () {
            var matchedChrome = navigator.userAgent.match(/Chrome\/(\d+)/);
            var matchedEdge = navigator.userAgent.match(/Edge\//); // MS Edge pretends to be Chrome 42:
            // https://msdn.microsoft.com/en-us/library/hh869301%28v=vs.85%29.aspx

            resolve(matchedEdge || !matchedChrome || parseInt(matchedChrome[1], 10) >= 43);
          };
        })["catch"](function () {
          return false; // error, so assume unsupported
        });
      }

      function _checkBlobSupport(idb) {
        if (typeof supportsBlobs === 'boolean') {
          return Promise$1.resolve(supportsBlobs);
        }

        return _checkBlobSupportWithoutCaching(idb).then(function (value) {
          supportsBlobs = value;
          return supportsBlobs;
        });
      }

      function _deferReadiness(dbInfo) {
        var dbContext = dbContexts[dbInfo.name]; // Create a deferred object representing the current database operation.

        var deferredOperation = {};
        deferredOperation.promise = new Promise$1(function (resolve, reject) {
          deferredOperation.resolve = resolve;
          deferredOperation.reject = reject;
        }); // Enqueue the deferred operation.

        dbContext.deferredOperations.push(deferredOperation); // Chain its promise to the database readiness.

        if (!dbContext.dbReady) {
          dbContext.dbReady = deferredOperation.promise;
        } else {
          dbContext.dbReady = dbContext.dbReady.then(function () {
            return deferredOperation.promise;
          });
        }
      }

      function _advanceReadiness(dbInfo) {
        var dbContext = dbContexts[dbInfo.name]; // Dequeue a deferred operation.

        var deferredOperation = dbContext.deferredOperations.pop(); // Resolve its promise (which is part of the database readiness
        // chain of promises).

        if (deferredOperation) {
          deferredOperation.resolve();
          return deferredOperation.promise;
        }
      }

      function _rejectReadiness(dbInfo, err) {
        var dbContext = dbContexts[dbInfo.name]; // Dequeue a deferred operation.

        var deferredOperation = dbContext.deferredOperations.pop(); // Reject its promise (which is part of the database readiness
        // chain of promises).

        if (deferredOperation) {
          deferredOperation.reject(err);
          return deferredOperation.promise;
        }
      }

      function _getConnection(dbInfo, upgradeNeeded) {
        return new Promise$1(function (resolve, reject) {
          dbContexts[dbInfo.name] = dbContexts[dbInfo.name] || createDbContext();

          if (dbInfo.db) {
            if (upgradeNeeded) {
              _deferReadiness(dbInfo);

              dbInfo.db.close();
            } else {
              return resolve(dbInfo.db);
            }
          }

          var dbArgs = [dbInfo.name];

          if (upgradeNeeded) {
            dbArgs.push(dbInfo.version);
          }

          var openreq = idb.open.apply(idb, dbArgs);

          if (upgradeNeeded) {
            openreq.onupgradeneeded = function (e) {
              var db = openreq.result;

              try {
                db.createObjectStore(dbInfo.storeName);

                if (e.oldVersion <= 1) {
                  // Added when support for blob shims was added
                  db.createObjectStore(DETECT_BLOB_SUPPORT_STORE);
                }
              } catch (ex) {
                if (ex.name === 'ConstraintError') {
                  console.warn('The database "' + dbInfo.name + '"' + ' has been upgraded from version ' + e.oldVersion + ' to version ' + e.newVersion + ', but the storage "' + dbInfo.storeName + '" already exists.');
                } else {
                  throw ex;
                }
              }
            };
          }

          openreq.onerror = function (e) {
            e.preventDefault();
            reject(openreq.error);
          };

          openreq.onsuccess = function () {
            resolve(openreq.result);

            _advanceReadiness(dbInfo);
          };
        });
      }

      function _getOriginalConnection(dbInfo) {
        return _getConnection(dbInfo, false);
      }

      function _getUpgradedConnection(dbInfo) {
        return _getConnection(dbInfo, true);
      }

      function _isUpgradeNeeded(dbInfo, defaultVersion) {
        if (!dbInfo.db) {
          return true;
        }

        var isNewStore = !dbInfo.db.objectStoreNames.contains(dbInfo.storeName);
        var isDowngrade = dbInfo.version < dbInfo.db.version;
        var isUpgrade = dbInfo.version > dbInfo.db.version;

        if (isDowngrade) {
          // If the version is not the default one
          // then warn for impossible downgrade.
          if (dbInfo.version !== defaultVersion) {
            console.warn('The database "' + dbInfo.name + '"' + " can't be downgraded from version " + dbInfo.db.version + ' to version ' + dbInfo.version + '.');
          } // Align the versions to prevent errors.


          dbInfo.version = dbInfo.db.version;
        }

        if (isUpgrade || isNewStore) {
          // If the store is new then increment the version (if needed).
          // This will trigger an "upgradeneeded" event which is required
          // for creating a store.
          if (isNewStore) {
            var incVersion = dbInfo.db.version + 1;

            if (incVersion > dbInfo.version) {
              dbInfo.version = incVersion;
            }
          }

          return true;
        }

        return false;
      } // encode a blob for indexeddb engines that don't support blobs


      function _encodeBlob(blob) {
        return new Promise$1(function (resolve, reject) {
          var reader = new FileReader();
          reader.onerror = reject;

          reader.onloadend = function (e) {
            var base64 = btoa(e.target.result || '');
            resolve({
              __local_forage_encoded_blob: true,
              data: base64,
              type: blob.type
            });
          };

          reader.readAsBinaryString(blob);
        });
      } // decode an encoded blob


      function _decodeBlob(encodedBlob) {
        var arrayBuff = _binStringToArrayBuffer(atob(encodedBlob.data));

        return createBlob([arrayBuff], {
          type: encodedBlob.type
        });
      } // is this one of our fancy encoded blobs?


      function _isEncodedBlob(value) {
        return value && value.__local_forage_encoded_blob;
      } // Specialize the default `ready()` function by making it dependent
      // on the current database operations. Thus, the driver will be actually
      // ready when it's been initialized (default) *and* there are no pending
      // operations on the database (initiated by some other instances).


      function _fullyReady(callback) {
        var self = this;

        var promise = self._initReady().then(function () {
          var dbContext = dbContexts[self._dbInfo.name];

          if (dbContext && dbContext.dbReady) {
            return dbContext.dbReady;
          }
        });

        executeTwoCallbacks(promise, callback, callback);
        return promise;
      } // Try to establish a new db connection to replace the
      // current one which is broken (i.e. experiencing
      // InvalidStateError while creating a transaction).


      function _tryReconnect(dbInfo) {
        _deferReadiness(dbInfo);

        var dbContext = dbContexts[dbInfo.name];
        var forages = dbContext.forages;

        for (var i = 0; i < forages.length; i++) {
          var forage = forages[i];

          if (forage._dbInfo.db) {
            forage._dbInfo.db.close();

            forage._dbInfo.db = null;
          }
        }

        dbInfo.db = null;
        return _getOriginalConnection(dbInfo).then(function (db) {
          dbInfo.db = db;

          if (_isUpgradeNeeded(dbInfo)) {
            // Reopen the database for upgrading.
            return _getUpgradedConnection(dbInfo);
          }

          return db;
        }).then(function (db) {
          // store the latest db reference
          // in case the db was upgraded
          dbInfo.db = dbContext.db = db;

          for (var i = 0; i < forages.length; i++) {
            forages[i]._dbInfo.db = db;
          }
        })["catch"](function (err) {
          _rejectReadiness(dbInfo, err);

          throw err;
        });
      } // FF doesn't like Promises (micro-tasks) and IDDB store operations,
      // so we have to do it with callbacks


      function createTransaction(dbInfo, mode, callback, retries) {
        if (retries === undefined) {
          retries = 1;
        }

        try {
          var tx = dbInfo.db.transaction(dbInfo.storeName, mode);
          callback(null, tx);
        } catch (err) {
          if (retries > 0 && (!dbInfo.db || err.name === 'InvalidStateError' || err.name === 'NotFoundError')) {
            return Promise$1.resolve().then(function () {
              if (!dbInfo.db || err.name === 'NotFoundError' && !dbInfo.db.objectStoreNames.contains(dbInfo.storeName) && dbInfo.version <= dbInfo.db.version) {
                // increase the db version, to create the new ObjectStore
                if (dbInfo.db) {
                  dbInfo.version = dbInfo.db.version + 1;
                } // Reopen the database for upgrading.


                return _getUpgradedConnection(dbInfo);
              }
            }).then(function () {
              return _tryReconnect(dbInfo).then(function () {
                createTransaction(dbInfo, mode, callback, retries - 1);
              });
            })["catch"](callback);
          }

          callback(err);
        }
      }

      function createDbContext() {
        return {
          // Running localForages sharing a database.
          forages: [],
          // Shared database.
          db: null,
          // Database readiness (promise).
          dbReady: null,
          // Deferred operations on the database.
          deferredOperations: []
        };
      } // Open the IndexedDB database (automatically creates one if one didn't
      // previously exist), using any options set in the config.


      function _initStorage(options) {
        var self = this;
        var dbInfo = {
          db: null
        };

        if (options) {
          for (var i in options) {
            dbInfo[i] = options[i];
          }
        } // Get the current context of the database;


        var dbContext = dbContexts[dbInfo.name]; // ...or create a new context.

        if (!dbContext) {
          dbContext = createDbContext(); // Register the new context in the global container.

          dbContexts[dbInfo.name] = dbContext;
        } // Register itself as a running localForage in the current context.


        dbContext.forages.push(self); // Replace the default `ready()` function with the specialized one.

        if (!self._initReady) {
          self._initReady = self.ready;
          self.ready = _fullyReady;
        } // Create an array of initialization states of the related localForages.


        var initPromises = [];

        function ignoreErrors() {
          // Don't handle errors here,
          // just makes sure related localForages aren't pending.
          return Promise$1.resolve();
        }

        for (var j = 0; j < dbContext.forages.length; j++) {
          var forage = dbContext.forages[j];

          if (forage !== self) {
            // Don't wait for itself...
            initPromises.push(forage._initReady()["catch"](ignoreErrors));
          }
        } // Take a snapshot of the related localForages.


        var forages = dbContext.forages.slice(0); // Initialize the connection process only when
        // all the related localForages aren't pending.

        return Promise$1.all(initPromises).then(function () {
          dbInfo.db = dbContext.db; // Get the connection or open a new one without upgrade.

          return _getOriginalConnection(dbInfo);
        }).then(function (db) {
          dbInfo.db = db;

          if (_isUpgradeNeeded(dbInfo, self._defaultConfig.version)) {
            // Reopen the database for upgrading.
            return _getUpgradedConnection(dbInfo);
          }

          return db;
        }).then(function (db) {
          dbInfo.db = dbContext.db = db;
          self._dbInfo = dbInfo; // Share the final connection amongst related localForages.

          for (var k = 0; k < forages.length; k++) {
            var forage = forages[k];

            if (forage !== self) {
              // Self is already up-to-date.
              forage._dbInfo.db = dbInfo.db;
              forage._dbInfo.version = dbInfo.version;
            }
          }
        });
      }

      function getItem(key, callback) {
        var self = this;
        key = normalizeKey(key);
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
              if (err) {
                return reject(err);
              }

              try {
                var store = transaction.objectStore(self._dbInfo.storeName);
                var req = store.get(key);

                req.onsuccess = function () {
                  var value = req.result;

                  if (value === undefined) {
                    value = null;
                  }

                  if (_isEncodedBlob(value)) {
                    value = _decodeBlob(value);
                  }

                  resolve(value);
                };

                req.onerror = function () {
                  reject(req.error);
                };
              } catch (e) {
                reject(e);
              }
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      } // Iterate over all items stored in database.


      function iterate(iterator, callback) {
        var self = this;
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
              if (err) {
                return reject(err);
              }

              try {
                var store = transaction.objectStore(self._dbInfo.storeName);
                var req = store.openCursor();
                var iterationNumber = 1;

                req.onsuccess = function () {
                  var cursor = req.result;

                  if (cursor) {
                    var value = cursor.value;

                    if (_isEncodedBlob(value)) {
                      value = _decodeBlob(value);
                    }

                    var result = iterator(value, cursor.key, iterationNumber++); // when the iterator callback retuns any
                    // (non-`undefined`) value, then we stop
                    // the iteration immediately

                    if (result !== void 0) {
                      resolve(result);
                    } else {
                      cursor["continue"]();
                    }
                  } else {
                    resolve();
                  }
                };

                req.onerror = function () {
                  reject(req.error);
                };
              } catch (e) {
                reject(e);
              }
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      }

      function setItem(key, value, callback) {
        var self = this;
        key = normalizeKey(key);
        var promise = new Promise$1(function (resolve, reject) {
          var dbInfo;
          self.ready().then(function () {
            dbInfo = self._dbInfo;

            if (toString.call(value) === '[object Blob]') {
              return _checkBlobSupport(dbInfo.db).then(function (blobSupport) {
                if (blobSupport) {
                  return value;
                }

                return _encodeBlob(value);
              });
            }

            return value;
          }).then(function (value) {
            createTransaction(self._dbInfo, READ_WRITE, function (err, transaction) {
              if (err) {
                return reject(err);
              }

              try {
                var store = transaction.objectStore(self._dbInfo.storeName); // The reason we don't _save_ null is because IE 10 does
                // not support saving the `null` type in IndexedDB. How
                // ironic, given the bug below!
                // See: https://github.com/mozilla/localForage/issues/161

                if (value === null) {
                  value = undefined;
                }

                var req = store.put(value, key);

                transaction.oncomplete = function () {
                  // Cast to undefined so the value passed to
                  // callback/promise is the same as what one would get out
                  // of `getItem()` later. This leads to some weirdness
                  // (setItem('foo', undefined) will return `null`), but
                  // it's not my fault localStorage is our baseline and that
                  // it's weird.
                  if (value === undefined) {
                    value = null;
                  }

                  resolve(value);
                };

                transaction.onabort = transaction.onerror = function () {
                  var err = req.error ? req.error : req.transaction.error;
                  reject(err);
                };
              } catch (e) {
                reject(e);
              }
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      }

      function removeItem(key, callback) {
        var self = this;
        key = normalizeKey(key);
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            createTransaction(self._dbInfo, READ_WRITE, function (err, transaction) {
              if (err) {
                return reject(err);
              }

              try {
                var store = transaction.objectStore(self._dbInfo.storeName); // We use a Grunt task to make this safe for IE and some
                // versions of Android (including those used by Cordova).
                // Normally IE won't like `.delete()` and will insist on
                // using `['delete']()`, but we have a build step that
                // fixes this for us now.

                var req = store["delete"](key);

                transaction.oncomplete = function () {
                  resolve();
                };

                transaction.onerror = function () {
                  reject(req.error);
                }; // The request will be also be aborted if we've exceeded our storage
                // space.


                transaction.onabort = function () {
                  var err = req.error ? req.error : req.transaction.error;
                  reject(err);
                };
              } catch (e) {
                reject(e);
              }
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      }

      function clear(callback) {
        var self = this;
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            createTransaction(self._dbInfo, READ_WRITE, function (err, transaction) {
              if (err) {
                return reject(err);
              }

              try {
                var store = transaction.objectStore(self._dbInfo.storeName);
                var req = store.clear();

                transaction.oncomplete = function () {
                  resolve();
                };

                transaction.onabort = transaction.onerror = function () {
                  var err = req.error ? req.error : req.transaction.error;
                  reject(err);
                };
              } catch (e) {
                reject(e);
              }
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      }

      function length(callback) {
        var self = this;
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
              if (err) {
                return reject(err);
              }

              try {
                var store = transaction.objectStore(self._dbInfo.storeName);
                var req = store.count();

                req.onsuccess = function () {
                  resolve(req.result);
                };

                req.onerror = function () {
                  reject(req.error);
                };
              } catch (e) {
                reject(e);
              }
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      }

      function key(n, callback) {
        var self = this;
        var promise = new Promise$1(function (resolve, reject) {
          if (n < 0) {
            resolve(null);
            return;
          }

          self.ready().then(function () {
            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
              if (err) {
                return reject(err);
              }

              try {
                var store = transaction.objectStore(self._dbInfo.storeName);
                var advanced = false;
                var req = store.openCursor();

                req.onsuccess = function () {
                  var cursor = req.result;

                  if (!cursor) {
                    // this means there weren't enough keys
                    resolve(null);
                    return;
                  }

                  if (n === 0) {
                    // We have the first key, return it if that's what they
                    // wanted.
                    resolve(cursor.key);
                  } else {
                    if (!advanced) {
                      // Otherwise, ask the cursor to skip ahead n
                      // records.
                      advanced = true;
                      cursor.advance(n);
                    } else {
                      // When we get here, we've got the nth key.
                      resolve(cursor.key);
                    }
                  }
                };

                req.onerror = function () {
                  reject(req.error);
                };
              } catch (e) {
                reject(e);
              }
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      }

      function keys(callback) {
        var self = this;
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            createTransaction(self._dbInfo, READ_ONLY, function (err, transaction) {
              if (err) {
                return reject(err);
              }

              try {
                var store = transaction.objectStore(self._dbInfo.storeName);
                var req = store.openCursor();
                var keys = [];

                req.onsuccess = function () {
                  var cursor = req.result;

                  if (!cursor) {
                    resolve(keys);
                    return;
                  }

                  keys.push(cursor.key);
                  cursor["continue"]();
                };

                req.onerror = function () {
                  reject(req.error);
                };
              } catch (e) {
                reject(e);
              }
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      }

      function dropInstance(options, callback) {
        callback = getCallback.apply(this, arguments);
        var currentConfig = this.config();
        options = typeof options !== 'function' && options || {};

        if (!options.name) {
          options.name = options.name || currentConfig.name;
          options.storeName = options.storeName || currentConfig.storeName;
        }

        var self = this;
        var promise;

        if (!options.name) {
          promise = Promise$1.reject('Invalid arguments');
        } else {
          var isCurrentDb = options.name === currentConfig.name && self._dbInfo.db;
          var dbPromise = isCurrentDb ? Promise$1.resolve(self._dbInfo.db) : _getOriginalConnection(options).then(function (db) {
            var dbContext = dbContexts[options.name];
            var forages = dbContext.forages;
            dbContext.db = db;

            for (var i = 0; i < forages.length; i++) {
              forages[i]._dbInfo.db = db;
            }

            return db;
          });

          if (!options.storeName) {
            promise = dbPromise.then(function (db) {
              _deferReadiness(options);

              var dbContext = dbContexts[options.name];
              var forages = dbContext.forages;
              db.close();

              for (var i = 0; i < forages.length; i++) {
                var forage = forages[i];
                forage._dbInfo.db = null;
              }

              var dropDBPromise = new Promise$1(function (resolve, reject) {
                var req = idb.deleteDatabase(options.name);

                req.onerror = req.onblocked = function (err) {
                  var db = req.result;

                  if (db) {
                    db.close();
                  }

                  reject(err);
                };

                req.onsuccess = function () {
                  var db = req.result;

                  if (db) {
                    db.close();
                  }

                  resolve(db);
                };
              });
              return dropDBPromise.then(function (db) {
                dbContext.db = db;

                for (var i = 0; i < forages.length; i++) {
                  var _forage = forages[i];

                  _advanceReadiness(_forage._dbInfo);
                }
              })["catch"](function (err) {
                (_rejectReadiness(options, err) || Promise$1.resolve())["catch"](function () {});
                throw err;
              });
            });
          } else {
            promise = dbPromise.then(function (db) {
              if (!db.objectStoreNames.contains(options.storeName)) {
                return;
              }

              var newVersion = db.version + 1;

              _deferReadiness(options);

              var dbContext = dbContexts[options.name];
              var forages = dbContext.forages;
              db.close();

              for (var i = 0; i < forages.length; i++) {
                var forage = forages[i];
                forage._dbInfo.db = null;
                forage._dbInfo.version = newVersion;
              }

              var dropObjectPromise = new Promise$1(function (resolve, reject) {
                var req = idb.open(options.name, newVersion);

                req.onerror = function (err) {
                  var db = req.result;
                  db.close();
                  reject(err);
                };

                req.onupgradeneeded = function () {
                  var db = req.result;
                  db.deleteObjectStore(options.storeName);
                };

                req.onsuccess = function () {
                  var db = req.result;
                  db.close();
                  resolve(db);
                };
              });
              return dropObjectPromise.then(function (db) {
                dbContext.db = db;

                for (var j = 0; j < forages.length; j++) {
                  var _forage2 = forages[j];
                  _forage2._dbInfo.db = db;

                  _advanceReadiness(_forage2._dbInfo);
                }
              })["catch"](function (err) {
                (_rejectReadiness(options, err) || Promise$1.resolve())["catch"](function () {});
                throw err;
              });
            });
          }
        }

        executeCallback(promise, callback);
        return promise;
      }

      var asyncStorage = {
        _driver: 'asyncStorage',
        _initStorage: _initStorage,
        _support: isIndexedDBValid(),
        iterate: iterate,
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear,
        length: length,
        key: key,
        keys: keys,
        dropInstance: dropInstance
      };

      function isWebSQLValid() {
        return typeof openDatabase === 'function';
      } // Sadly, the best way to save binary data in WebSQL/localStorage is serializing
      // it to Base64, so this is how we store it to prevent very strange errors with less
      // verbose ways of binary <-> string data storage.


      var BASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      var BLOB_TYPE_PREFIX = '~~local_forage_type~';
      var BLOB_TYPE_PREFIX_REGEX = /^~~local_forage_type~([^~]+)~/;
      var SERIALIZED_MARKER = '__lfsc__:';
      var SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER.length; // OMG the serializations!

      var TYPE_ARRAYBUFFER = 'arbf';
      var TYPE_BLOB = 'blob';
      var TYPE_INT8ARRAY = 'si08';
      var TYPE_UINT8ARRAY = 'ui08';
      var TYPE_UINT8CLAMPEDARRAY = 'uic8';
      var TYPE_INT16ARRAY = 'si16';
      var TYPE_INT32ARRAY = 'si32';
      var TYPE_UINT16ARRAY = 'ur16';
      var TYPE_UINT32ARRAY = 'ui32';
      var TYPE_FLOAT32ARRAY = 'fl32';
      var TYPE_FLOAT64ARRAY = 'fl64';
      var TYPE_SERIALIZED_MARKER_LENGTH = SERIALIZED_MARKER_LENGTH + TYPE_ARRAYBUFFER.length;
      var toString$1 = Object.prototype.toString;

      function stringToBuffer(serializedString) {
        // Fill the string into a ArrayBuffer.
        var bufferLength = serializedString.length * 0.75;
        var len = serializedString.length;
        var i;
        var p = 0;
        var encoded1, encoded2, encoded3, encoded4;

        if (serializedString[serializedString.length - 1] === '=') {
          bufferLength--;

          if (serializedString[serializedString.length - 2] === '=') {
            bufferLength--;
          }
        }

        var buffer = new ArrayBuffer(bufferLength);
        var bytes = new Uint8Array(buffer);

        for (i = 0; i < len; i += 4) {
          encoded1 = BASE_CHARS.indexOf(serializedString[i]);
          encoded2 = BASE_CHARS.indexOf(serializedString[i + 1]);
          encoded3 = BASE_CHARS.indexOf(serializedString[i + 2]);
          encoded4 = BASE_CHARS.indexOf(serializedString[i + 3]);
          /*jslint bitwise: true */

          bytes[p++] = encoded1 << 2 | encoded2 >> 4;
          bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
          bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
        }

        return buffer;
      } // Converts a buffer to a string to store, serialized, in the backend
      // storage library.


      function bufferToString(buffer) {
        // base64-arraybuffer
        var bytes = new Uint8Array(buffer);
        var base64String = '';
        var i;

        for (i = 0; i < bytes.length; i += 3) {
          /*jslint bitwise: true */
          base64String += BASE_CHARS[bytes[i] >> 2];
          base64String += BASE_CHARS[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
          base64String += BASE_CHARS[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
          base64String += BASE_CHARS[bytes[i + 2] & 63];
        }

        if (bytes.length % 3 === 2) {
          base64String = base64String.substring(0, base64String.length - 1) + '=';
        } else if (bytes.length % 3 === 1) {
          base64String = base64String.substring(0, base64String.length - 2) + '==';
        }

        return base64String;
      } // Serialize a value, afterwards executing a callback (which usually
      // instructs the `setItem()` callback/promise to be executed). This is how
      // we store binary data with localStorage.


      function serialize(value, callback) {
        var valueType = '';

        if (value) {
          valueType = toString$1.call(value);
        } // Cannot use `value instanceof ArrayBuffer` or such here, as these
        // checks fail when running the tests using casper.js...
        //
        // TODO: See why those tests fail and use a better solution.


        if (value && (valueType === '[object ArrayBuffer]' || value.buffer && toString$1.call(value.buffer) === '[object ArrayBuffer]')) {
          // Convert binary arrays to a string and prefix the string with
          // a special marker.
          var buffer;
          var marker = SERIALIZED_MARKER;

          if (value instanceof ArrayBuffer) {
            buffer = value;
            marker += TYPE_ARRAYBUFFER;
          } else {
            buffer = value.buffer;

            if (valueType === '[object Int8Array]') {
              marker += TYPE_INT8ARRAY;
            } else if (valueType === '[object Uint8Array]') {
              marker += TYPE_UINT8ARRAY;
            } else if (valueType === '[object Uint8ClampedArray]') {
              marker += TYPE_UINT8CLAMPEDARRAY;
            } else if (valueType === '[object Int16Array]') {
              marker += TYPE_INT16ARRAY;
            } else if (valueType === '[object Uint16Array]') {
              marker += TYPE_UINT16ARRAY;
            } else if (valueType === '[object Int32Array]') {
              marker += TYPE_INT32ARRAY;
            } else if (valueType === '[object Uint32Array]') {
              marker += TYPE_UINT32ARRAY;
            } else if (valueType === '[object Float32Array]') {
              marker += TYPE_FLOAT32ARRAY;
            } else if (valueType === '[object Float64Array]') {
              marker += TYPE_FLOAT64ARRAY;
            } else {
              callback(new Error('Failed to get type for BinaryArray'));
            }
          }

          callback(marker + bufferToString(buffer));
        } else if (valueType === '[object Blob]') {
          // Conver the blob to a binaryArray and then to a string.
          var fileReader = new FileReader();

          fileReader.onload = function () {
            // Backwards-compatible prefix for the blob type.
            var str = BLOB_TYPE_PREFIX + value.type + '~' + bufferToString(this.result);
            callback(SERIALIZED_MARKER + TYPE_BLOB + str);
          };

          fileReader.readAsArrayBuffer(value);
        } else {
          try {
            callback(JSON.stringify(value));
          } catch (e) {
            console.error("Couldn't convert value into a JSON string: ", value);
            callback(null, e);
          }
        }
      } // Deserialize data we've inserted into a value column/field. We place
      // special markers into our strings to mark them as encoded; this isn't
      // as nice as a meta field, but it's the only sane thing we can do whilst
      // keeping localStorage support intact.
      //
      // Oftentimes this will just deserialize JSON content, but if we have a
      // special marker (SERIALIZED_MARKER, defined above), we will extract
      // some kind of arraybuffer/binary data/typed array out of the string.


      function deserialize(value) {
        // If we haven't marked this string as being specially serialized (i.e.
        // something other than serialized JSON), we can just return it and be
        // done with it.
        if (value.substring(0, SERIALIZED_MARKER_LENGTH) !== SERIALIZED_MARKER) {
          return JSON.parse(value);
        } // The following code deals with deserializing some kind of Blob or
        // TypedArray. First we separate out the type of data we're dealing
        // with from the data itself.


        var serializedString = value.substring(TYPE_SERIALIZED_MARKER_LENGTH);
        var type = value.substring(SERIALIZED_MARKER_LENGTH, TYPE_SERIALIZED_MARKER_LENGTH);
        var blobType; // Backwards-compatible blob type serialization strategy.
        // DBs created with older versions of localForage will simply not have the blob type.

        if (type === TYPE_BLOB && BLOB_TYPE_PREFIX_REGEX.test(serializedString)) {
          var matcher = serializedString.match(BLOB_TYPE_PREFIX_REGEX);
          blobType = matcher[1];
          serializedString = serializedString.substring(matcher[0].length);
        }

        var buffer = stringToBuffer(serializedString); // Return the right type based on the code/type set during
        // serialization.

        switch (type) {
          case TYPE_ARRAYBUFFER:
            return buffer;

          case TYPE_BLOB:
            return createBlob([buffer], {
              type: blobType
            });

          case TYPE_INT8ARRAY:
            return new Int8Array(buffer);

          case TYPE_UINT8ARRAY:
            return new Uint8Array(buffer);

          case TYPE_UINT8CLAMPEDARRAY:
            return new Uint8ClampedArray(buffer);

          case TYPE_INT16ARRAY:
            return new Int16Array(buffer);

          case TYPE_UINT16ARRAY:
            return new Uint16Array(buffer);

          case TYPE_INT32ARRAY:
            return new Int32Array(buffer);

          case TYPE_UINT32ARRAY:
            return new Uint32Array(buffer);

          case TYPE_FLOAT32ARRAY:
            return new Float32Array(buffer);

          case TYPE_FLOAT64ARRAY:
            return new Float64Array(buffer);

          default:
            throw new Error('Unkown type: ' + type);
        }
      }

      var localforageSerializer = {
        serialize: serialize,
        deserialize: deserialize,
        stringToBuffer: stringToBuffer,
        bufferToString: bufferToString
      };
      /*
       * Includes code from:
       *
       * base64-arraybuffer
       * https://github.com/niklasvh/base64-arraybuffer
       *
       * Copyright (c) 2012 Niklas von Hertzen
       * Licensed under the MIT license.
       */

      function createDbTable(t, dbInfo, callback, errorCallback) {
        t.executeSql('CREATE TABLE IF NOT EXISTS ' + dbInfo.storeName + ' ' + '(id INTEGER PRIMARY KEY, key unique, value)', [], callback, errorCallback);
      } // Open the WebSQL database (automatically creates one if one didn't
      // previously exist), using any options set in the config.


      function _initStorage$1(options) {
        var self = this;
        var dbInfo = {
          db: null
        };

        if (options) {
          for (var i in options) {
            dbInfo[i] = typeof options[i] !== 'string' ? options[i].toString() : options[i];
          }
        }

        var dbInfoPromise = new Promise$1(function (resolve, reject) {
          // Open the database; the openDatabase API will automatically
          // create it for us if it doesn't exist.
          try {
            dbInfo.db = openDatabase(dbInfo.name, String(dbInfo.version), dbInfo.description, dbInfo.size);
          } catch (e) {
            return reject(e);
          } // Create our key/value table if it doesn't exist.


          dbInfo.db.transaction(function (t) {
            createDbTable(t, dbInfo, function () {
              self._dbInfo = dbInfo;
              resolve();
            }, function (t, error) {
              reject(error);
            });
          }, reject);
        });
        dbInfo.serializer = localforageSerializer;
        return dbInfoPromise;
      }

      function tryExecuteSql(t, dbInfo, sqlStatement, args, callback, errorCallback) {
        t.executeSql(sqlStatement, args, callback, function (t, error) {
          if (error.code === error.SYNTAX_ERR) {
            t.executeSql('SELECT name FROM sqlite_master ' + "WHERE type='table' AND name = ?", [dbInfo.storeName], function (t, results) {
              if (!results.rows.length) {
                // if the table is missing (was deleted)
                // re-create it table and retry
                createDbTable(t, dbInfo, function () {
                  t.executeSql(sqlStatement, args, callback, errorCallback);
                }, errorCallback);
              } else {
                errorCallback(t, error);
              }
            }, errorCallback);
          } else {
            errorCallback(t, error);
          }
        }, errorCallback);
      }

      function getItem$1(key, callback) {
        var self = this;
        key = normalizeKey(key);
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function (t) {
              tryExecuteSql(t, dbInfo, 'SELECT * FROM ' + dbInfo.storeName + ' WHERE key = ? LIMIT 1', [key], function (t, results) {
                var result = results.rows.length ? results.rows.item(0).value : null; // Check to see if this is serialized content we need to
                // unpack.

                if (result) {
                  result = dbInfo.serializer.deserialize(result);
                }

                resolve(result);
              }, function (t, error) {
                reject(error);
              });
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      }

      function iterate$1(iterator, callback) {
        var self = this;
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function (t) {
              tryExecuteSql(t, dbInfo, 'SELECT * FROM ' + dbInfo.storeName, [], function (t, results) {
                var rows = results.rows;
                var length = rows.length;

                for (var i = 0; i < length; i++) {
                  var item = rows.item(i);
                  var result = item.value; // Check to see if this is serialized content
                  // we need to unpack.

                  if (result) {
                    result = dbInfo.serializer.deserialize(result);
                  }

                  result = iterator(result, item.key, i + 1); // void(0) prevents problems with redefinition
                  // of `undefined`.

                  if (result !== void 0) {
                    resolve(result);
                    return;
                  }
                }

                resolve();
              }, function (t, error) {
                reject(error);
              });
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      }

      function _setItem(key, value, callback, retriesLeft) {
        var self = this;
        key = normalizeKey(key);
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            // The localStorage API doesn't return undefined values in an
            // "expected" way, so undefined is always cast to null in all
            // drivers. See: https://github.com/mozilla/localForage/pull/42
            if (value === undefined) {
              value = null;
            } // Save the original value to pass to the callback.


            var originalValue = value;
            var dbInfo = self._dbInfo;
            dbInfo.serializer.serialize(value, function (value, error) {
              if (error) {
                reject(error);
              } else {
                dbInfo.db.transaction(function (t) {
                  tryExecuteSql(t, dbInfo, 'INSERT OR REPLACE INTO ' + dbInfo.storeName + ' ' + '(key, value) VALUES (?, ?)', [key, value], function () {
                    resolve(originalValue);
                  }, function (t, error) {
                    reject(error);
                  });
                }, function (sqlError) {
                  // The transaction failed; check
                  // to see if it's a quota error.
                  if (sqlError.code === sqlError.QUOTA_ERR) {
                    // We reject the callback outright for now, but
                    // it's worth trying to re-run the transaction.
                    // Even if the user accepts the prompt to use
                    // more storage on Safari, this error will
                    // be called.
                    //
                    // Try to re-run the transaction.
                    if (retriesLeft > 0) {
                      resolve(_setItem.apply(self, [key, originalValue, callback, retriesLeft - 1]));
                      return;
                    }

                    reject(sqlError);
                  }
                });
              }
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      }

      function setItem$1(key, value, callback) {
        return _setItem.apply(this, [key, value, callback, 1]);
      }

      function removeItem$1(key, callback) {
        var self = this;
        key = normalizeKey(key);
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function (t) {
              tryExecuteSql(t, dbInfo, 'DELETE FROM ' + dbInfo.storeName + ' WHERE key = ?', [key], function () {
                resolve();
              }, function (t, error) {
                reject(error);
              });
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      } // Deletes every item in the table.
      // TODO: Find out if this resets the AUTO_INCREMENT number.


      function clear$1(callback) {
        var self = this;
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function (t) {
              tryExecuteSql(t, dbInfo, 'DELETE FROM ' + dbInfo.storeName, [], function () {
                resolve();
              }, function (t, error) {
                reject(error);
              });
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      } // Does a simple `COUNT(key)` to get the number of items stored in
      // localForage.


      function length$1(callback) {
        var self = this;
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function (t) {
              // Ahhh, SQL makes this one soooooo easy.
              tryExecuteSql(t, dbInfo, 'SELECT COUNT(key) as c FROM ' + dbInfo.storeName, [], function (t, results) {
                var result = results.rows.item(0).c;
                resolve(result);
              }, function (t, error) {
                reject(error);
              });
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      } // Return the key located at key index X; essentially gets the key from a
      // `WHERE id = ?`. This is the most efficient way I can think to implement
      // this rarely-used (in my experience) part of the API, but it can seem
      // inconsistent, because we do `INSERT OR REPLACE INTO` on `setItem()`, so
      // the ID of each key will change every time it's updated. Perhaps a stored
      // procedure for the `setItem()` SQL would solve this problem?
      // TODO: Don't change ID on `setItem()`.


      function key$1(n, callback) {
        var self = this;
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function (t) {
              tryExecuteSql(t, dbInfo, 'SELECT key FROM ' + dbInfo.storeName + ' WHERE id = ? LIMIT 1', [n + 1], function (t, results) {
                var result = results.rows.length ? results.rows.item(0).key : null;
                resolve(result);
              }, function (t, error) {
                reject(error);
              });
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      }

      function keys$1(callback) {
        var self = this;
        var promise = new Promise$1(function (resolve, reject) {
          self.ready().then(function () {
            var dbInfo = self._dbInfo;
            dbInfo.db.transaction(function (t) {
              tryExecuteSql(t, dbInfo, 'SELECT key FROM ' + dbInfo.storeName, [], function (t, results) {
                var keys = [];

                for (var i = 0; i < results.rows.length; i++) {
                  keys.push(results.rows.item(i).key);
                }

                resolve(keys);
              }, function (t, error) {
                reject(error);
              });
            });
          })["catch"](reject);
        });
        executeCallback(promise, callback);
        return promise;
      } // https://www.w3.org/TR/webdatabase/#databases
      // > There is no way to enumerate or delete the databases available for an origin from this API.


      function getAllStoreNames(db) {
        return new Promise$1(function (resolve, reject) {
          db.transaction(function (t) {
            t.executeSql('SELECT name FROM sqlite_master ' + "WHERE type='table' AND name <> '__WebKitDatabaseInfoTable__'", [], function (t, results) {
              var storeNames = [];

              for (var i = 0; i < results.rows.length; i++) {
                storeNames.push(results.rows.item(i).name);
              }

              resolve({
                db: db,
                storeNames: storeNames
              });
            }, function (t, error) {
              reject(error);
            });
          }, function (sqlError) {
            reject(sqlError);
          });
        });
      }

      function dropInstance$1(options, callback) {
        callback = getCallback.apply(this, arguments);
        var currentConfig = this.config();
        options = typeof options !== 'function' && options || {};

        if (!options.name) {
          options.name = options.name || currentConfig.name;
          options.storeName = options.storeName || currentConfig.storeName;
        }

        var self = this;
        var promise;

        if (!options.name) {
          promise = Promise$1.reject('Invalid arguments');
        } else {
          promise = new Promise$1(function (resolve) {
            var db;

            if (options.name === currentConfig.name) {
              // use the db reference of the current instance
              db = self._dbInfo.db;
            } else {
              db = openDatabase(options.name, '', '', 0);
            }

            if (!options.storeName) {
              // drop all database tables
              resolve(getAllStoreNames(db));
            } else {
              resolve({
                db: db,
                storeNames: [options.storeName]
              });
            }
          }).then(function (operationInfo) {
            return new Promise$1(function (resolve, reject) {
              operationInfo.db.transaction(function (t) {
                function dropTable(storeName) {
                  return new Promise$1(function (resolve, reject) {
                    t.executeSql('DROP TABLE IF EXISTS ' + storeName, [], function () {
                      resolve();
                    }, function (t, error) {
                      reject(error);
                    });
                  });
                }

                var operations = [];

                for (var i = 0, len = operationInfo.storeNames.length; i < len; i++) {
                  operations.push(dropTable(operationInfo.storeNames[i]));
                }

                Promise$1.all(operations).then(function () {
                  resolve();
                })["catch"](function (e) {
                  reject(e);
                });
              }, function (sqlError) {
                reject(sqlError);
              });
            });
          });
        }

        executeCallback(promise, callback);
        return promise;
      }

      var webSQLStorage = {
        _driver: 'webSQLStorage',
        _initStorage: _initStorage$1,
        _support: isWebSQLValid(),
        iterate: iterate$1,
        getItem: getItem$1,
        setItem: setItem$1,
        removeItem: removeItem$1,
        clear: clear$1,
        length: length$1,
        key: key$1,
        keys: keys$1,
        dropInstance: dropInstance$1
      };

      function isLocalStorageValid() {
        try {
          return typeof localStorage !== 'undefined' && 'setItem' in localStorage && // in IE8 typeof localStorage.setItem === 'object'
          !!localStorage.setItem;
        } catch (e) {
          return false;
        }
      }

      function _getKeyPrefix(options, defaultConfig) {
        var keyPrefix = options.name + '/';

        if (options.storeName !== defaultConfig.storeName) {
          keyPrefix += options.storeName + '/';
        }

        return keyPrefix;
      } // Check if localStorage throws when saving an item


      function checkIfLocalStorageThrows() {
        var localStorageTestKey = '_localforage_support_test';

        try {
          localStorage.setItem(localStorageTestKey, true);
          localStorage.removeItem(localStorageTestKey);
          return false;
        } catch (e) {
          return true;
        }
      } // Check if localStorage is usable and allows to save an item
      // This method checks if localStorage is usable in Safari Private Browsing
      // mode, or in any other case where the available quota for localStorage
      // is 0 and there wasn't any saved items yet.


      function _isLocalStorageUsable() {
        return !checkIfLocalStorageThrows() || localStorage.length > 0;
      } // Config the localStorage backend, using options set in the config.


      function _initStorage$2(options) {
        var self = this;
        var dbInfo = {};

        if (options) {
          for (var i in options) {
            dbInfo[i] = options[i];
          }
        }

        dbInfo.keyPrefix = _getKeyPrefix(options, self._defaultConfig);

        if (!_isLocalStorageUsable()) {
          return Promise$1.reject();
        }

        self._dbInfo = dbInfo;
        dbInfo.serializer = localforageSerializer;
        return Promise$1.resolve();
      } // Remove all keys from the datastore, effectively destroying all data in
      // the app's key/value store!


      function clear$2(callback) {
        var self = this;
        var promise = self.ready().then(function () {
          var keyPrefix = self._dbInfo.keyPrefix;

          for (var i = localStorage.length - 1; i >= 0; i--) {
            var key = localStorage.key(i);

            if (key.indexOf(keyPrefix) === 0) {
              localStorage.removeItem(key);
            }
          }
        });
        executeCallback(promise, callback);
        return promise;
      } // Retrieve an item from the store. Unlike the original async_storage
      // library in Gaia, we don't modify return values at all. If a key's value
      // is `undefined`, we pass that value to the callback function.


      function getItem$2(key, callback) {
        var self = this;
        key = normalizeKey(key);
        var promise = self.ready().then(function () {
          var dbInfo = self._dbInfo;
          var result = localStorage.getItem(dbInfo.keyPrefix + key); // If a result was found, parse it from the serialized
          // string into a JS object. If result isn't truthy, the key
          // is likely undefined and we'll pass it straight to the
          // callback.

          if (result) {
            result = dbInfo.serializer.deserialize(result);
          }

          return result;
        });
        executeCallback(promise, callback);
        return promise;
      } // Iterate over all items in the store.


      function iterate$2(iterator, callback) {
        var self = this;
        var promise = self.ready().then(function () {
          var dbInfo = self._dbInfo;
          var keyPrefix = dbInfo.keyPrefix;
          var keyPrefixLength = keyPrefix.length;
          var length = localStorage.length; // We use a dedicated iterator instead of the `i` variable below
          // so other keys we fetch in localStorage aren't counted in
          // the `iterationNumber` argument passed to the `iterate()`
          // callback.
          //
          // See: github.com/mozilla/localForage/pull/435#discussion_r38061530

          var iterationNumber = 1;

          for (var i = 0; i < length; i++) {
            var key = localStorage.key(i);

            if (key.indexOf(keyPrefix) !== 0) {
              continue;
            }

            var value = localStorage.getItem(key); // If a result was found, parse it from the serialized
            // string into a JS object. If result isn't truthy, the
            // key is likely undefined and we'll pass it straight
            // to the iterator.

            if (value) {
              value = dbInfo.serializer.deserialize(value);
            }

            value = iterator(value, key.substring(keyPrefixLength), iterationNumber++);

            if (value !== void 0) {
              return value;
            }
          }
        });
        executeCallback(promise, callback);
        return promise;
      } // Same as localStorage's key() method, except takes a callback.


      function key$2(n, callback) {
        var self = this;
        var promise = self.ready().then(function () {
          var dbInfo = self._dbInfo;
          var result;

          try {
            result = localStorage.key(n);
          } catch (error) {
            result = null;
          } // Remove the prefix from the key, if a key is found.


          if (result) {
            result = result.substring(dbInfo.keyPrefix.length);
          }

          return result;
        });
        executeCallback(promise, callback);
        return promise;
      }

      function keys$2(callback) {
        var self = this;
        var promise = self.ready().then(function () {
          var dbInfo = self._dbInfo;
          var length = localStorage.length;
          var keys = [];

          for (var i = 0; i < length; i++) {
            var itemKey = localStorage.key(i);

            if (itemKey.indexOf(dbInfo.keyPrefix) === 0) {
              keys.push(itemKey.substring(dbInfo.keyPrefix.length));
            }
          }

          return keys;
        });
        executeCallback(promise, callback);
        return promise;
      } // Supply the number of keys in the datastore to the callback function.


      function length$2(callback) {
        var self = this;
        var promise = self.keys().then(function (keys) {
          return keys.length;
        });
        executeCallback(promise, callback);
        return promise;
      } // Remove an item from the store, nice and simple.


      function removeItem$2(key, callback) {
        var self = this;
        key = normalizeKey(key);
        var promise = self.ready().then(function () {
          var dbInfo = self._dbInfo;
          localStorage.removeItem(dbInfo.keyPrefix + key);
        });
        executeCallback(promise, callback);
        return promise;
      } // Set a key's value and run an optional callback once the value is set.
      // Unlike Gaia's implementation, the callback function is passed the value,
      // in case you want to operate on that value only after you're sure it
      // saved, or something like that.


      function setItem$2(key, value, callback) {
        var self = this;
        key = normalizeKey(key);
        var promise = self.ready().then(function () {
          // Convert undefined values to null.
          // https://github.com/mozilla/localForage/pull/42
          if (value === undefined) {
            value = null;
          } // Save the original value to pass to the callback.


          var originalValue = value;
          return new Promise$1(function (resolve, reject) {
            var dbInfo = self._dbInfo;
            dbInfo.serializer.serialize(value, function (value, error) {
              if (error) {
                reject(error);
              } else {
                try {
                  localStorage.setItem(dbInfo.keyPrefix + key, value);
                  resolve(originalValue);
                } catch (e) {
                  // localStorage capacity exceeded.
                  // TODO: Make this a specific error/event.
                  if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    reject(e);
                  }

                  reject(e);
                }
              }
            });
          });
        });
        executeCallback(promise, callback);
        return promise;
      }

      function dropInstance$2(options, callback) {
        callback = getCallback.apply(this, arguments);
        options = typeof options !== 'function' && options || {};

        if (!options.name) {
          var currentConfig = this.config();
          options.name = options.name || currentConfig.name;
          options.storeName = options.storeName || currentConfig.storeName;
        }

        var self = this;
        var promise;

        if (!options.name) {
          promise = Promise$1.reject('Invalid arguments');
        } else {
          promise = new Promise$1(function (resolve) {
            if (!options.storeName) {
              resolve(options.name + '/');
            } else {
              resolve(_getKeyPrefix(options, self._defaultConfig));
            }
          }).then(function (keyPrefix) {
            for (var i = localStorage.length - 1; i >= 0; i--) {
              var key = localStorage.key(i);

              if (key.indexOf(keyPrefix) === 0) {
                localStorage.removeItem(key);
              }
            }
          });
        }

        executeCallback(promise, callback);
        return promise;
      }

      var localStorageWrapper = {
        _driver: 'localStorageWrapper',
        _initStorage: _initStorage$2,
        _support: isLocalStorageValid(),
        iterate: iterate$2,
        getItem: getItem$2,
        setItem: setItem$2,
        removeItem: removeItem$2,
        clear: clear$2,
        length: length$2,
        key: key$2,
        keys: keys$2,
        dropInstance: dropInstance$2
      };

      var sameValue = function sameValue(x, y) {
        return x === y || typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y);
      };

      var includes = function includes(array, searchElement) {
        var len = array.length;
        var i = 0;

        while (i < len) {
          if (sameValue(array[i], searchElement)) {
            return true;
          }

          i++;
        }

        return false;
      };

      var isArray = Array.isArray || function (arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
      }; // Drivers are stored here when `defineDriver()` is called.
      // They are shared across all instances of localForage.


      var DefinedDrivers = {};
      var DriverSupport = {};
      var DefaultDrivers = {
        INDEXEDDB: asyncStorage,
        WEBSQL: webSQLStorage,
        LOCALSTORAGE: localStorageWrapper
      };
      var DefaultDriverOrder = [DefaultDrivers.INDEXEDDB._driver, DefaultDrivers.WEBSQL._driver, DefaultDrivers.LOCALSTORAGE._driver];
      var OptionalDriverMethods = ['dropInstance'];
      var LibraryMethods = ['clear', 'getItem', 'iterate', 'key', 'keys', 'length', 'removeItem', 'setItem'].concat(OptionalDriverMethods);
      var DefaultConfig = {
        description: '',
        driver: DefaultDriverOrder.slice(),
        name: 'localforage',
        // Default DB size is _JUST UNDER_ 5MB, as it's the highest size
        // we can use without a prompt.
        size: 4980736,
        storeName: 'keyvaluepairs',
        version: 1.0
      };

      function callWhenReady(localForageInstance, libraryMethod) {
        localForageInstance[libraryMethod] = function () {
          var _args = arguments;
          return localForageInstance.ready().then(function () {
            return localForageInstance[libraryMethod].apply(localForageInstance, _args);
          });
        };
      }

      function extend() {
        for (var i = 1; i < arguments.length; i++) {
          var arg = arguments[i];

          if (arg) {
            for (var _key in arg) {
              if (arg.hasOwnProperty(_key)) {
                if (isArray(arg[_key])) {
                  arguments[0][_key] = arg[_key].slice();
                } else {
                  arguments[0][_key] = arg[_key];
                }
              }
            }
          }
        }

        return arguments[0];
      }

      var LocalForage = function () {
        function LocalForage(options) {
          _classCallCheck(this, LocalForage);

          for (var driverTypeKey in DefaultDrivers) {
            if (DefaultDrivers.hasOwnProperty(driverTypeKey)) {
              var driver = DefaultDrivers[driverTypeKey];
              var driverName = driver._driver;
              this[driverTypeKey] = driverName;

              if (!DefinedDrivers[driverName]) {
                // we don't need to wait for the promise,
                // since the default drivers can be defined
                // in a blocking manner
                this.defineDriver(driver);
              }
            }
          }

          this._defaultConfig = extend({}, DefaultConfig);
          this._config = extend({}, this._defaultConfig, options);
          this._driverSet = null;
          this._initDriver = null;
          this._ready = false;
          this._dbInfo = null;

          this._wrapLibraryMethodsWithReady();

          this.setDriver(this._config.driver)["catch"](function () {});
        } // Set any config values for localForage; can be called anytime before
        // the first API call (e.g. `getItem`, `setItem`).
        // We loop through options so we don't overwrite existing config
        // values.


        LocalForage.prototype.config = function config(options) {
          // If the options argument is an object, we use it to set values.
          // Otherwise, we return either a specified config value or all
          // config values.
          if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
            // If localforage is ready and fully initialized, we can't set
            // any new configuration values. Instead, we return an error.
            if (this._ready) {
              return new Error("Can't call config() after localforage " + 'has been used.');
            }

            for (var i in options) {
              if (i === 'storeName') {
                options[i] = options[i].replace(/\W/g, '_');
              }

              if (i === 'version' && typeof options[i] !== 'number') {
                return new Error('Database version must be a number.');
              }

              this._config[i] = options[i];
            } // after all config options are set and
            // the driver option is used, try setting it


            if ('driver' in options && options.driver) {
              return this.setDriver(this._config.driver);
            }

            return true;
          } else if (typeof options === 'string') {
            return this._config[options];
          } else {
            return this._config;
          }
        }; // Used to define a custom driver, shared across all instances of
        // localForage.


        LocalForage.prototype.defineDriver = function defineDriver(driverObject, callback, errorCallback) {
          var promise = new Promise$1(function (resolve, reject) {
            try {
              var driverName = driverObject._driver;
              var complianceError = new Error('Custom driver not compliant; see ' + 'https://mozilla.github.io/localForage/#definedriver'); // A driver name should be defined and not overlap with the
              // library-defined, default drivers.

              if (!driverObject._driver) {
                reject(complianceError);
                return;
              }

              var driverMethods = LibraryMethods.concat('_initStorage');

              for (var i = 0, len = driverMethods.length; i < len; i++) {
                var driverMethodName = driverMethods[i]; // when the property is there,
                // it should be a method even when optional

                var isRequired = !includes(OptionalDriverMethods, driverMethodName);

                if ((isRequired || driverObject[driverMethodName]) && typeof driverObject[driverMethodName] !== 'function') {
                  reject(complianceError);
                  return;
                }
              }

              var configureMissingMethods = function configureMissingMethods() {
                var methodNotImplementedFactory = function methodNotImplementedFactory(methodName) {
                  return function () {
                    var error = new Error('Method ' + methodName + ' is not implemented by the current driver');
                    var promise = Promise$1.reject(error);
                    executeCallback(promise, arguments[arguments.length - 1]);
                    return promise;
                  };
                };

                for (var _i = 0, _len = OptionalDriverMethods.length; _i < _len; _i++) {
                  var optionalDriverMethod = OptionalDriverMethods[_i];

                  if (!driverObject[optionalDriverMethod]) {
                    driverObject[optionalDriverMethod] = methodNotImplementedFactory(optionalDriverMethod);
                  }
                }
              };

              configureMissingMethods();

              var setDriverSupport = function setDriverSupport(support) {
                if (DefinedDrivers[driverName]) {
                  console.info('Redefining LocalForage driver: ' + driverName);
                }

                DefinedDrivers[driverName] = driverObject;
                DriverSupport[driverName] = support; // don't use a then, so that we can define
                // drivers that have simple _support methods
                // in a blocking manner

                resolve();
              };

              if ('_support' in driverObject) {
                if (driverObject._support && typeof driverObject._support === 'function') {
                  driverObject._support().then(setDriverSupport, reject);
                } else {
                  setDriverSupport(!!driverObject._support);
                }
              } else {
                setDriverSupport(true);
              }
            } catch (e) {
              reject(e);
            }
          });
          executeTwoCallbacks(promise, callback, errorCallback);
          return promise;
        };

        LocalForage.prototype.driver = function driver() {
          return this._driver || null;
        };

        LocalForage.prototype.getDriver = function getDriver(driverName, callback, errorCallback) {
          var getDriverPromise = DefinedDrivers[driverName] ? Promise$1.resolve(DefinedDrivers[driverName]) : Promise$1.reject(new Error('Driver not found.'));
          executeTwoCallbacks(getDriverPromise, callback, errorCallback);
          return getDriverPromise;
        };

        LocalForage.prototype.getSerializer = function getSerializer(callback) {
          var serializerPromise = Promise$1.resolve(localforageSerializer);
          executeTwoCallbacks(serializerPromise, callback);
          return serializerPromise;
        };

        LocalForage.prototype.ready = function ready(callback) {
          var self = this;

          var promise = self._driverSet.then(function () {
            if (self._ready === null) {
              self._ready = self._initDriver();
            }

            return self._ready;
          });

          executeTwoCallbacks(promise, callback, callback);
          return promise;
        };

        LocalForage.prototype.setDriver = function setDriver(drivers, callback, errorCallback) {
          var self = this;

          if (!isArray(drivers)) {
            drivers = [drivers];
          }

          var supportedDrivers = this._getSupportedDrivers(drivers);

          function setDriverToConfig() {
            self._config.driver = self.driver();
          }

          function extendSelfWithDriver(driver) {
            self._extend(driver);

            setDriverToConfig();
            self._ready = self._initStorage(self._config);
            return self._ready;
          }

          function initDriver(supportedDrivers) {
            return function () {
              var currentDriverIndex = 0;

              function driverPromiseLoop() {
                while (currentDriverIndex < supportedDrivers.length) {
                  var driverName = supportedDrivers[currentDriverIndex];
                  currentDriverIndex++;
                  self._dbInfo = null;
                  self._ready = null;
                  return self.getDriver(driverName).then(extendSelfWithDriver)["catch"](driverPromiseLoop);
                }

                setDriverToConfig();
                var error = new Error('No available storage method found.');
                self._driverSet = Promise$1.reject(error);
                return self._driverSet;
              }

              return driverPromiseLoop();
            };
          } // There might be a driver initialization in progress
          // so wait for it to finish in order to avoid a possible
          // race condition to set _dbInfo


          var oldDriverSetDone = this._driverSet !== null ? this._driverSet["catch"](function () {
            return Promise$1.resolve();
          }) : Promise$1.resolve();
          this._driverSet = oldDriverSetDone.then(function () {
            var driverName = supportedDrivers[0];
            self._dbInfo = null;
            self._ready = null;
            return self.getDriver(driverName).then(function (driver) {
              self._driver = driver._driver;
              setDriverToConfig();

              self._wrapLibraryMethodsWithReady();

              self._initDriver = initDriver(supportedDrivers);
            });
          })["catch"](function () {
            setDriverToConfig();
            var error = new Error('No available storage method found.');
            self._driverSet = Promise$1.reject(error);
            return self._driverSet;
          });
          executeTwoCallbacks(this._driverSet, callback, errorCallback);
          return this._driverSet;
        };

        LocalForage.prototype.supports = function supports(driverName) {
          return !!DriverSupport[driverName];
        };

        LocalForage.prototype._extend = function _extend(libraryMethodsAndProperties) {
          extend(this, libraryMethodsAndProperties);
        };

        LocalForage.prototype._getSupportedDrivers = function _getSupportedDrivers(drivers) {
          var supportedDrivers = [];

          for (var i = 0, len = drivers.length; i < len; i++) {
            var driverName = drivers[i];

            if (this.supports(driverName)) {
              supportedDrivers.push(driverName);
            }
          }

          return supportedDrivers;
        };

        LocalForage.prototype._wrapLibraryMethodsWithReady = function _wrapLibraryMethodsWithReady() {
          // Add a stub for each driver API method that delays the call to the
          // corresponding driver method until localForage is ready. These stubs
          // will be replaced by the driver methods as soon as the driver is
          // loaded, so there is no performance impact.
          for (var i = 0, len = LibraryMethods.length; i < len; i++) {
            callWhenReady(this, LibraryMethods[i]);
          }
        };

        LocalForage.prototype.createInstance = function createInstance(options) {
          return new LocalForage(options);
        };

        return LocalForage;
      }(); // The actual localForage object that we expose as a module or via a
      // global. It's extended by pulling in one of our other libraries.


      var localforage_js = new LocalForage();
      module.exports = localforage_js;
    }, {
      "3": 3
    }]
  }, {}, [4])(4);
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],58:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _events2 = require("events");

var _richLogger = _interopRequireDefault(require("../src/richLogger"));

var _mapStorage = _interopRequireDefault(require("./mapStorage"));

var _visits_offline = _interopRequireDefault(require("./visits_offline"));

var _package = require("./package");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var _self = null,
    _events = null,
    _strings = [],
    _offlineLogin = false,
    _logger = null; //modules

var _storage = null,
    _visitOffline = null;

var Offline =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(Offline, _EventEmitter);

  function Offline(options, events) {
    var _this;

    _classCallCheck(this, Offline);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Offline).call(this));

    if (typeof options === 'undefined') {
      throw new TypeError('no data');
    }

    if (typeof options.baseHref === 'undefined') {
      throw new TypeError('no options baseHref');
    }

    if (typeof options.env === 'undefined') {
      options.env = 'prod';
    }

    if (typeof options.offlineLogin !== 'undefined') {
      _offlineLogin = options.offlineLogin;
    }

    if (typeof events != 'undefined') {
      _events = events;
    } else {
      _events = _events2.EventEmitter;
    }

    if (typeof options.localForageVersion === 'undefined') {
      throw new TypeError('no options localForageVersion');
    }

    _logger = new _richLogger["default"](options.env, {});
    _self = _assertThisInitialized(_this);
    _self._version = _package.version;
    _self._fileName = 'offline.js';
    _self.options = options;

    if (typeof options.strings !== 'undefined') {
      _strings = options.strings;
    }

    _logger.info(_self._fileName, "Module loaded v.".concat(_self._version));

    _storage = new _mapStorage["default"](options, _events, _logger);
    options.storage = _storage;
    _visitOffline = new _visits_offline["default"](options, _events, _logger);
    return _this;
  } //****************************************************************
  //*********************         INFO        **********************
  //****************************************************************


  _createClass(Offline, [{
    key: "getOfflineInfo",
    value: function getOfflineInfo() {
      _logger.info(_self._fileName, 'getOfflineInfo()');

      return new Promise(function (resolve, reject) {
        var stored_keys = [];
        var stored_credentials = [];
        var stored_projects = [];
        var stored_project_data = [];

        _self.checkServiceWorker();

        for (var key in localStorage) {
          var value = null;

          if (key.includes('stored_date')) {
            value = _self.formatDate(_storage.getItem(key));
            stored_keys.push({
              'key': key,
              'value': value
            });
          } else if (key.includes('offlineLogin_')) {
            //find offline login credentials
            var cred = JSON.parse(_storage.getItem(key));
            stored_credentials.push({
              'email': cred.email,
              'key': key
            });
          } else if (key.includes('bmaps_')) {
            //find offline project info
            //find project id
            var processKey = key.split('bmaps_');
            var project_id = processKey[1].split('_');
            var pIkey = "bmaps_".concat(project_id[0], "_projectInfo");

            var alias = _self.getStoredProjectAlias(pIkey);

            var index = stored_projects.indexOf("".concat(alias, " - ").concat(project_id[0]));

            if (index === -1) {
              stored_projects.push("".concat(alias, " - ").concat(project_id[0]));
              stored_project_data.push([{
                'pretty': project_id[1],
                'key': processKey
              }]);
            } else {
              var stored_pr = stored_project_data[index];
              stored_pr.push({
                'pretty': project_id[1],
                'key': processKey
              });
            }
          }
        }

        _storage.localStorageSpace().then(function (response) {
          var data = {
            'totalUsed': "".concat(response.totalUsed, " Mb"),
            'usedPercentage': response.usedPercentage,
            'indexDbUsedMb': "".concat(response.indexDbUsedMb, " Mb"),
            'localStorageUsed': "".concat(response.localStorageUsed, " Mb"),
            'stored_keys': stored_keys,
            'stored_credentials': stored_credentials,
            'stored_projects': stored_projects,
            'stored_project_data': stored_project_data,
            'stored_cookie': _storage.getItem('tocCookie')
          };

          _logger.info(_self._fileName, 'getOfflineInfo() result', data);

          resolve(data);
        })["catch"](function (e) {
          _logger.error(_self._fileName, 'getOfflineInfo() error', e);

          reject(e);
        });
      });
    }
  }, {
    key: "getStoredProjectAlias",
    value: function getStoredProjectAlias(key) {
      _logger.info(_self._fileName, 'getStoredProjectAlias', key);

      try {
        var pI = JSON.parse(_storage.getItem(key));
        return pI.alias;
      } catch (e) {
        return "Not detected";
      }
    }
  }, {
    key: "deleteProject",
    value: function deleteProject(item) {
      _logger.info(_self._fileName, 'deleteProject', item); //fin project ID


      var id = item.split(' - ');

      for (var key in localStorage) {
        if (key.includes("bmaps_".concat(id[1]))) {
          _storage.removeItem(key);
        }
      }
    }
  }, {
    key: "getOfflineVisits",
    value: function getOfflineVisits(item) {
      _logger.info(_self._fileName, 'getOfflineVisits', item);

      return _visitOffline.getOfflineVisits(item);
    }
  }, {
    key: "dumpOfflineVisits",
    value: function dumpOfflineVisits(data) {
      _logger.info(_self._fileName, 'dumpOfflineVisits', data);

      return _visitOffline.dumpOfflineVisits(data);
    } //****************************************************************
    //*********************      END INFO        *********************
    //****************************************************************
    //****************************************************************
    //*****************      SERVICE WORKER      *********************
    //****************************************************************

  }, {
    key: "checkServiceWorker",
    value: function checkServiceWorker() {
      _logger.info(_self._fileName, 'checkServiceWorker()');

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
          console.log(registrations);
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = registrations[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var registration = _step.value;

              if (registration.scope === _self.getBaseUrl()) {
                _self.emit('offline', {
                  'evt': 'serviceWorker',
                  'msg': true
                });

                break;
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                _iterator["return"]();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        });
      }
    }
  }, {
    key: "removeServiceWorker",
    value: function removeServiceWorker() {
      _logger.info(_self._fileName, 'removeServiceWorker()');

      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = registrations[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var registration = _step2.value;
            registration.unregister();
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      });

      _storage.clearCacheStorage(_self.options.cacheVersion);
    } //****************************************************************
    //*****************    END SERVICE WORKER     *********************
    //****************************************************************
    //****************************************************************
    //***********************        RESET      **********************
    //****************************************************************

  }, {
    key: "offlineReset",
    value: function offlineReset() {
      _logger.info(_self._fileName, 'offlineReset()');

      _storage.clearIndexedDb();

      _storage.clearLocalStorage();

      _storage.resetFileSystem();

      _storage.clearCacheStorage(_self.options.cacheVersion);

      _self.removeServiceWorker();
    } //****************************************************************
    //***********************        RESET      **********************
    //****************************************************************
    //****************************************************************
    //***********************     PROJECTS      **********************
    //****************************************************************

  }, {
    key: "getStoredProjects",
    value: function getStoredProjects(user_id) {
      _logger.info(_self._fileName, 'getStoredProjects', user_id);

      return _storage.getItem("user_projects_".concat(user_id));
    }
  }, {
    key: "setStoredProjects",
    value: function setStoredProjects(user_id, projects) {
      _logger.info(_self._fileName, 'setStoredProjects', {
        'user_id': user_id,
        'projects': projects
      });

      return _storage.setItem("user_projects_".concat(user_id), projects);
    } //****************************************************************
    //********************      END PROJECTS      ********************
    //****************************************************************
    //****************************************************************
    //***********************     STRINGS      **********************
    //****************************************************************

  }, {
    key: "setStrings",
    value: function setStrings(strings) {
      _logger.info(_self._fileName, 'setStrings()', strings);

      _strings = strings;
    }
  }, {
    key: "getStrings",
    value: function getStrings(project_id) {
      _logger.info(_self._fileName, 'getStrings()', project_id);

      return {
        'strings': JSON.parse(_storage.getItem("bmaps_".concat(project_id, "_strings")))
      };
    } //****************************************************************
    //********************      END STRINGS       ********************
    //****************************************************************
    //****************************************************************
    //********************          HELPERS      *********************
    //****************************************************************

  }, {
    key: "formatDate",
    value: function formatDate(stringDate) {
      var newfecha = new Date(Date.parse(stringDate));
      return newfecha.getDay() + "/" + newfecha.getMonth() + "/" + newfecha.getYear() + " " + newfecha.getHours() + ":" + newfecha.getMinutes();
    }
  }, {
    key: "removeItem",
    value: function removeItem(item) {
      _logger.info(_self._fileName, 'removeItem()', item);

      return _storage.removeItem(item);
    }
  }, {
    key: "storeItem",
    value: function storeItem(item, value) {
      _logger.info(_self._fileName, 'storeItem()', {
        'item': item,
        'value': value
      });

      return _storage.setItem(item, value);
    }
  }, {
    key: "closeLocalforage",
    value: function closeLocalforage() {
      _logger.info(_self._fileName, "closeLocalforage()");

      return _storage.closeLocalforage();
    }
  }, {
    key: "initLocalForage",
    value: function initLocalForage(options) {
      _logger.info(_self._fileName, "initLocalForage()", options);

      return _storage.initLocalForage(options);
    }
  }, {
    key: "getBaseUrl",
    value: function getBaseUrl() {
      var getUrl = window.location;
      var path = getUrl.pathname.split('/');
      var pathForDirectives = "";

      for (var i = 0; i < path.length - 1; i++) {
        if (path[i] != "") {
          pathForDirectives = pathForDirectives + '/' + path[i];
        }
      }

      return getUrl.protocol + "//" + getUrl.host + "" + pathForDirectives + '/';
    } //****************************************************************
    //***********************    END HELPERS    **********************
    //****************************************************************

  }]);

  return Offline;
}(_events2.EventEmitter);

exports["default"] = Offline;
window.Offline = Offline;

},{"../src/richLogger":61,"./mapStorage":30,"./package":59,"./visits_offline":60,"events":62}],59:[function(require,module,exports){
module.exports={
  "name": "offline",
  "version": "1.0.0",
  "description": "",
  "main": "offline.js",
  "scripts": {
    "watch": "watchify -g [ babelify --presets [ @babel/preset-env ] ] offline.js -o ../src/offlineBundle.js",
    "build": "browserify -g [ babelify --presets [ @babel/preset-env ] ] offline.js -o ../src/offlineBundle.js",
    "dist": "browserify -g [ babelify --presets [ @babel/preset-env ] ] offline.js -o ../src/offlineBundle.js | uglifyjs ../src/offlineBundle.js -mc > ../dist/offlineBundle.$npm_package_version.min.js"
  },
  "author": "Vidro Software SL",
  "devDependencies": {
    "@babel/core": "^7.3.3",
    "@babel/preset-env": "^7.3.1",
    "babelify": "^10.0.0"
  },
  "license": "ISC",
  "dependencies": {
    "axios": "^0.19.0",
    "localforage": "^1.7.3"
  }
}

},{}],60:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _richLogger = _interopRequireDefault(require("../src/richLogger"));

var _mapStorage = _interopRequireDefault(require("./mapStorage"));

var _axios = _interopRequireDefault(require("axios"));

var _form_utils = _interopRequireDefault(require("../forms/form_utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _self = null,
    _version = '1.0.0',
    _events = null,
    _logger = null; //modules

var _storage = null;
var _formUtils = null; //form utils module
//offline layer for visit spots

var offlineVisitSpotsSource = null,
    offlineVisitSpotsLayer = null,
    map = null,
    visitedfeautures = [],
    geom_colors = {
  visited_spots_stroke_color: 'rgba(0, 0, 0, 0.99)',
  visited_spots_fill_color: 'rgba(0, 0, 0, 0.0)',
  visited_spots_shape: 'square',
  visited_spot_radius: 12
};

var VisitsOffline =
/*#__PURE__*/
function () {
  function VisitsOffline(options, events, logger) {
    _classCallCheck(this, VisitsOffline);

    if (typeof options === 'undefined') {
      throw new TypeError('no data');
    }

    if (typeof options.baseHref === 'undefined') {
      throw new TypeError('no options baseHref');
    }

    if (typeof events === 'undefined') {
      throw new TypeError('no events');
    }

    _events = events;

    if (typeof logger === 'undefined') {
      throw new TypeError('no logger');
    }

    _logger = logger;

    if (typeof options.storage === 'undefined') {
      _storage = new _mapStorage["default"](options, _events, _logger);
    } else {
      _storage = options.storage;
    }

    _self = this;
    _self._fileName = 'visits_offline.js';
    _self.options = options;
    _formUtils = new _form_utils["default"](_self.options, events, _logger);

    _logger.info(_self._fileName, "Module loaded v.".concat(_version), options);
  }

  _createClass(VisitsOffline, [{
    key: "getOfflineVisits",
    value: function getOfflineVisits(project_id) {
      _logger.info(_self._fileName, "getOfflineVisits(".concat(project_id, ")"));

      try {
        var ofVisits = _storage.getItem("bmaps_".concat(project_id, "_visits"));

        if (ofVisits) {
          return JSON.parse(ofVisits);
        } else {
          return [];
        }
      } catch (e) {
        _logger.error(_self._fileName, 'getOfflineVisits', e);

        return [];
      }
    }
    /**
      storeVisitedSpot
        stores a visited spot
         @param project_id <int>
        @param geomString <string> geom string
      **/

  }, {
    key: "storeVisitedSpot",
    value: function storeVisitedSpot(project_id, geomString) {
      _logger.info(_self._fileName, "storeVisitedSpot(".concat(project_id, ")"), geomString);

      if (geomString) {
        if (_self.options.visited_spots_layer) {
          if (typeof ol == "undefined" || !ol) return false;

          var ofVisits_spots = _self.getVisitedSpots(project_id);

          if (ofVisits_spots) {
            var coordinates = null,
                format = new ol.format.WKT({}),
                geom2Hightlight = format.readGeometry(geomString, {
              dataProjection: _self.options.epsg,
              featureProjection: _self.options.epsg
            });

            if (geom2Hightlight.getType() === "Point" || geom2Hightlight.getType() === "point") {} //check this with linestring and polygons!!!


            coordinates = geom2Hightlight.getCoordinates();
            ofVisits_spots.push(coordinates); //add feauture to map

            _self._renderFeauture(coordinates);
          } else {
            ofVisits_spots = [data];
          }

          _storage.setItem("bmaps_".concat(project_id, "_visited_spots"), JSON.stringify(ofVisits_spots));
        }
      }
    }
    /**
      getVisitedSpots
        returns visited spots array
         @param project_id <int>
        @returns <array>
     **/

  }, {
    key: "getVisitedSpots",
    value: function getVisitedSpots(project_id) {
      _logger.info(_self._fileName, "getVisitedSpots(".concat(project_id, ")"));

      try {
        if (_self.options.visited_spots_layer) {
          var ofVisits = _storage.getItem("bmaps_".concat(project_id, "_visited_spots"));

          if (ofVisits) {
            return JSON.parse(ofVisits);
          } else {
            return [];
          }
        } else {
          return [];
        }
      } catch (e) {
        _logger.error(_self._fileName, 'getVisitedSpots', e);

        return [];
      }
    }
    /**
      clearVisitedSpots
        clears visited spots
         @param project_id <int>
     **/

  }, {
    key: "clearVisitedSpots",
    value: function clearVisitedSpots() {
      _logger.info(_self._fileName, "clearVisitedSpots()");

      try {
        _storage.removeItem("bmaps_".concat(_self.options.project_id, "_visited_spots"));

        if (offlineVisitSpotsSource) {
          offlineVisitSpotsSource.clear();
        }
      } catch (e) {
        _logger.error(_self._fileName, 'clearVisitedSpots', e);

        return false;
      }
    }
    /**
      renderVisitedSpotsLayer
        creates a vector layer and vector source for display visited spots feautures
         @param options <JSON>
                  map:  ol.Map instance
         @returns <boolean>
     **/

  }, {
    key: "renderVisitedSpotsLayer",
    value: function renderVisitedSpotsLayer(options) {
      _logger.info(_self._fileName, "renderVisitedSpotsLayer()", options);

      try {
        if (_self.options.visited_spots_layer) {
          if (!ol) return false;
          map = options.map;

          if (typeof options.geom_colors.visited_spots_stroke_color != "undefined" && options.geom_colors.visited_spots_stroke_color != '') {
            geom_colors.visited_spots_stroke_color = options.geom_colors.visited_spots_stroke_color;
          }

          if (typeof options.geom_colors.visited_spots_fill_color != "undefined" && options.geom_colors.visited_spots_fill_color != '') {
            geom_colors.visited_spots_fill_color = options.geom_colors.visited_spots_fill_color;
          }

          if (typeof options.geom_colors.visited_spots_shape != "undefined" && options.geom_colors.visited_spots_shape != '') {
            geom_colors.visited_spots_shape = options.geom_colors.visited_spots_shape;
          }

          if (typeof options.geom_colors.visited_spot_radius != "undefined" && options.geom_colors.visited_spot_radius != '') {
            geom_colors.visited_spot_radius = options.geom_colors.visited_spot_radius;
          }

          if (typeof map != "undefined" && ol) {
            offlineVisitSpotsSource = new ol.source.Vector({});
            offlineVisitSpotsLayer = new ol.layer.Vector({
              source: offlineVisitSpotsSource
            });
            map.addLayer(offlineVisitSpotsLayer); //render offline spots

            _self._renderOfflineVisitSpots();

            return true;
          } else {
            return false;
          }
        } else {
          return false;
        }
      } catch (e) {
        _logger.error(_self._fileName, "renderVisitedSpotsLayer()", e);
      }
    }
    /**
      _renderOfflineVisitSpots
        renders offline visited spots
     **/

  }, {
    key: "_renderOfflineVisitSpots",
    value: function _renderOfflineVisitSpots() {
      _logger.info(_self._fileName, "_renderOfflineVisitSpots()");

      if (_self.options.visited_spots_layer) {
        if (offlineVisitSpotsSource) {
          offlineVisitSpotsSource.clear();
        }

        var ofVisits_spots = _self.getVisitedSpots(_self.options.project_id);

        if (ofVisits_spots) {
          for (var i = 0; i < ofVisits_spots.length; i++) {
            _self._renderFeauture(ofVisits_spots[i]);
          }
        }
      }
    }
    /**
      _renderFeauture
        adds a feauture to vector source of visited spots
         @param coordinates <array> x,y
         @returns <boolean>
     **/

  }, {
    key: "_renderFeauture",
    value: function _renderFeauture(coordinates) {
      _logger.info(_self._fileName, '_renderFeauture() coordinates()', {
        'coordinates': coordinates
      });

      try {
        if (_self.options.visited_spots_layer) {
          if (typeof ol == "undefined" || !ol) return false;
          var newFeature = new ol.Feature(),
              featureGeom = null;

          if (geom_colors.visited_spots_shape === "square") {
            featureGeom = new ol.style.RegularShape({
              fill: new ol.style.Fill({
                color: geom_colors.visited_spots_fill_color
              }),
              stroke: new ol.style.Stroke({
                color: geom_colors.visited_spots_stroke_color,
                width: 1
              }),
              points: 4,
              radius: geom_colors.visited_spot_radius,
              angle: Math.PI / 4
            });
          } else {
            featureGeom = new ol.style.Circle({
              radius: geom_colors.visited_spot_radius,
              fill: new ol.style.Fill({
                color: geom_colors.visited_spots_fill_color
              }),
              stroke: new ol.style.Stroke({
                color: geom_colors.visited_spots_stroke_color,
                width: 1
              })
            });
          }

          newFeature.setStyle(new ol.style.Style({
            image: featureGeom
          }));
          newFeature.setGeometry(new ol.geom.Point(coordinates));

          if (offlineVisitSpotsSource) {
            offlineVisitSpotsSource.addFeature(newFeature);
          }
        }

        return true;
      } catch (e) {
        _logger.error(_self._fileName, '_renderFeauture()', e);

        return false;
      }
    }
    /**
      toggleVisitedSpots
        displays/hides visited spots layer
     **/

  }, {
    key: "toggleVisitedSpots",
    value: function toggleVisitedSpots(options) {
      return new Promise(function (resolve, reject) {
        if (offlineVisitSpotsLayer) {
          _logger.info(_self._fileName, 'toggleVisitedSpots', {
            'displayed': offlineVisitSpotsLayer.getVisible()
          });

          if (offlineVisitSpotsLayer.getVisible()) {
            offlineVisitSpotsLayer.setVisible(false);
            resolve(false);
          } else {
            offlineVisitSpotsLayer.setVisible(true);
            resolve(true);
          }
        } else {
          _logger.info(_self._fileName, 'toggleVisitedSpots', options);

          _self.renderVisitedSpotsLayer(options);

          resolve(true);
        }
      });
    }
  }, {
    key: "clearOfflineVisits",
    value: function clearOfflineVisits(data) {
      _logger.info(_self._fileName, 'clearOfflineVisits', data);

      return new Promise(function (resolve, reject) {
        try {
          _storage.removeItem("bmaps_".concat(data.project_id, "_visits")); //clear photos


          _self._ClearProjectPhotos(data.project_id);

          resolve();
        } catch (e) {
          _logger.error(_self._fileName, 'clearOfflineVisits', e);

          reject(e);
        }
      });
    }
  }, {
    key: "storeOfflineVisit",
    value: function storeOfflineVisit(project_id, data) {
      _logger.info(_self._fileName, "storeOfflineVisit(".concat(project_id, ")"), data);

      var ofVisits = _self.getOfflineVisits(project_id);

      if (ofVisits) {
        ofVisits.push(data);

        if (_self.options.visited_spots_layer && typeof data.selectedGeomString != "undefined") {
          //add feauture to map and store on visited spots layers
          _self.storeVisitedSpot(project_id, data.selectedGeomString);
        }
      } else {
        ofVisits = [data];
      }

      _storage.setItem("bmaps_".concat(project_id, "_visits"), JSON.stringify(ofVisits));
    }
  }, {
    key: "dumpOfflineVisits",
    value: function dumpOfflineVisits(data) {
      _logger.info(_self._fileName, 'dumpOfflineVisits', data);

      return new Promise(function (resolve, reject) {
        try {
          _self.options.project_id = data.project_id;

          var ofVisits = _self.getOfflineVisits(_self.options.project_id);

          if (ofVisits.length > 0) {
            if (ofVisits[0].type === 'data') {
              _self._insertNextVisit(ofVisits[0]);
            } else {
              _self._uploadPhoto(ofVisits[0]);
            }
          } else {
            _events.emit("offlineEvent", "dumpData", {
              "text": "no visits to dump"
            });
          }

          resolve();
        } catch (e) {
          _logger.error(_self._fileName, 'dumpOfflineVisits', e);

          reject(e);
        }
      });
    }
  }, {
    key: "_insertNextVisit",
    value: function _insertNextVisit(data) {
      _logger.info(_self._fileName, '_insertNextVisit', data);

      if (data.type === 'file') {
        _self._uploadPhoto(data);
      } else {
        _events.emit("offlineEvent", "dumpData", {
          "text": "InsertNextVisit"
        });

        data.dataToSend.token = _self.options.token;

        _axios["default"].post(_self.options.baseHref + '/ajax.sewernet.php', data.dataToSend).then(function (response) {
          _logger.success(_self._fileName, '_insertNextVisit response', response.data.message);

          if (response.data.status === "Accepted") {
            _self._updatePhotosVisitId(data.pol_id, data.id_name, response.data.message.body.feature.id);

            _self._udpateVisitIdAndRemoveVisit(data.pol_id, data.id_name, response.data.message.body.feature.id);
          } else {
            _logger.error(_self._fileName, '_insertNextVisit error', response.data.message);

            _events.emit("offlineEvent", "dumpData", {
              "text": "UploadVisitsError"
            });
          }
        })["catch"](function (error) {
          _logger.error(_self._fileName, '_insertNextVisit error', error);

          _events.emit("offlineEvent", "dumpData", {
            "text": "UploadVisitsError"
          });
        });
      }
    }
  }, {
    key: "_udpateVisitIdAndRemoveVisit",
    value: function _udpateVisitIdAndRemoveVisit(pol_id, id_name, visit_id) {
      _logger.info(_self._fileName, '_udpateVisitIdAndRemoveVisit', {
        'pol_id': pol_id,
        'id_name': id_name,
        'visit_id': visit_id
      });

      var ofVisits = _self.getOfflineVisits(_self.options.project_id); //remove first element


      ofVisits.shift();

      if (ofVisits.length > 0) {
        var _loop = function _loop(i) {
          if (ofVisits[i].pol_id == pol_id && ofVisits[i].id_name == id_name) {
            ofVisits[i].dataToSend.id = visit_id;

            _storage.setItem("bmaps_".concat(_self.options.project_id, "_visits"), JSON.stringify(ofVisits)); //reredend offline visited spots with updated data


            _self._renderOfflineVisitSpots();

            setTimeout(function () {
              _self._insertNextVisit(ofVisits[i]);
            }, 500);
            return "break";
          } else {
            _storage.setItem("bmaps_".concat(_self.options.project_id, "_visits"), JSON.stringify(ofVisits));

            setTimeout(function () {
              _self._insertNextVisit(ofVisits[i]);
            }, 500);
          }
        };

        for (var i = 0; i < ofVisits.length; i++) {
          var _ret = _loop(i);

          if (_ret === "break") break;
        }
      } else {
        _events.emit("offlineEvent", "dumpData", {
          "text": "UploadVisitsDone"
        }); //clear visited spots


        _self.clearVisitedSpots(); //clear project photos


        _self._ClearProjectPhotos(_self.options.project_id);

        _storage.setItem("bmaps_".concat(_self.options.project_id, "_visits"), JSON.stringify(ofVisits));
      }
    } //****************************************************************
    //***********************       PHOTOS      **********************
    //****************************************************************

    /*
      saveVisitPicture
        stores locally a photo
         @param data {JSON}
        @param preview {binary}
        @param fileName {string}
         @return {promise}
    */

  }, {
    key: "saveVisitPicture",
    value: function saveVisitPicture(data, preview, fileName) {
      _logger.info(_self._fileName, 'saveVisitPicture', {
        'pol_id': data.pol_id,
        'id_name': data.id_name,
        'fileName': fileName
      });

      return new Promise(function (resolve, reject) {
        var temporalPhotoId = _self._addPhotoId();

        var photos = _self._getPhotos(_self.options.project_id);

        var newElement = {
          'photo_id': temporalPhotoId,
          'pol_id': data.pol_id,
          'id_name': data.id_name,
          'visit_id': null,
          'hash': null
        };
        photos.push(newElement);

        _storage.setItem("bmaps_".concat(_self.options.project_id, "_photos"), JSON.stringify(photos));

        var returnData = {
          'status': "Accepted",
          'message': newElement,
          'code': 200
        };

        var compressedData = _storage.compress(preview);

        _storage.setTile("photo_".concat(temporalPhotoId), compressedData).then(function () {
          _logger.success(_self._fileName, "Photo photo_".concat(temporalPhotoId, " successfully stored localForage"));

          _self.storeOfflineVisit(_self.options.project_id, {
            'pol_id': data.pol_id,
            'id_name': data.id_name,
            'tableName': data.tableName,
            'dataToSend': data,
            'type': 'file',
            'temporalId': temporalPhotoId,
            'fileName': fileName
          });

          resolve("Photo photo_".concat(temporalPhotoId, " successfully stored localForage"));
        })["catch"](function (e) {
          _logger.error(_self._fileName, "Photo photo_".concat(temporalPhotoId, " error storing localForage"), e);

          reject(e);
        });
      });
    }
    /*
      _uploadPhoto
        upload locally stored photo
         @param data {JSON}
         @return {promise}
    */

  }, {
    key: "_uploadPhoto",
    value: function _uploadPhoto(data) {
      _logger.info(_self._fileName, '_uploadPhoto()', data);

      return new Promise(function (resolve, reject) {
        var photo = _self._getPhoto(data.temporalId);

        if (photo.hash != null) {
          //foto already uploaded
          var photosToSend = _formUtils.formatPhotoData(data.fileName, photo.hash, data.dataToSend.id, JSON.parse(data.dataToSend.deviceTrace));

          data.dataToSend.photos = JSON.stringify([photosToSend]);
          data.type = 'data';

          _self._insertNextVisit(data);

          resolve(photo.hash);
          return;
        } //1. Upload photo


        _storage.getTile("photo_".concat(data.temporalId)).then(function (binary) {
          if (binary === null) {
            _logger.error(_self._fileName, '_uploadPhoto() error, couldn\'t read photo data', binary);

            reject("Foto data is empty");
            return false;
          }

          var data2send = new FormData();
          data2send.append('what', "UPLOAD_PHOTO");
          data2send.append('token', _self.options.token);
          data2send.append('file', binary);

          _axios["default"].post(_self.options.baseHref + '/ajax.addPhoto.php', data2send).then(function (response) {
            _logger.success(_self._fileName, '_uploadPhoto response', response.data.message);

            if (response.data.status === "Accepted") {
              //2. Delete local photo
              _self._removePhoto("".concat(data.temporalId)).then(function () {
                //3. update local foto dara with online hash (in case dump fails we'll need it)
                _self._updateOfflinePhoto(data.temporalId, response.data.message.photo_id); //4. create visit with file


                var photosToSend = _formUtils.formatPhotoData(data.fileName, response.data.message.photo_id, data.dataToSend.id, JSON.parse(data.dataToSend.deviceTrace));

                data.dataToSend.photos = JSON.stringify([photosToSend]);
                data.type = 'data';

                _self._insertNextVisit(data);

                resolve(response.data.message);
              })["catch"](function (e) {
                reject(e);
              });
            } else {
              _logger.error(_self._fileName, '_uploadPhoto error', response.data.message);

              reject(response.data.message);
            }
          })["catch"](function (error) {
            _logger.error(_self._fileName, '_uploadPhoto error', error);

            reject(e);
          });
        })["catch"](function (e) {
          _logger.error(_self._fileName, '_uploadPhoto error getting stored image', e);

          reject(e);
        });
      });
    }
  }, {
    key: "_updateOfflinePhoto",
    value: function _updateOfflinePhoto(photo_id, hash) {
      _logger.info(_self._fileName, "_updateOfflinePhoto()", {
        'photo_id': photo_id,
        'hash': hash
      });

      var photos_list = JSON.parse(_storage.getItem("bmaps_".concat(_self.options.project_id, "_photos")));

      if (photos_list != null) {
        for (var i = 0; i < photos_list.length; i++) {
          if (photos_list[i].photo_id === photo_id) {
            photos_list[i].hash = hash;
            break;
          }
        }

        _storage.setItem("bmaps_".concat(_self.options.project_id, "_photos"), JSON.stringify(photos_list));
      }
    }
  }, {
    key: "_getPhotos",
    value: function _getPhotos(project_id) {
      _logger.info(_self._fileName, "_getPhotos(".concat(project_id, ")"));

      var photos_list = JSON.parse(_storage.getItem("bmaps_".concat(_self.options.project_id, "_photos")));

      if (photos_list === null) {
        photos_list = Array();
      }

      return photos_list;
    }
  }, {
    key: "_getPhoto",
    value: function _getPhoto(photo_id) {
      var photos_list = JSON.parse(_storage.getItem("bmaps_".concat(_self.options.project_id, "_photos")));

      if (photos_list != null) {
        for (var i = 0; i < photos_list.length; i++) {
          if (photos_list[i].photo_id === photo_id) {
            return photos_list[i];
          }
        }
      }
    }
  }, {
    key: "_addPhotoId",
    value: function _addPhotoId() {
      _logger.info(_self._fileName, '_addPhotoId()');

      var id = _self._getPhotoId();

      if (id === null) {
        id = 1;
      } else {
        id = id + 1;
      }

      _storage.setItem('bmaps_photo_id', parseInt(id));

      return id;
    }
  }, {
    key: "_getPhotoId",
    value: function _getPhotoId() {
      _logger.info(_self._fileName, '_getPhotoId()');

      var id = _storage.getItem('bmaps_photo_id');

      if (id === null) {
        _logger.info(_self._fileName, '_getPhotoId() not id stored()');

        _storage.setItem('bmaps_photo_id', 1);

        return 0;
      } else {
        _logger.info(_self._fileName, "_getPhotoId() last id stored ".concat(id));

        return parseInt(id);
      }
    }
  }, {
    key: "_ClearProjectPhotos",
    value: function _ClearProjectPhotos(project_id) {
      _logger.info(_self._fileName, "_ClearPhotos".concat(project_id));

      var ofPhotos = _self._getPhotos(project_id);

      for (var i = 0; i < ofPhotos.length; i++) {
        _self._removePhoto(ofPhotos[i].photo_id);
      }
    }
  }, {
    key: "_removePhoto",
    value: function _removePhoto(photo_id) {
      _logger.info(_self._fileName, '_removePhoto', {
        'photo_id': photo_id
      });

      return new Promise(function (resolve, reject) {
        _storage.removeTile("photo_" + photo_id).then(function () {
          _logger.success(_self._fileName, "removed photo_".concat(photo_id, " from localForage")); //remove photo from list


          var currentPhotos = _self._getPhotos(_self.options.project_id);

          for (var i = 0; i < currentPhotos.length; i++) {
            if ("photo_".concat(currentPhotos[i].photo_id) === photo_id) {
              currentPhotos.splice(i, 1);
            }
          }

          _storage.setItem("bmaps_".concat(_self.options.project_id, "_photos"), JSON.stringify(currentPhotos));

          resolve();
        })["catch"](function (e) {
          _logger.error(_self._fileName, "Photo photo_".concat(photo_id, " error removing from localForage"), e);

          reject();
        });
      });
    }
  }, {
    key: "_updatePhotosVisitId",
    value: function _updatePhotosVisitId(pol_id, id_name, visit_id) {
      _logger.info(_self._fileName, '_updatePhotosVisitId', {
        'pol_id': pol_id,
        'id_name': id_name,
        'visit_id': visit_id
      });

      var ofPhotos = _self._getPhotos(_self.options.project_id);

      if (ofPhotos.length > 0) {
        for (var i = 0; i < ofPhotos.length; i++) {
          if (ofPhotos[i].pol_id == pol_id && ofPhotos[i].id_name == id_name) {
            ofPhotos[i].visit_id = visit_id;
          }
        }

        _storage.setItem("bmaps_".concat(_self.options.project_id, "_photos"), JSON.stringify(ofPhotos));
      }
    } //****************************************************************
    //*********************     END PHOTOS      **********************
    //****************************************************************

  }, {
    key: "storeDownloadDate",
    value: function storeDownloadDate() {
      _logger.info(_self._fileName, 'storeDownloadDate', {});

      _storage.setItem("bmaps_".concat(_self.options.project_id, "_lastDownload"), new Date().addHours(_self.options.off_download_data_ttl).toString());
    }
    /*
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
    
     */

    /*function checkPreviousVisit(element_id,layer){
      log("checkPreviousVisit("+element_id+","+layer+")","info")
      var visits 			= mapStorage.getItem(storeName+'_visits');
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
    }*/
    //******************    end checkPreviousVisit  ******************

    /*	function setEventId(id){
        log("setEventId("+id+")","info");
        _storage.setItem(`bmaps_${_options.project_id}_ov_${response.table}`,JSON.stringify(res));
        mapStorage.setItem(storeName+'_event_id',parseInt(id));
      }
    
      function getEventId(){
        log("getEventId()","info");
        var id = mapStorage.getItem(storeName+'_event_id');
        if(id===null){
          log("getEventId() not id stored","info");
          mapStorage.setItem(storeName+'_event_id',1);
          return 0;
        }else{
          log("getEventId() last id stored: "+id,"info");
          return parseInt(id);
        }
      }*/

  }]);

  return VisitsOffline;
}();

exports["default"] = VisitsOffline;

Date.prototype.addHours = function (h) {
  this.setHours(this.getHours() + h);
  return this;
};

},{"../forms/form_utils":1,"../src/richLogger":61,"./mapStorage":30,"axios":31}],61:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* jshint esversion: 6 */

/* eslint-disable no-undef*/

/* eslint-disable no-restricted-globals*/
var RichLogger =
/*#__PURE__*/
function () {
  function RichLogger(env, options) {
    _classCallCheck(this, RichLogger);

    this._version = '2.0.1';
    this._options = {}; // colors

    this._warnColor = '#f57d00';
    this._infoColor = '#6574f7';
    this._successColor = '#07cb03';

    if (typeof env === 'undefined') {
      env = 'prod';
    }

    if (typeof options !== 'undefined') {
      this._options = options;
    }

    if (typeof this._options.baseHref !== 'undefined') {
      this._baseHref = _options.baseHref;
    } else {
      this._baseHref = null;
    }

    if (typeof this._options.token !== 'undefined') {
      this._token = _options.token;
    } else {
      this._token = null;
    } // colors


    if (typeof this._options.infoColor !== 'undefined') {
      this._infoColor = _options.infoColor;
    }

    if (typeof this._options.warnColor !== 'undefined') {
      this._warnColor = _options.warnColor;
    }

    if (typeof this._options.successColor !== 'undefined') {
      this._successColor = _options.successColor;
    }

    this._env = env;

    if (this._env === 'dev') {
      console.info("%cRichLogger.js: loaded v. ".concat(this._version), "color: ".concat(this._infoColor, ";"));
    }
  }

  _createClass(RichLogger, [{
    key: "info",
    value: function info(module, msg, optionalArg) {
      if (this._env === 'dev') {
        if (typeof optionalArg === 'undefined') {
          console.info("%c".concat(module, ": ").concat(msg), "color: ".concat(this._infoColor, ";"));
        } else {
          console.info("%c".concat(module, ": ").concat(msg), "color: ".concat(this._infoColor, ";"), optionalArg);
        }
      }
    }
  }, {
    key: "log",
    value: function log(moduleName, msg, extradata) {
      if (this._env === 'dev') {
        if (typeof extradata !== 'undefined') {
          console.log("".concat(moduleName, ": ").concat(msg), extradata);
        } else {
          console.log("".concat(moduleName, ": ").concat(msg));
        }
      }
    }
  }, {
    key: "warn",
    value: function warn(module, msg, optionalArg) {
      if (this._env === 'dev') {
        if (typeof optionalArg === 'undefined') {
          console.warn("%c".concat(module, ": ").concat(msg), "color: ".concat(this._warnColor, ";"));
        } else {
          console.warn("%c".concat(module, ": ").concat(msg), "color: ".concat(this._warnColor, ";"), optionalArg);
        }
      }
    }
  }, {
    key: "success",
    value: function success(module, msg, optionalArg) {
      if (this._env === 'dev') {
        if (typeof optionalArg === 'undefined') {
          console.log("%c".concat(module, ": ").concat(msg), "color: ".concat(this._successColor, ";font-weight: bold;"));
        } else {
          console.log("%c".concat(module, ": ").concat(msg), "color: ".concat(this._successColor, ";font-weight: bold;"), optionalArg);
        }
      }
    }
  }, {
    key: "error",
    value: function error(module, msg, optionalArg) {
      if (this._env === 'dev') {
        if (typeof optionalArg === 'undefined') {
          console.error(module, msg);
        } else {
          console.error(module, msg, optionalArg);
        }
      }
    }
  }]);

  return RichLogger;
}();

exports["default"] = RichLogger;

},{}],62:[function(require,module,exports){
"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}

module.exports = EventEmitter; // Backwards-compat with node 0.10.x

EventEmitter.EventEmitter = EventEmitter;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined; // By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.

EventEmitter.defaultMaxListeners = 10; // Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.

EventEmitter.prototype.setMaxListeners = function (n) {
  if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function (type) {
  var er, handler, len, args, i, listeners;
  if (!this._events) this._events = {}; // If there is no 'error' event listener then throw.

  if (type === 'error') {
    if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
      er = arguments[1];

      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];
  if (isUndefined(handler)) return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;

      case 2:
        handler.call(this, arguments[1]);
        break;

      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower

      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;

    for (i = 0; i < len; i++) {
      listeners[i].apply(this, args);
    }
  }

  return true;
};

EventEmitter.prototype.addListener = function (type, listener) {
  var m;
  if (!isFunction(listener)) throw TypeError('listener must be a function');
  if (!this._events) this._events = {}; // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".

  if (this._events.newListener) this.emit('newListener', type, isFunction(listener.listener) ? listener.listener : listener);
  if (!this._events[type]) // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;else if (isObject(this._events[type])) // If we've already got an array, just append.
    this._events[type].push(listener);else // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener]; // Check for listener leak

  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' + 'leak detected. %d listeners added. ' + 'Use emitter.setMaxListeners() to increase limit.', this._events[type].length);

      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function (type, listener) {
  if (!isFunction(listener)) throw TypeError('listener must be a function');
  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);
  return this;
}; // emits a 'removeListener' event iff the listener was removed


EventEmitter.prototype.removeListener = function (type, listener) {
  var list, position, length, i;
  if (!isFunction(listener)) throw TypeError('listener must be a function');
  if (!this._events || !this._events[type]) return this;
  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener || isFunction(list.listener) && list.listener === listener) {
    delete this._events[type];
    if (this._events.removeListener) this.emit('removeListener', type, listener);
  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener || list[i].listener && list[i].listener === listener) {
        position = i;
        break;
      }
    }

    if (position < 0) return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener) this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function (type) {
  var key, listeners;
  if (!this._events) return this; // not listening for removeListener, no need to emit

  if (!this._events.removeListener) {
    if (arguments.length === 0) this._events = {};else if (this._events[type]) delete this._events[type];
    return this;
  } // emit removeListener for all listeners on all events


  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }

    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length) {
      this.removeListener(type, listeners[listeners.length - 1]);
    }
  }

  delete this._events[type];
  return this;
};

EventEmitter.prototype.listeners = function (type) {
  var ret;
  if (!this._events || !this._events[type]) ret = [];else if (isFunction(this._events[type])) ret = [this._events[type]];else ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function (type) {
  if (this._events) {
    var evlistener = this._events[type];
    if (isFunction(evlistener)) return 1;else if (evlistener) return evlistener.length;
  }

  return 0;
};

EventEmitter.listenerCount = function (emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return _typeof(arg) === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],63:[function(require,module,exports){
"use strict";

// shim for using process in browser
var process = module.exports = {}; // cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
  throw new Error('setTimeout has not been defined');
}

function defaultClearTimeout() {
  throw new Error('clearTimeout has not been defined');
}

(function () {
  try {
    if (typeof setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
    } else {
      cachedSetTimeout = defaultSetTimout;
    }
  } catch (e) {
    cachedSetTimeout = defaultSetTimout;
  }

  try {
    if (typeof clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
    } else {
      cachedClearTimeout = defaultClearTimeout;
    }
  } catch (e) {
    cachedClearTimeout = defaultClearTimeout;
  }
})();

function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fun, 0);
  } // if setTimeout wasn't available but was latter defined


  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}

function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    //normal enviroments in sane situations
    return clearTimeout(marker);
  } // if clearTimeout wasn't available but was latter defined


  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
      return cachedClearTimeout.call(null, marker);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
      // Some versions of I.E. have different rules for clearTimeout vs setTimeout
      return cachedClearTimeout.call(this, marker);
    }
  }
}

var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
  if (!draining || !currentQueue) {
    return;
  }

  draining = false;

  if (currentQueue.length) {
    queue = currentQueue.concat(queue);
  } else {
    queueIndex = -1;
  }

  if (queue.length) {
    drainQueue();
  }
}

function drainQueue() {
  if (draining) {
    return;
  }

  var timeout = runTimeout(cleanUpNextTick);
  draining = true;
  var len = queue.length;

  while (len) {
    currentQueue = queue;
    queue = [];

    while (++queueIndex < len) {
      if (currentQueue) {
        currentQueue[queueIndex].run();
      }
    }

    queueIndex = -1;
    len = queue.length;
  }

  currentQueue = null;
  draining = false;
  runClearTimeout(timeout);
}

process.nextTick = function (fun) {
  var args = new Array(arguments.length - 1);

  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }
  }

  queue.push(new Item(fun, args));

  if (queue.length === 1 && !draining) {
    runTimeout(drainQueue);
  }
}; // v8 likes predictible objects


function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}

Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) {
  return [];
};

process.binding = function (name) {
  throw new Error('process.binding is not supported');
};

process.cwd = function () {
  return '/';
};

process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};

process.umask = function () {
  return 0;
};

},{}]},{},[2]);
