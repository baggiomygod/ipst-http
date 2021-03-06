import 'whatwg-fetch';
import 'isomorphic-fetch';
import Util from './util';

class Http {
  constructor(isMock = true,
    chain = data => { return data },
    headers,
    errorHandler = err => { 
      console.error(err); }
  ) {
    Util.DateInt();
    this.isMock = isMock;
    this.chain = chain;
    this.headers = Object.assign({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }, headers);
    this.errorHandler = errorHandler;

    ['get', 'post', 'put', 'delete', 'download'].forEach(v => {
      this[`$${v}`] = (url, params, headers, timeout) => {
        return this.restful.call(this, url, params, v, headers, timeout);
      }
    });
  }

  getParam (params) {
    let result = '';
    for (let item in params) {
      if (params[item]) {
        result += `${item}=${params[item]}&`;
      }
    }
    result = result.substring(0, result.lastIndexOf('&'));
    if (result) {
      result = `?${result}`;
    }
    return result;
  }

  serialize (params) {
    let result = '';
    for (let name in params) {
      if (params[name]) {
        result += `${name}=${params[name]}&`
      }
    }
    result = result.slice(0, -1);
    return result;
  }

  // fetch
  send (url, config, timeout) {
    let _c = Object.assign({}, config);
    _c.method = _c.method === 'download' ? 'post' : _c.method;
      let fetchTimeout = timeout || 500000
      return Promise.race([
        fetch(url, _c),
        new Promise(function (resolve, reject) {
          setTimeout(() => reject(new Error('request timeout')), fetchTimeout)
        })
      ]).then(
        (res) => {
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
        }
      ).then(this.chain).catch(err => {
        console('request timeout')
      });
  }

  restful (url, params, method, headers = {}, timeout) {
    const config = {
      method: method,
      credentials: 'include',
      headers: Object.assign({}, this.headers, headers)
    }

    if (method == 'get' && params) {
      url = url + this.getParam(params);
    } else if (config.headers['Content-Type'] === 'application/x-www-form-urlencoded' && params) {
      if (typeof params === 'string') {
        config['body'] = params;
      } else if (params.toString() === '[object Object]') {
        config['body'] = this.serialize(params);
      }
    } else {
      var replacer = function (key, val) {
        return val === undefined ? null : val;
      }

      if (method == 'get') {
        replacer = null
      }
      config['body'] = JSON.stringify(params, replacer);
    }

    return this.send(url, config, timeout);
  }
}

export default Http;
