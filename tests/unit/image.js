process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

const should = chai.should();
chai.use(chaiHttp);

const fingerprint = function (image, callback) {
    sharp(image)
      .greyscale()
      .normalise()
      .resize(9, 8, { fit: sharp.fit.fill })
      .raw()
      .toBuffer(function (err, data) {
        if (err) {
          callback(err);
        } else {
          let fingerprint = '';
          for (let col = 0; col < 8; col++) {
            for (let row = 0; row < 8; row++) {
              const left = data[(row * 8) + col];
              const right = data[(row * 8) + col + 1];
              fingerprint = fingerprint + (left < right ? '1' : '0');
            }
          }
          callback(null, fingerprint);
        }
      });
  };
  

describe('Images', () => {
    let href = '';

    after(() => {
        rimraf(path.join(__dirname, '..', 'data'), (err, info) => {
            if (err) {
                console.error(err);
            } 
            done();
        });
    });

    it('POST image', (done) => {
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

    it('GET image data', (done) => {
        chai.request(server)
            .get(href)
            .end((err, res) => {
                res.should.have.status(200);

                fingerprint(res.body, (err, info) => {
                    chai.expect(info).to.equal('1100100011000100111101100011110100011001000011100010011101011011');
                    done();
                });
            });
    });

    it('GET image info', (done) => {
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
});