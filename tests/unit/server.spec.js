process.env.NODE_ENV = 'test';

const express = require('express');
const ImgSrv = require('../../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const sinon = require('sinon');

const logger = sinon.fake();

const options = {
    base_route: '/',
    base_url: '/',
    upload_dir: path.join(__dirname, '..', 'data', 'uploads') + path.sep,
    cache_dir: path.join(__dirname, '..', 'data', 'cache') + path.sep,
    logger: { log: logger }
}

const server = express();
server.use(ImgSrv(options));
server.listen(61235);

const should = chai.should();
chai.use(chaiHttp);

let { fingerprints, fingerprint } = require('../fixtures');

describe('Image Resource', function () {
    let href = '', userdata = {
        "license": {
            "label": "CC BY-SA 4.0",
            "href": "https://creativecommons.org/licenses/by-sa/4.0",
            "attribution": "Ggerdel at Wikimedia Commons"
        }
    }

    before(function (done) {
        let cnt = fingerprints.length; 
        for (let i=0; i<fingerprints.length; i++) {
            (function (i) {
                fingerprint(fingerprints[i].file, (err, info) => {
                    fingerprints[i].chksum = info;
                    if (--cnt === 0) {
                        done();
                    }
                });
            })(i);
        }
    });

    after(function (done) {
        rimraf(path.join(__dirname, '..', 'data'), (err, info) => {
            done();
        });
    });

    it('POST image data', function (done) {
        chai.request(server)
            .post('/')
            .attach('Document', fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'elefants.jpg')), 'elefants.jpg')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(1200);
                res.body.metadata.should.have.property('height').eql(800);

                href = res.body._links.self.href;
                done();
            });
    });

    it('GET image data', function (done) {
        chai.request(server)
            .get(href)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal(fingerprints[0].chksum);
                    done();
                });
            });
    });

    it('GET image info', function (done) {
        chai.request(server)
            .get(href)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(1200);
                res.body.metadata.should.have.property('height').eql(800);
                done();
            });  
    });

    it('PUT image userdata', function (done) {
        chai.request(server)
            .put(href)
            .set('Content-Type', 'application/json')
            .send({ userdata: userdata })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  

                done();
            });
    });

    it('GET image userdata', function (done) {
        chai.request(server)
            .get(href)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  

                done();
            });  
    });

    it('POST image origin', function (done) {
        let payload = {
            "_links": {
                "origin": {
                    "href": "http://localhost:61235" + href
                }
            },
            "userdata": userdata
        };

        chai.request(server)
            .post('/')
            .set('Content-Type', 'application/json')
            .send(payload)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');

                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(1200);
                res.body.metadata.should.have.property('height').eql(800);

                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  

                href = res.body._links.self.href;
                done();
            });
    });

    it('GET image data by origin', function (done) {
        setTimeout(() => {
            chai.request(server)
                .get(href)
                .end((err, res) => {
                    res.should.have.status(200);

                    fingerprint(res.body, (err, info) => {
                        chai.expect(info).to.equal(fingerprints[0].chksum);
                        done();
                    });
                });
          }, 1000);
    });

    it('GET image info by origin', function (done) {
        chai.request(server)
            .get(href)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(1200);
                res.body.metadata.should.have.property('height').eql(800);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  
                done();
            });    
    });

    it('GET image extraction rectangle', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[1].query)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal(fingerprints[1].chksum);
                    done();
                });
            });
    });

    it('GET image extraction rectangle info', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[1].query)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('_links');
                res.body._links.should.have.property('self');
                res.body._links.self.should.have.property('href').eql(href + '?' + fingerprints[1].query);                
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(334);
                res.body.metadata.should.have.property('height').eql(189);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  
                done();
            });    
    });

    it('GET image extraction rotation', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[2].query)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal(fingerprints[2].chksum);
                    done();
                });
            });
    });

    it('GET image extraction rotation info', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[2].query)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('_links');
                res.body._links.should.have.property('self');
                res.body._links.self.should.have.property('href').eql(href + '?' + fingerprints[2].query);                
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(219);
                res.body.metadata.should.have.property('height').eql(179);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  
                done();
            });    
    });

    it('GET image extraction polygon', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[3].query)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal(fingerprints[3].chksum);
                    done();
                });
            });
    });

    it('GET image extraction polygon info', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[3].query)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('_links');
                res.body._links.should.have.property('self');
                res.body._links.self.should.have.property('href').eql(href + '?' + fingerprints[3].query);
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(315);
                res.body.metadata.should.have.property('height').eql(182);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  
                done();
            });    
    });

    it('GET image extraction polygon with rotation', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[12].query)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal(fingerprints[12].chksum);
                    done();
                });
            });
    });

    it('GET image extraction polygon width rotation info', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[12].query)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('_links');
                res.body._links.should.have.property('self');
                res.body._links.self.should.have.property('href').eql(href + '?' + fingerprints[12].query);
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(346);
                res.body.metadata.should.have.property('height').eql(244);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  
                done();
            });    
    });

    it('GET image width', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[4].query)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal(fingerprints[4].chksum);
                    done();
                });
            });
    });

    it('GET image width info', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[4].query)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('_links');
                res.body._links.should.have.property('self');
                res.body._links.self.should.have.property('href').eql(href + '?' + fingerprints[4].query);                
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(400);
                res.body.metadata.should.have.property('height').eql(267);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  
                done();
            });    
    });

    it('GET image height', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[5].query)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal(fingerprints[5].chksum);
                    done();
                });
            });
    });

    it('GET image height info', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[5].query)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('_links');
                res.body._links.should.have.property('self');
                res.body._links.self.should.have.property('href').eql(href + '?' + fingerprints[5].query);                
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(300);
                res.body.metadata.should.have.property('height').eql(200);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  
                done();
            });    
    });

    it('GET image width & height', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[6].query)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal(fingerprints[6].chksum);
                    done();
                });
            });
    });

    it('GET image width & height info', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[6].query)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('_links');
                res.body._links.should.have.property('self');
                res.body._links.self.should.have.property('href').eql(href + '?' + fingerprints[6].query);                
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(400);
                res.body.metadata.should.have.property('height').eql(200);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  
                done();
            });    
    });

    it('GET image extend top & left', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[7].query)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal(fingerprints[7].chksum);
                    done();
                });
            });
    });

    it('GET image top & left info', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[7].query)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('_links');
                res.body._links.should.have.property('self');
                res.body._links.self.should.have.property('href').eql(href + '?' + fingerprints[7].query);                
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(455);
                res.body.metadata.should.have.property('height').eql(474);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  
                done();
            });    
    });

    it('GET image extend top & left & rotation', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[8].query)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal(fingerprints[8].chksum);
                    done();
                });
            });
    });

    it('GET image extend top & left & rotation info', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[8].query)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('_links');
                res.body._links.should.have.property('self');
                res.body._links.self.should.have.property('href').eql(href + '?' + fingerprints[8].query);                
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(455);
                res.body.metadata.should.have.property('height').eql(474);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  
                done();
            });    
    });

    it('GET image extend bottom & right', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[9].query)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal(fingerprints[9].chksum);
                    done();
                });
            });
    });

    it('GET image extend bottom & right info', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[9].query)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('_links');
                res.body._links.should.have.property('self');
                res.body._links.self.should.have.property('href').eql(href + '?' + fingerprints[9].query);
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(455);
                res.body.metadata.should.have.property('height').eql(474);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  
                done();
            });    
    });

    it('GET image extend bottom & right & rotate', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[10].query)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal(fingerprints[10].chksum);
                    done();
                });
            });
    });

    it('GET image extend bottom & right & rotate info', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[10].query)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('_links');
                res.body._links.should.have.property('self');
                res.body._links.self.should.have.property('href').eql(href + '?' + fingerprints[10].query);
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(455);
                res.body.metadata.should.have.property('height').eql(474);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  
                done();
            });    
    });

    it('GET image width & grayscale', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[11].query)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal(fingerprints[11].chksum);
                    done();
                });
            });
    });

    it('GET image width & grayscale info', function (done) {
        chai.request(server)
            .get(href + '?' + fingerprints[11].query)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('_links');
                res.body._links.should.have.property('self');
                res.body._links.self.should.have.property('href').eql(href + '?' + fingerprints[11].query);
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(400);
                res.body.metadata.should.have.property('height').eql(267);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(userdata.license.attribution);  
                done();
            });    
    });

    it('GET non existing image', function (done) {
        chai.request(server)
            .get(href + '!?')
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });

    it('GET non existing image with query', function (done) {
        chai.request(server)
            .get(href + '!?' + fingerprints[11].query)
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });

    it('GET non existing image info', function (done) {
        chai.request(server)
            .get(href + '!?')
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });

    it('GET non existing image info with query', function (done) {
        chai.request(server)
            .get(href + '!?' + fingerprints[11].query)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });
});