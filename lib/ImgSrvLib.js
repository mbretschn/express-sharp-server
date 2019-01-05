const sharp = require('sharp');
const fs = require('fs');
const request = require('request');
const jsonfile = require('jsonfile');
const crypto = require('crypto');
const uuidv4 = require('uuid/v4');
const ImageMgr = require('./ImageMgr.js');
const ConfigMgr = require('./ConfigMgr.js');

const createJson = async (stream) => {
    return new Promise((resolve, reject) => {
        stream
            .metadata()
            .then(metadata => {
                const datetime = (new Date(Date.now())).toISOString();

                const obj = {
                    "metadata": {
                        "width": metadata.width,
                        "height": metadata.height,
                        "channels": metadata.channels,
                        "density": metadata.density,
                        "size": metadata.size,
                        "mimetype": 'image/' + metadata.format,
                        "format": metadata.format
                    },
                    "created": {
                        "datetime": datetime
                    }
                };

                resolve(obj);
            })
            .catch(err => reject(err));
    });
}

const sendFile = function (res, path, mimeType, format) {
    format = format && '.' + format || '';

    if (mimeType === 'application/json') {
        res.sendFile(path + '.json', {
            headers: {
                'content-type': mimeType
            }
        });
    } else {
        res.sendFile(path + format, {
            headers: {
                'content-type': mimeType
            }
        });
    }
}

const execImage = async (req, res, params, cid, mimeType, json) => {
    const config = new ConfigMgr();
    const src_path = config.getConfig('upload_dir', req.params.guid);  
    const href = config.getConfig('base_url', req.params.guid);  
    const cache_dir = config.getConfig('cache_dir');
    const logger = config.getConfig('logger');

    let query = [];
    params.forEach((v, k) => v !== undefined && query.push(`${k}=${v}`));
    query = query.join('&');

    let image = new ImageMgr();    
    let stream = image.execute(params, json.metadata, fs.createReadStream(src_path));

    logger && logger.log({
        level: 'info',
        message: `start execImage ${query}` 
    });

    if (mimeType === json.metadata.mimetype) {
        res.setHeader('content-type', mimeType);
        let out = stream.clone();
        out.on('end', () => {
            res.end();

            logger && logger.log({
                level: 'info',
                message: `send execImage ${query}` 
            });
        });
        out.pipe(res);
    }

    let dest_path = cache_dir + cid;
    let fil = stream.clone();

    await fil.toFile(dest_path);

    logger && logger.log({
        level: 'info',
        message: `create cache execImage ${query}` 
    });

    let obj = await createJson(sharp(dest_path));

    obj._links = {
        "self": {
            "href": href + '?' + query
        },
        "source": {
            "href": href
        }
    }

    if (json.userdata) {
        obj.userdata = json.userdata;
    }

    await jsonfile.writeFile(cache_dir + cid + '.json', obj)

    logger && logger.log({
        level: 'info',
        message: `create metadata execImage ${query}` 
    });

    if (mimeType === 'application/json') {
        res.sendFile(cache_dir + cid + '.json', {
            headers: {
                'content-type': mimeType
            }
        });
    }

    return;
}

