import fs from 'node:fs';import {deflateSync} from 'node:zlib';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {performance} from 'node:perf_hooks';import {ImageMagick,MagickFormat,MagickColors} from '@imagemagick/magick-wasm';
import {initialize,processPhoto} from './processor.mjs';
await initialize(fs.readFileSync(fileURLToPath(import.meta.resolve('@imagemagick/magick-wasm/magick.wasm'))));
const source=fs.readFileSync(new URL('../../images/comuni/castellabate-card.jpg',import.meta.url));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');const originalHash=hash(source);
const start=performance.now();const cpu=process.cpuUsage();const result=processPhoto(source,'image/jpeg');
const usage=process.cpuUsage(cpu);
assert.equal(hash(source),originalHash);assert.ok(result.width<=1600&&result.height<=1600);
ImageMagick.read(result.bytes,img=>{assert.equal(img.format,MagickFormat.WebP);assert.equal(img.profileNames.length,0);assert.ok(Math.abs(img.width/img.height-result.original.width/result.original.height)<0.002);});
for(const format of [MagickFormat.Png,MagickFormat.WebP]){
 const input=ImageMagick.read(source,img=>img.write(format,b=>new Uint8Array(b)));
 const mime=format===MagickFormat.Png?'image/png':'image/webp';assert.ok(processPhoto(input,mime).bytes.length);
}
assert.throws(()=>processPhoto(source,'image/png'),/mime_mismatch/);
assert.throws(()=>processPhoto(new TextEncoder().encode('<svg/>'),'image/png'),/unsupported/);
assert.throws(()=>processPhoto(source.slice(0,20),'image/jpeg'));
assert.throws(()=>processPhoto(new Uint8Array(5242881),'image/jpeg'),/file_size/);
const withMetadata=ImageMagick.read(source,img=>{img.setAttribute('comment','PRIVATE-TEST-METADATA');return img.write(MagickFormat.Jpeg,b=>new Uint8Array(b));});
const clean=processPhoto(withMetadata,'image/jpeg');assert.ok(!Buffer.from(clean.bytes).includes(Buffer.from('PRIVATE-TEST-METADATA')));
function chunk(type,data){const body=Buffer.concat([Buffer.from(type),data]);let crc=0xffffffff;for(const x of body){crc^=x;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}const size=Buffer.alloc(4),tail=Buffer.alloc(4);size.writeUInt32BE(data.length);tail.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([size,body,tail]);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(64,0);ihdr.writeUInt32BE(32,4);ihdr[8]=8;ihdr[9]=6;
const transparent=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(Buffer.alloc((64*4+1)*32))),chunk('IEND',Buffer.alloc(0))]);
const alpha=processPhoto(transparent,'image/png');ImageMagick.read(alpha.bytes,img=>assert.equal(img.hasAlpha,true));
assert.equal(alpha.width,64);assert.equal(alpha.height,32);
console.log(JSON.stringify({result:'PASS',checks:['JPEG/PNG/WebP decoded','original unchanged','aspect ratio preserved','metadata removed','bad MIME rejected','SVG rejected','corrupt file rejected','oversize rejected','transparency retained','small images not enlarged'],inputBytes:source.length,outputBytes:result.bytes.length,width:result.width,height:result.height,wallMs:Math.round(performance.now()-start),firstPhotoCpuMs:Math.round((usage.user+usage.system)/1000),peakRssMB:Math.round(process.resourceUsage().maxRSS/1024)}));
