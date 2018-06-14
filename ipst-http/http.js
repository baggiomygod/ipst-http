'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('whatwg-fetch');

require('isomorphic-fetch');

var _util = require('./util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Http = function () {
  function Http() {
    var isMock = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
    var chain = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function (data) {
      return data;
    };

    var _this = this;

    var headers = arguments[2];
    var errorHandler = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function (err) {
      console.error(err);
    };

    _classCallCheck(this, Http);

    _util2.default.DateInt();
    this.isMock = isMock;
    this.chain = chain;
    this.headers = Object.assign({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }, headers);
    this.errorHandler = errorHandler;

    ['get', 'post', 'put', 'delete', 'download'].forEach(function (v) {
      _this['$' + v] = function (url, params, headers, timeout) {
        return _this.restful.call(_this, url, params, v, headers, timeout);
      };
    });
  }

  _createClass(Http, [{
    key: 'getParam',
    value: function getParam(params) {
      var result = '';
      for (var item in params) {
        if (params[item]) {
          result += item + '=' + params[item] + '&';
        }
      }
      result = result.substring(0, result.lastIndexOf('&'));
      if (result) {
        result = '?' + result;
      }
      return result;
    }
  }, {
    key: 'serialize',
    value: function serialize(params) {
      var result = '';
      for (var name in params) {
        if (params[name]) {
          result += name + '=' + params[name] + '&';
        }
      }
      result = result.slice(0, -1);
      return result;
    }

    // fetch

  }, {
    key: 'send',
    value: function send(url, config, timeout) {
      var _c = Object.assign({}, config);
      _c.method = _c.method === 'download' ? 'post' : _c.method;
      var fetchTimeout = timeout || 500000;
      return Promise.race([fetch(url, _c), new Promise(function (resolve, reject) {
        setTimeout(function () {
          return reject(new Error('request timeout'));
        }, fetchTimeout);
      })]).then(function (res) {
        if (res.status >= 400) return res;
        // 文件流形式下载
        if (config.method === 'download') {
          if (res.headers.get('content-type') != 'multipart/form-data;charset=UTF-8') {
            return res.json();
          } else {
            return res.blob();
          }
        } else {
          return res.json();
        }
      }).then(this.chain).catch(function (err) {
        console('request timeout');
      });
    }
  }, {
    key: 'restful',
    value: function restful(url, params, method) {
      var headers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      var timeout = arguments[4];

      var config = {
        method: method,
        credentials: 'include',
        headers: Object.assign({}, this.headers, headers)
      };

      if (method == 'get' && params) {
        url = url + this.getParam(params);
      } else if (config.headers['Content-Type'] === 'application/x-www-form-urlencoded' && params) {
        if (typeof params === 'string') {
          config['body'] = params;
        } else if (params.toString() === '[object Object]') {
          config['body'] = this.serialize(params);
        }
      } else {
        var replacer = function replacer(key, val) {
          return val === undefined ? null : val;
        };

        if (method == 'get') {
          replacer = null;
        }
        config['body'] = JSON.stringify(params, replacer);
      }

      return this.send(url, config, timeout);
    }
  }]);

  return Http;
}();

exports.default = Http;