const getImage = async (req, res, next) => {
    const config = new ConfigMgr();
    const path = config.getConfig('upload_dir', req.params.guid);
    const cache_dir = config.getConfig('cache_dir');
    const logger = config.getConfig('logger');

    try {
        var json = jsonfile.readFileSync(path + '.json');
    } catch (ex) {
        res.status(404).send('Not found');
        return;
    }

    try {
        let mimeType = json.metadata.mimetype;
        if (req.accepts('application/json') && !req.accepts(mimeType)) {
            mimeType = 'application/json';
        }

        let params = new Map(), paramsAr = [], paramsObj = { guid: req.params.guid };

        params.set('polygon', req.query.polygon);
        params.set('rectangle', req.query.rectangle);
        params.set('rotation', req.query.rotation && Number(req.query.rotation));
        params.set('width', req.query.width && parseInt(req.query.width));
        params.set('height', req.query.height && parseInt(req.query.height));
        params.set('grayscale', req.query.toGrayscale || req.query.grayscale);

        params.forEach((v, k) => {
            paramsAr.push(v);
            paramsObj[k] = v;            
        });
        
        let hasParams = paramsAr.some(val => val !== undefined);

        if (!hasParams) {
            sendFile(res, path, mimeType);
            return;
        }
        
        let hash = JSON.stringify(paramsObj);
        let cid = req.params.guid + '-' + crypto.createHash('md5').update(hash).digest("hex");

        if (fs.existsSync(cache_dir + cid)) {
            sendFile(res, cache_dir + cid, mimeType);
            return;
        } 

        let uid = uuidv4(), cacheMgr = config.getConfig('CacheMgr');
        cacheMgr
            .acquire(cid, uid)
            .then(async (msg) => {
                if (msg.uid === uid && msg.cid === cid) {
                    logger && logger.log({
                        level: 'info',
                        message: `cacheMgr ${msg.cmd}, ${msg.cid}, ${msg.uid}` 
                    });
                    
                    if (msg.cmd === 'reserved') {                            
                        await execImage(req, res, params, cid, mimeType, json);
                        cacheMgr.release(cid, uid);
                    }

                    if (msg.cmd === 'released') {
                        sendFile(res, cache_dir + cid, mimeType);
                    }
                }
            });
    }
    catch (err) {
        next(err);
    }
}

const postImageUpload = async (req, res, next) => {
    const config = new ConfigMgr();
    const path = config.getConfig('upload_dir', req.file.filename);
    const href = config.getConfig('base_url', req.file.filename);
    const logger = config.getConfig('logger');

    logger && logger.log({
        level: 'info',
        message: `new Image ${req.file.filename} received.`
    });

    try {
        let obj = await createJson(sharp(path));

        obj._links = {
            "self": {
                "href": href
            }
        };
    
        await jsonfile.writeFile(path + '.json', obj);

        logger && logger.log({
            level: 'info',
            message: `new Image Metadata ${req.file.filename}.json created.`
        });

        res.sendFile(path + '.json', {
            headers: {
                'content-type': 'application/json'
            }
        });
    } catch (err) {
        console.log(err);
        next(err);
    }
}

const postImageJson = async (req, res, next) => {
    const config = new ConfigMgr();
    const href = config.getConfig('base_url');
    const logger = config.getConfig('logger');
    const origin = req.body._links.origin.href;
    const json = req.body;

    logger && logger.log({
        level: 'info',
        message: `new Image ${origin} received.`
    });

    let transform = sharp();
    let stream = request(origin)
        .pipe(transform);
    
    let toJSON = stream.clone();
    let toFile = stream.clone();

    return new Promise((result, reject) => {
        crypto.pseudoRandomBytes(16, async function (err, raw) {
            if (err) {
                console.log(err);
                next(err);
                return reject(err);
            } 

            try {
                const uid = raw.toString('hex');
                const path = config.getConfig('upload_dir', uid);
    
                toFile.toFile(path);
    
                let obj = await createJson(toJSON);

                obj._links = {
                    "origin": {
                        href: req.body._links.origin.href
                    },
                    "self": {
                        "href": href + uid
                    }
                };
                
                if (json.userdata) {
                    obj.userdata = json.userdata;
                }
    
                await jsonfile.writeFile(path + '.json', obj);
    
                logger && logger.log({
                    level: 'info',
                    message: `new Image Metadata ${uid}.json created.`
                });
    
                res.sendFile(path + '.json', {
                    headers: {
                        'content-type': 'application/json'
                    }
                });
            } catch (err) {
                console.log(err);
                next(err);
                return reject(err);
            }
        });
    });
}

const postImage = async (req, res, next) => {
    if (req.file !== undefined) {
        return await postImageUpload(req, res, next);
    } else {
        return await postImageJson(req, res, next);
    }
}

const putImage = async (req, res, next) => {
    const config = new ConfigMgr();
    const path = config.getConfig('upload_dir', req.params.guid);
    
    try {
        var obj = jsonfile.readFileSync(path + '.json');
        
        if (req.body.userdata) {
            obj.userdata = req.body.userdata;
        }
        
        await jsonfile.writeFile(path + '.json', obj);
        
        res.sendFile(path + '.json', {
            headers: {
                'content-type': 'application/json'
            }
        });

    } catch (ex) {
        res.status(404).send('Not found');
        return;
    }
}

module.exports = {
    getImage,
    postImage,
    putImage
}