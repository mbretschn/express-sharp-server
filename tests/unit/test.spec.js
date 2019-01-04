process.env.NODE_ENV = 'test';

const express = require('express');
const ImgSrv = require('../../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
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
    let href = '';
    let payload;

    before(function (done) {
        mkdirp.sync(path.join(__dirname, '..', 'data', 'uploads'));
        mkdirp.sync(path.join(__dirname, '..', 'data', 'cache'));

        let cnt = 7;
        for (var i=0; i<fingerprints.length; i++) {
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

    it('POST image origin', function (done) {
        payload = {
            "_links": {
                "origin": {
                    "href": "http://localhost:61235" + href
                }
            },
            "userdata": {
                "license": {
                    "label": "CC BY-SA 4.0",
                    "href": "https://creativecommons.org/licenses/by-sa/4.0",
                    "attribution": "Ggerdel at Wikimedia Commons"
                }
            }
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
                res.body.userdata.license.should.have.property('label').eql(payload.userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(payload.userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(payload.userdata.license.attribution);  

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
                res.body.userdata.license.should.have.property('label').eql(payload.userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(payload.userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(payload.userdata.license.attribution);  
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
                res.body.should.have.property('metadata');
                res.body.metadata.should.have.property('width').eql(334);
                res.body.metadata.should.have.property('height').eql(189);
                res.body.should.have.property('userdata');
                res.body.userdata.should.have.property('license');
                res.body.userdata.license.should.have.property('label').eql(payload.userdata.license.label);
                res.body.userdata.license.should.have.property('href').eql(payload.userdata.license.href);
                res.body.userdata.license.should.have.property('attribution').eql(payload.userdata.license.attribution);  
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
});