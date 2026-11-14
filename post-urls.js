window.PublicationURLs={
 normalize(value){let s=String(value||'');try{s=decodeURIComponent(s)}catch{}return s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu,'-').replace(/^-|-$/g,'')},
 postLink(p){const slug=this.normalize(p.slug||p.title);return slug?'/news/'+encodeURIComponent(slug):'/?post='+encodeURIComponent(p.id)},
 slugFromLocation(loc){const match=loc.pathname.match(/^\/news\/([^/]+)\/?$/);if(match){try{return decodeURIComponent(match[1])}catch{return '\uFFFD'}}return new URLSearchParams(loc.search).get('slug')}
};
