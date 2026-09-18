export async function validatePhoto(file){
 if(!(file instanceof Blob)||!['image/jpeg','image/png','image/webp'].includes(file.type)||!file.size||file.size>5*1024*1024)throw Error('Usa immagini JPG, PNG o WebP entro 5 MB.');
 const bitmap=await createImageBitmap(file).catch(()=>{throw Error('Questa immagine non è leggibile. Scegli un altro file.');});
 const valid=bitmap.width>0&&bitmap.height>0&&bitmap.width*bitmap.height<=40000000;bitmap.close();
 if(!valid)throw Error('La foto è troppo grande. Usa un’immagine entro 40 megapixel.');
}
export async function addFiles(files,items){
 if(items.length+files.length>40)throw Error('Puoi inserire fino a 40 immagini.');
 for(const file of files)await validatePhoto(file);
 return [...items,...Array.from(files).map((file,index)=>({id:crypto.randomUUID(),kind:items.length===0&&file===files[0]?'cover':'gallery',order:items.length+index,focalX:50,focalY:50,caption:'',alt:file.name.replace(/\.[^.]+$/,''),blob:file,source:''}))];
}
export function mediaUrl(item){if(item.remoteUrl){const u=new URL(item.remoteUrl);if(u.origin!=='https://qgkwqzjapvjvzmvdfges.supabase.co'||!u.pathname.startsWith('/storage/v1/object/sign/'))throw Error('Immagine non disponibile.');return u.href;}return item.blob?URL.createObjectURL(item.blob):new URL('../../'+item.source,import.meta.url).href;}
export const release=urls=>urls.forEach(url=>{if(url.startsWith('blob:'))URL.revokeObjectURL(url);});
