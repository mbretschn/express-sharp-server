const EventEmitter = require('events');

EventEmitter.defaultMaxListeners = 1000;

const CacheMgr = class {
    constructor (cluster) {
        if (cluster !== undefined) {
            this.ifCluster(cluster);
        } else {
            this.ifSingle();
        }
    }

    ifCluster (cluster) {
        this.isCluster = true;

        if (cluster.isMaster) {            
            let reserved = new Map();
            let locked = new Map();
            console.log(`server ${process.pid} up`);

            cluster.on('listening', worker => {
                console.log(`worker ${worker.process.pid} up`);

                worker.on('message', message => {
                    let cmd = message.cmd;
                    let cid = message.cid;
                    let uid = message.uid;

                    if (cmd === 'acquire') {
                        if (!reserved.has(cid)) {
                            reserved.set(cid, uid);
                            worker.send({ cmd: 'reserved', cid: cid, uid: uid });
                        } 
                        else {
                            let locks = locked.get(cid) || [];
                            locks.push(uid);
                            locked.set(cid, locks);
                        }
                    } 

                    if (cmd === 'release') {
                        locked.has(cid) && locked.get(cid).forEach(uid => {
                            for (const ind in cluster.workers) {                                
                                cluster.workers[ind].send({ cmd: 'released', cid: cid, uid: uid });
                            }
                        });

                        reserved.delete(cid);         
                        locked.delete(cid);
                    }
                });
            });
        }
    }

    ifSingle () {
        this.isCluster = false;

        let reserved = new Map();
        let locked = new Map();
        
        console.log(`server ${process.pid} up`);

        this.emitter = new EventEmitter();

        this.emitter.on('message', message => {
            let cmd = message.cmd;
            let cid = message.cid;
            let uid = message.uid;

            if (cmd === 'acquire') {
                if (!reserved.has(cid)) {
                    reserved.set(cid, uid);
                    this.send({ cmd: 'reserved', cid: cid, uid: uid });
                } 
                else {
                    let locks = locked.get(cid) || [];
                    locks.push(uid);
                    locked.set(cid, locks);
                }
            } 

            if (cmd === 'release') {
                locked.has(cid) && locked.get(cid).forEach(uid => {
                    this.send({ cmd: 'released', cid: cid, uid: uid });
                });   
                reserved.delete(cid);         
                locked.delete(cid);
            }

        });
    }

    send (message) {
        if (this.isCluster) {
            process.send(message);
        } else {
            this.emitter.emit('message', message);
        }
    }

    listen (cb) {
        if (this.isCluster) {
            process.on('message', cb);
        } else {
            this.emitter.on('message', cb);
        }
    }

    release (cid, uid) {
        this.send({ cmd: 'release', cid: cid, uid: uid });
    }

    acquire (cid, uid) {
        return new Promise(resolve => {
            this.listen(msg => {
                if (msg.cid === cid && msg.uid === uid) {
                    if (msg.cmd === 'reserved') {                    
                        resolve({ cmd: 'reserved', cid: cid, uid: uid });
                    }
    
                    if (msg.cmd === 'released') {
                        resolve({ cmd: 'released', cid: cid, uid: uid });
                    }
                }
            });
    
            this.send({ cmd: 'acquire', cid: cid, uid: uid });
        });
    }
}

module.exports = CacheMgr;