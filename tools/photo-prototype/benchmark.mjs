import fs from 'node:fs';import {fileURLToPath} from 'node:url';import {ImageMagick,MagickFormat,MagickGeometry} from '@imagemagick/magick-wasm';import {initialize,processPhoto} from './processor.mjs';
await initialize(fs.readFileSync(fileURLToPath(import.meta.resolve('@imagemagick/magick-wasm/magick.wasm'))));
const source=fs.readFileSync(new URL('../../images/comuni/castellabate-card.jpg',import.meta.url));
for(const side of [2000,2100]){
 const input=ImageMagick.read(source,img=>{const g=new MagickGeometry(side,side);g.ignoreAspectRatio=true;img.resize(g);return img.write(MagickFormat.Jpeg,b=>new Uint8Array(b));});
 const cpu=process.cpuUsage();const start=performance.now();
 try{const out=processPhoto(input,'image/jpeg');const usage=process.cpuUsage(cpu);console.log(JSON.stringify({side,inputBytes:input.length,outputBytes:out.bytes.length,cpuMs:Math.round((usage.user+usage.system)/1000),wallMs:Math.round(performance.now()-start),peakRssMB:Math.round(process.resourceUsage().maxRSS/1024)}));}
 catch(e){console.log(JSON.stringify({side,rejected:e.message}));if(side===2000)process.exitCode=1;else if(e.message!=='pixel_limit')process.exitCode=1;}
}
