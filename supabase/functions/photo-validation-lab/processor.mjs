import {ImageMagick,MagickImageInfo,MagickFormat,MagickGeometry,ResourceLimits,ConfigurationFiles,initializeImageMagick} from 'npm:@imagemagick/magick-wasm@0.0.43';
// Pilot only. The 40MP browser limit is NOT safe for a 256MB Edge worker.
export const limits=Object.freeze({bytes:5*1024*1024,pixels:4_000_000,side:1600});
export async function initialize(bytes){
 const config=ConfigurationFiles.default;
 config.policy.data=`<policymap><policy domain="delegate" rights="none" pattern="*"/><policy domain="coder" rights="none" pattern="*"/><policy domain="coder" rights="read|write" pattern="{JPEG,PNG,WEBP}"/><policy domain="path" rights="none" pattern="@*"/></policymap>`;
 await initializeImageMagick(bytes,config);
 ResourceLimits.memory=96n*1024n*1024n;ResourceLimits.disk=0n;ResourceLimits.maxMemoryRequest=96n*1024n*1024n;
 ResourceLimits.width=8000n;ResourceLimits.height=8000n;ResourceLimits.listLength=4n;
}
function detect(b){
 if(b[0]===255&&b[1]===216&&b[2]===255)return ['image/jpeg',MagickFormat.Jpeg];
 if([137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v))return ['image/png',MagickFormat.Png];
 if(new TextDecoder().decode(b.slice(0,4))==='RIFF'&&new TextDecoder().decode(b.slice(8,12))==='WEBP')return ['image/webp',MagickFormat.WebP];
 throw Error('unsupported_image');
}
export function processPhoto(bytes,declaredMime){
 if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>limits.bytes)throw Error('file_size');
 const [mime,format]=detect(bytes);if(mime!==declaredMime)throw Error('mime_mismatch');
 const info=MagickImageInfo.create(bytes);
 if(info.width*info.height>limits.pixels||info.width<1||info.height<1)throw Error('pixel_limit');
 return ImageMagick.readCollection(bytes,format,images=>{
  if(images.length!==1)throw Error('animated_image');
  const img=images[0];img.autoOrient();
  const original={width:img.width,height:img.height};
  const size=new MagickGeometry(limits.side,limits.side);size.greater=true;img.resize(size);
  img.strip();img.quality=82;
  const output=img.write(MagickFormat.WebP,b=>new Uint8Array(b));
  if(!output.length||output.length>limits.bytes)throw Error('output_size');
  return {bytes:output,mime:'image/webp',width:img.width,height:img.height,original};
 });
}
