const path = require('path');
const express = require('express');
const ImgSrv = require('../index');

const options = {
  base_route: '/',
  base_url: '/',
  upload_dir: path.join(__dirname, 'data', 'uploads') + path.sep,
  cache_dir: path.join(__dirname, 'data', 'cache') + path.sep
}

const app = express();
app.use(ImgSrv(options));
app.listen(61235);

module.exports = app;