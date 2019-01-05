# express-sharp-server 

### Clustered Enviroment

It is possible to use the middleware in a clustered enviroment, where a number of express servers are started. express-sharp-server middleware can be used in a clustered enviroment. However, the caching mechanism needs to be prepared for this purpose, because a asynchronous cache creation can leed into race conditions. To deal with this, the Caching funtionality must started in the master as well as in the worker scope. 

### Server

```javascript
const cluster = require('cluster');
const express = require('express');
const ImgSrv = require('express-sharp-server');
const CacheMgr = require('express-sharp-server/lib/CacheMgr');

const numCPUs = 4;

if (cluster.isMaster) {
  
  // start the Cache Manager so that clustering is 
  // initialized for caching
  new CacheMgr(cluster);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} 
else {
  const server = express();

  server.use(ImgSrv({
    data_dir: '/data/'
  }));

  server.listen(8080);
}
```
