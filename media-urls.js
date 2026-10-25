/* Hostinger serves the original WordPress uploads; no image files are copied. */
window.resolveMediaURL=function(value){
 try{
  const u=new URL(value,location.origin);
  if(!['https:','http:'].includes(u.protocol))return value;
  const prefix='/wp-content/uploads/';
  if(['earlynews24.com','www.earlynews24.com'].includes(u.hostname)&&u.pathname.startsWith(prefix)){
   return 'https://media.earlynews24.com/'+u.pathname.slice(prefix.length)+u.search;
  }
  return value;
 }catch{return value}
};
