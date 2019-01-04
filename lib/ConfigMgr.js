const mkdirp = require('mkdirp');
const path = require('path');

const ConfigMgr = class {
  constructor (options) {
    const instance = this.constructor.instance;
    if (instance) {
        return instance;
    }

    this.constructor.instance = this;

    options = options || {};
    options.base_route = options.base_route || '/'; 
    options.base_url = options.base_url || '/'; 
    options.upload_dir = options.upload_dir || path.join(options.data_dir, 'upload') + path.sep;
    options.cache_dir = options.cache_dir || path.join(options.data_dir, 'cache') + path.sep;

    this.options = options;

    mkdirp.sync(options.upload_dir);
    mkdirp.sync(options.cache_dir);

    this.instance = this;
  }

  getConfig (name, ext) {
    if (ext) {
      return this.options[name] + ext;
    }
    return this.options[name];
  }
}

module.exports = ConfigMgr;
