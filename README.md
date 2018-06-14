# ipst-http

## Install
```shell
npm install ipst-http
```

## Example
``` javascript
import http from 'ipst-http';
const params = {
    id:1
}
http.$get('http://github.com',params).then(res => {
    //do something...
});
```