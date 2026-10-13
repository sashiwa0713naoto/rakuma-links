import fs from 'node:fs';
const cfg=JSON.parse(fs.readFileSync('products.json','utf8'));
const id=process.env.AFF_RAKUTEN_ICHIBA_ID?.trim();
if(!id || !/^[a-zA-Z0-9._-]+$/.test(id)) throw new Error('Rakuten affiliate ID is missing or invalid');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now=Date.now(), maxAge=24*60*60*1000;
const products=cfg.products.filter(p=>{
 const e=p.price_evidence;
 const age=now-Date.parse(e?.checked_at);
 return p.brand_evidence?.verified && p.seller_evidence?.verified && ['official','authorized'].includes(p.seller_evidence.relationship) && p.innovation_evidence?.verified && p.stock_evidence?.verified && p.stock_evidence.in_stock && e?.verified && e.same_variant && !e.includes_points && !e.includes_conditional_coupon && e.current_yen>0 && e.reference_yen>e.current_yen && (1-e.current_yen/e.reference_yen)*100>=20 && age>=0 && age<=maxAge && /^https:\/\/item\.rakuten\.co\.jp\/[^/]+\/[^/]+\/$/.test(p.target_url);
});
const cards=products.map(p=>{
 const target=new URL(p.target_url);
 const link=new URL('https://hb.afl.rakuten.co.jp/hgc/'+id+'/');
 link.searchParams.set('pc',target.href); link.searchParams.set('m',target.href);
 return '<article data-expires="'+(Date.parse(p.price_evidence.checked_at)+maxAge)+'"><span class="category">食品 · 公式店</span><h2>'+esc(p.title)+'</h2><p>'+esc(p.description)+'</p><p class="caution">'+esc(p.caution)+'</p><a href="'+esc(link.href)+'" target="_blank" rel="sponsored noopener noreferrer">楽天公式店で確認する ↗</a><p class="check">確認日：'+esc(p.price_evidence.checked_at.slice(0,10))+' · 未使用の商品仕様紹介</p></article>';
}).join('');
const html='<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>'+esc(cfg.title)+'</title><style>body{margin:0;background:#f5f6f8;color:#182033;font:16px/1.7 system-ui,sans-serif}main{max-width:620px;margin:auto;padding:40px 20px}h1{font-size:28px;line-height:1.4}h2{font-size:21px;line-height:1.5}.lead,.check{color:#556074}.pr{border:1px solid #ccd4e0;padding:14px;border-radius:12px;font-size:14px}article{background:white;border:1px solid #dce1e8;border-radius:20px;padding:24px;margin:24px 0}.category{font-size:12px;color:#2563eb;font-weight:700}.caution{font-size:14px;color:#556074}a{display:block;background:#1e3a8a;color:white;padding:14px;text-align:center;border-radius:12px;text-decoration:none;font-weight:700}.check{font-size:12px}.empty{padding:24px;background:white;border-radius:16px}footer{font-size:13px;color:#556074;margin-top:32px}</style></head><body><main><h1>'+esc(cfg.title)+'</h1><p class="lead">買う前に、仕様と自分に合う条件を確認。</p><p class="pr">【PR】このページには楽天アフィリエイトの広告リンクが含まれます。購入により運営者に報酬が発生する場合があります。価格・在庫・送料は購入先の最新表示をご確認ください。</p><section id="products">'+cards+'</section><p id="empty" class="empty"'+(products.length?' hidden':'')+'>現在、確認済みの商品を更新しています。</p><footer>掲載期限を過ぎた商品は非表示になります。実際の使用レビューではありません。</footer></main><script>function expire(){document.querySelectorAll("article[data-expires]").forEach(e=>{if(Date.now()>Number(e.dataset.expires))e.remove()});document.getElementById("empty").hidden=!!document.querySelector("article")}expire();setInterval(expire,60000);</script></body></html>';
fs.mkdirSync('site',{recursive:true});fs.writeFileSync('site/index.html',html);
console.log('Published product count: '+products.length);
