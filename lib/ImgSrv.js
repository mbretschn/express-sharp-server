const express = require('express');
const ConfigMgr = require('./ConfigMgr.js');
const CacheMgr = require('./CacheMgr.js');
const lib = require('./ImgSrvLib.js');

const multer = require('multer');

module.exports = (options) => {
    options.CacheMgr = options.CacheMgr || new CacheMgr();

    const config = new ConfigMgr(options);

    const upload = multer({
        dest: config.getConfig('upload_dir')
    });
    
    const router = express.Router();
    router.use(express.json());
    
    router.post(config.getConfig('base_route'), upload.single('Document'), lib.postImage);
    router.put(config.getConfig('base_route', ':guid'), lib.putImage);
    router.get(config.getConfig('base_route', ':guid'), lib.getImage);
    
    return router;
};
