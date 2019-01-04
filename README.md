# express-sharp-server

[![Build Status](https://travis-ci.org/3epnm/express-sharp-server.svg?branch=master)](https://travis-ci.org/3epnm/express-sharp-server) [![Coverage Status](https://coveralls.io/repos/github/3epnm/express-sharp-server/badge.svg?branch=master)](https://coveralls.io/github/3epnm/express-sharp-server?branch=master) [![Known Vulnerabilities](https://snyk.io/test/github/3epnm/express-sharp-server/badge.svg)](https://snyk.io/test/github/3epnm/express-sharp-server) 

express-sharp-server is a middleware that implements a restful image server based on node-sharp.

```sh
npm install express-sharp-server
```

express-sharp-server is an evolving express middleware to implement an easy-to-use image server, with a focus on extraction of image parts. The goal is to provide all prominent functions of the node-sharp library in a express middleware.

## Usage

```javascript
const express = require('express');
const image = require('express-sharp-server');

const server = express();

// express-sharp-server expects at least the indication of a data folder 
// where the image data can be stored.

server.use(image({
    data_dir: '/data/'
}));

server.listen(8080);
```

