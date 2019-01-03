const ConfigMgr = class {
  constructor (options) {
    const instance = this.constructor.instance;
    if (instance) {
        return instance;
    }

    this.constructor.instance = this;

    this.options = options;
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
