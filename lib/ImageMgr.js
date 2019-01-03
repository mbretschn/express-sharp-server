const math = require('mathjs');
const sharp = require('sharp');
const JSON5 = require('json5');
const _ = require('underscore');

const ImageMgr = class {
    execute (params, metadata, stream) {
        this.metadata = metadata;

        if (params.get('polygon')) {
            let polygon = JSON5.parse(params.get('polygon'));
            let rotation = params.get('rotation');
    
            if (this.isRectangle(polygon)) {
                stream = this.extractPolygonRect(polygon, rotation, stream);
            } else {
                stream = this.extractPolygon(polygon, rotation, stream);
            }
        }
    
        if (params.get('width') || params.get('height')) {
            let width = params.get('width');
            let height = params.get('height');
            stream = this.resize(width, height, stream);
        };
    
        if (params.get('grayscale') ) {
            stream = this.grayscale(stream);
        }
    
        return stream;
    }

    grayscale (stream) {
        let transform = sharp()
            .grayscale();
    
        return stream.pipe(transform);
    }

    resize (width, height, stream) {
        let t = {};
    
        if (width != undefined) { t.width = width; }
        if (height != undefined) { t.height = height; }
    
        let transform = sharp()
            .resize(t);
    
        return stream.pipe(transform);
    }   
    
    isRectangle (polygon) {
        let x0 = polygon[0].x;
        let x1 = polygon[1].x;
        let x2 = polygon[2].x;
        let x3 = polygon[3].x;
    
        let y0 = polygon[0].y;
        let y1 = polygon[1].y;
        let y2 = polygon[2].y;
        let y3 = polygon[3].y;
    
        let a = [x0 - x3, y0 - y3];
        let b = [x1 - x0, y1 - y0];
        let c = [x2 - x1, y2 - y1];
        let d = [x3 - x2, y3 - y2];
    
        let _a = math.hypot(a[0], a[1])
        let _b = math.hypot(b[0], b[1])
        let _c = math.hypot(c[0], c[1])
        let _d = math.hypot(d[0], d[1])
    
        let a1 = Math.round(math.acos(math.dot(a, b) / _a / _b) * 180 / Math.PI);
        let a2 = Math.round(math.acos(math.dot(b, c) / _b / _c) * 180 / Math.PI);
        let a3 = Math.round(math.acos(math.dot(c, d) / _c / _d) * 180 / Math.PI);
        let a4 = Math.round(math.acos(math.dot(d, a) / _d / _a) * 180 / Math.PI);
    
        return polygon.length === 4 && (a1 == a2) && (a3 == a4) && (a1 == a3);
    }
    
    targetDimensions (polygon) {
        let x0 = polygon[0].x;
        let x1 = polygon[1].x;
        let x2 = polygon[2].x;
    
        let y0 = polygon[0].y;
        let y1 = polygon[1].y;
        let y2 = polygon[2].y;
    
        return {
            w: Math.round(Math.hypot(x0 - x1, y0 - y1)),
            h: Math.round(Math.hypot(x1 - x2, y1 - y2))
        };
    }
    
    sourceDimensions (W, H, rotation) {
        let r = (Math.PI / 180) * rotation;
        let c = Math.cos(r);
        let s = Math.sin(r);
    
        let rot = math.matrix([[c, -s], [s, c]]);
    
        let W2 = W / 2;
        let H2 = H / 2;
    
        let coords = math.matrix([[-W2, W2, W2, -W2], [H2, H2, -H2, -H2]])
    
        let res = math.multiply(rot, coords);
    
        let X = res.subset(math.index(0, math.range(0, 4)));
        let Y = res.subset(math.index(1, math.range(0, 4)));
    
        return {
            w: Math.round(math.max(X) - math.min(X)),
            h: Math.round(math.max(Y) - math.min(Y))
        }
    }
    
    extractPolygonRect (polygon, rotation, stream) {
        let L = Math.min(...polygon.map(item => item.x));
        let T = Math.min(...polygon.map(item => item.y));
        let W = Math.max(...polygon.map(item => item.x)) - L;
        let H = Math.max(...polygon.map(item => item.y)) - T;

        let ext = {};

        if (T < 0) {
            ext.top = Math.abs(T);
            T = 0;
        }
        if (L < 0) {
            ext.left = Math.abs(L);
            L = 0;
        }

        if (W > this.metadata.width) {
            ext.right = W - this.metadata.width; 
        }
        if (H > this.metadata.height) {
            ext.bottom = H - this.metadata.height;
        }

        if (rotation) {
            if (!_.isEmpty(ext)) {
                ext = _.extend({
                    background: { r: 255, g: 255, b: 255, alpha: 1 },
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0
                }, ext);

                let transformInit = sharp()
                    .extend(ext);

                let transformIntermediate = sharp()
                    .extract({ left: L, top: T, width: W, height: H })
                    .rotate(Number(rotation));

                let sd = this.sourceDimensions(W, H, rotation)
                let td = this.targetDimensions(polygon);
            
                let l = Math.round((sd.w - td.w) / 2);
                let t = Math.round((sd.h - td.h) / 2);
                let w = td.w;
                let h = td.h;

                let transformExit = sharp()
                    .extract({ left: l, top: t, width: w, height: h });
        
                return stream.pipe(transformInit).pipe(transformIntermediate).pipe(transformExit);
            } 
            else {
                let transformInit = sharp()
                    .extract({ left: L, top: T, width: W, height: H })
                    .rotate(Number(rotation));

                let sd = this.sourceDimensions(W, H, rotation)
                let td = this.targetDimensions(polygon);
            
                let l = Math.round((sd.w - td.w) / 2);
                let t = Math.round((sd.h - td.h) / 2);
                let w = td.w;
                let h = td.h;

                let transformExit = sharp()
                    .extract({ left: l, top: t, width: w, height: h });
        
                return stream.pipe(transformInit).pipe(transformExit);
            }
        }
        else {
            if (!_.isEmpty(ext)) {
                ext = _.extend({
                    background: { r: 255, g: 255, b: 255, alpha: 1 },
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0
                }, ext);

                let transformInit = sharp()
                    .extend(ext);

                let transformExit = sharp()
                    .extract({ left: L, top: T, width: W, height: H })
                
                return stream.pipe(transformInit).pipe(transformExit);
            } 
            else {
                let transformExit = sharp()
                    .extract({ left: L, top: T, width: W, height: H });

                return stream.pipe(transformExit);
            }
        }
    }
    
    extractPolygon (polygon, rotation, stream) {
        let L = Math.min(...polygon.map(item => item.x));
        let T = Math.min(...polygon.map(item => item.y));
        let W = Math.max(...polygon.map(item => item.x)) - L;
        let H = Math.max(...polygon.map(item => item.y)) - T;
    
        const coords = polygon.map(coord => `${coord.x - L},${coord.y - T}`).join(' ');
        const buffer = Buffer.from(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><polygon points="${coords}"/></svg>`);
    
        let transform = sharp()
            .extract({ left: L, top: T, width: W, height: H })
            .overlayWith(buffer, { cutout: true });

        let transformFlatten = sharp()
            .flatten({ background: '#ffffff' });

        if (rotation) {
            let transformRotate = sharp()
                .rotate(rotation, { background: '#ffffff' });

            let transformTrim = sharp()
                .trim();

            return stream.pipe(transform).pipe(transformRotate).pipe(transformFlatten).pipe(transformTrim);
        } else {
            return stream.pipe(transform).pipe(transformFlatten);
        }
    }
}

module.exports = ImageMgr;