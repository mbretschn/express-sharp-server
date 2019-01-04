const sharp = require('sharp');
const path = require('path');

let fingerprint = function (image, callback) {
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

let fingerprints = [
    { 
        'file': path.join(__dirname, 'elefants.jpg'),
        'name': 'origin'
    },
    { 
        'file': path.join(__dirname, 'elefants-rect-norotate.jpg'),
        'name': 'norotate',
        'query': 'polygon=[{x:421,y:264},{x:755,y:264},{x:755,y:453},{x:421,y:453}]&rotation=0'
    },
    { 
        'file': path.join(__dirname, 'elefants-rect-rotate.jpg'),
        'name': 'rotation',
        'query': 'polygon=[{x:348,y:447},{x:505,y:599},{x:380,y:727},{x:224,y:576}]&rotation=315.94'
    },
    { 
        'file': path.join(__dirname, 'elefants-polygon.jpg'),
        'name': 'polygon',
        'query': 'polygon=[{x:467,y:631},{x:490,y:612},{x:514,y:612},{x:541,y:594},{x:549,y:563},{x:576,y:532},{x:612,y:513},{x:647,y:506},{x:696,y:522},{x:728,y:550},{x:741,y:584},{x:739,y:603},{x:782,y:610},{x:766,y:635},{x:725,y:647},{x:704,y:652},{x:697,y:679},{x:657,y:688},{x:633,y:675},{x:571,y:653},{x:545,y:648},{x:508,y:635}]'
    },
    {
        'file': path.join(__dirname, 'elefants-width.jpg'),
        'name': 'width',
        'query': 'width=400'
    },
    {
        'file': path.join(__dirname, 'elefants-height.jpg'),
        'name': 'height',
        'query': 'height=200'
    },
    {
        'file': path.join(__dirname, 'elefants-widthheight.jpg'),
        'name': 'widthheight',
        'query': 'width=400&height=200'
    }
];

module.exports = {
    fingerprint: fingerprint,
    fingerprints: fingerprints
}