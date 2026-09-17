export async function addFiles(files,items){
 for(const file of files){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('Usa immagini JPG, PNG o WebP entro 5 MB.');}
 return [...items,...Array.from(files).map(file=>({id:crypto.randomUUID(),kind:'gallery',order:items.length,caption:'',alt:file.name.replace(/\.[^.]+$/,''),blob:file,source:''}))];
}
export function mediaUrl(item){return item.blob?URL.createObjectURL(item.blob):new URL('../../'+item.source,import.meta.url).href;}
export const release=urls=>urls.forEach(url=>{if(url.startsWith('blob:'))URL.revokeObjectURL(url);});
