# express-sharp-server

[![Build Status](https://travis-ci.org/3epnm/express-sharp-server.svg?branch=master)](https://travis-ci.org/3epnm/express-sharp-server) [![Coverage Status](https://coveralls.io/repos/github/3epnm/express-sharp-server/badge.svg?branch=master)](https://coveralls.io/github/3epnm/express-sharp-server?branch=master)

express-sharp-server is a middleware that offers a restful image server based on [node-sharp](https://github.com/lovell/sharp).

```sh
npm install express-sharp-server
```

express-sharp-server is an evolving express middleware to implement an easy-to-use image server, with a focus on extraction of image parts. The goal is to provide all prominent functions of the node-sharp library in a express middleware.

### Server

```javascript
const express = require('express');
const image = require('express-sharp-server');

const server = express();

// express-sharp-server expects at least a data folder 
// where the image data can be stored.

server.use(image({
    data_dir: '/data/'
}));

server.listen(8080);
```

express-sharp-server supports running in a node cluster enviroment, which improves the performance considerably. See [cluster](docs/cluster.md).

### Options

The following options can be set:

| Parameter 	| Description    	    |
|-----------	|-----------        |
| base_route  	| The base_route is used to configure the endpoint, where the middleware listen. Defaults to ```'/'```. |
| base_url  	| The base_url is a prefix for the image urls generated in the json responce ```_links.self.href``` useful if the server is behind a proxy. Defaults to ```'/'```. 	            |
| data_dir      | The data_dir is used to save the upload and cache files. If upload_dir is not set, ```data_dir + '/upload/'``` is created for uploads, If cache_dir is not set, ```data_dir + '/cache/'``` is used. Mandatory, if upload_dir or cache_dir is not set.               |
| upload_dir 	| The directory where the image uploads to be saved. Optional. |
| cache_dir 	| The directory where the image cache to be saved. Optional.   |
| logger 	    | A instance to winston logger. Optional.                |

### Basic Usage

First of all, images can be uploaded.

```sh
curl -F "Document=@elefants.jpg" http://localhost:8080
```

In addition, it is possible to reference an image from another server by sending a image url:

```json
{
    "_links": {
        "origin": {
            "href": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Elefantes_Gustavo_Gerdel.jpg"
        }
    }
}
```

```sh
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{ "_links": { "origin": { "href": "https://upload.wikimedia.org/wikipedia/commons/d/d7/Elefantes_Gustavo_Gerdel.jpg" } } }' \
  http://localhost:8080/
```

In any case, the server responds with the following payload in json.

```json
{
    "metadata": {
        "width": 1200,
        "height": 800,
        "channels": 3,
        "density": 300,
        "mimetype": "image/jpeg",
        "format": "jpeg"
    },
    "created": {
        "datetime": "2019-01-04T23:45:30.873Z"
    },
    "_links": {
        "self": {
            "href": "/0c97f820639ecbbbba0255ceb7a5f962"
        }
    }
}
```

The image is now stored on the server and can now be retrieved via the url specified as ``` _links.self.href ``` 

```sh
curl http://localhost:8080/0c97f820639ecbbbba0255ceb7a5f962
```

The underlying information on the server can be queried if in addition an "Accept: application/json" header is sent.

```sh
curl --header "Accept: application/json" \
    http://localhost:8080/0c97f820639ecbbbba0255ceb7a5f962
```

It is possible to store userdata to an image resource, see [userdata](docs/userdata.md).

### Features

The following parameter can be mixed.

| Parameter 	| Comment    	|
|-----------	|-----------    |
| width  	    | The width of the image, The aspect ratio is retained if no height parameter is present.	        |
| height  	    | The height of the image, The aspect ratio is retained if no width parameter is present.  	        |
| polygon 	    | Can be used to extract a partion of the image. If the Polygon is not recangular, the oferlapping parts of the source image are masked with a uniform color.           |
| rotation 	    | Rotation of the extracted image.           |
| grayscale 	| Remove color from the image. 	        |

See [examples](docs/examples.md) for more information.

### Todos

The [node-sharp](https://github.com/lovell/sharp) library has far more features, this middleware currently offers. In the future, more of its functionality will be implemented in express-sharp-server. 

The Caching functionality, even if it supports worker, ist very simple and need to be improved in future.

Finally, there is no method to remove a image resource, or list all available resources. This is the next functionality to implement.

### Tests

To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

### Licensing

Copyright 2019 Marcel Bretschneider.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
You may obtain a copy of the License at [https://www.apache.org/licenses/LICENSE-2.0](https://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
