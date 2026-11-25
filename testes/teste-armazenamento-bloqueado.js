// Navegador que bloqueia o armazenamento: o site precisa abrir mesmo assim
const { JSDOM, VirtualConsole } = require('jsdom'); const fs = require('fs'); const { webcrypto } = require('crypto');
const errs = []; const vc = new VirtualConsole(); vc.on('jsdomError', e => errs.push(e.message));
const dom = new JSDOM(fs.readFileSync(__dirname + '/../versao-arquivo-unico/uaishop.html','utf8'), { runScripts:'dangerously', url:'https://x.test/', virtualConsole: vc, beforeParse(w){
  Object.defineProperty(w,'crypto',{value:webcrypto}); w.scrollTo=()=>{};
  Object.defineProperty(w,'localStorage',{get(){ throw new Error('SecurityError: storage blocked'); }});
  w.addEventListener('error', e => errs.push(e.message)); } });
setTimeout(() => { const ok = !!dom.window.document.querySelector('#login-form'); console.log('abre com armazenamento bloqueado:', ok ? 'SIM' : 'NÃO', errs); }, 200);
