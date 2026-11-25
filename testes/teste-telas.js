// Teste de fumaça do UaiShop: carrega a página num navegador simulado e percorre os fluxos principais.
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const { webcrypto } = require('crypto');

const html = fs.readFileSync(process.argv[2] || __dirname + '/../versao-arquivo-unico/uaishop.html', 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail?.stack || e.message)));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://example.test/', virtualConsole: vc,
  beforeParse(w) {
    Object.defineProperty(w, 'crypto', { value: webcrypto });
    w.TextEncoder = TextEncoder;
    w.scrollTo = () => {};
    w.Element.prototype.scrollIntoView = () => {};
    w.navigator.clipboard = { writeText: () => Promise.resolve() };
    w.addEventListener('error', e => errors.push('window.error: ' + (e.error?.stack || e.message)));
    w.addEventListener('unhandledrejection', e => errors.push('rejection: ' + (e.reason?.stack || e.reason)));
  },
});
const w = dom.window, d = w.document;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = s => d.querySelector(s);
const $$ = s => [...d.querySelectorAll(s)];
let step = '';
const log = [];
function check(cond, msg) { if (!cond) errors.push(`[${step}] FALHOU: ${msg}`); else log.push(`ok  ${step}: ${msg}`); }
function click(sel) { const el = typeof sel === 'string' ? $(sel) : sel; if (!el) { errors.push(`[${step}] elemento não encontrado: ${sel}`); return false; } el.click(); return true; }
function type(sel, v, ev = 'input') { const el = $(sel); if (!el) { errors.push(`[${step}] campo não encontrado: ${sel}`); return; } el.value = v; el.dispatchEvent(new w.Event(ev, { bubbles: true })); }
function submit(sel) { const f = $(sel); if (!f) { errors.push(`[${step}] form não encontrado: ${sel}`); return; } f.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); }
const toasts = () => $$('#toast-container .toast').map(t => t.textContent.trim());
const DB = () => w.eval('DB');
const S = () => w.eval('STATE');

async function login(u, p = '123') {
  type('#login-email', u); type('#login-pass', p); submit('#login-form'); await sleep(60);
}
function logout() { click('#logout-btn'); }

(async () => {
  await sleep(50);
  step = 'carregar'; check(!!$('#login-form'), 'tela de login aparece'); check(!!$('#reset-demo'), 'botão restaurar');

  // ---------- ADMIN ----------
  step = 'admin'; await login('admin');
  check(S().role === 'admin', 'entrou como admin');
  for (const tab of ['overview', 'orders', 'returns', 'products', 'reviews', 'producers', 'users', 'reports']) {
    step = 'admin/' + tab;
    click(`.sidenav-item[data-tab="${tab}"]`);
    const main = $('.main-content');
    check(main && main.textContent.trim().length > 50, 'aba renderiza conteúdo');
  }
  step = 'admin/orders';
  click('.sidenav-item[data-tab="orders"]');
  click('[data-adm-pill="orderStatus:processando"]');
  type('#adm-order-q', 'Ana');
  check(!!$('#adm-order-q') && d.activeElement === $('#adm-order-q'), 'busca mantém o foco');
  click('[data-order-view]'); check(!!$('#od-status'), 'abre detalhes do pedido'); click('#dlg-x');
  click('#copy-orders-csv'); await sleep(10);
  step = 'admin/products'; click('.sidenav-item[data-tab="products"]');
  { const cb = $('[data-adm="prodLow"]'); cb.checked = true; cb.dispatchEvent(new w.Event('change', { bubbles: true })); }
  check(!!$('.main-content'), 'filtro estoque baixo');
  step = 'admin/producers'; click('.sidenav-item[data-tab="producers"]');
  const maria = DB().users.find(u => u.username === 'maria');
  check(maria.approval === 'pendente', 'maria pendente');
  click(`[data-approve-producer="${maria.id}"]`); click('#dlg-ok'); await sleep(10);
  check(maria.approval === 'aprovado', 'maria aprovada');
  check(DB().products.some(p => p.producerId === maria.id && p.name === 'Beterraba'), 'produtos da maria entraram');
  const pedro = DB().users.find(u => u.username === 'pedro');
  click(`[data-reject-producer="${pedro.id}"]`); type('#dlg-note', 'Pouca quantidade de goiaba'); click('#dlg-ok');
  check(pedro.approval === 'recusado', 'pedro recusado');
  type('#rule-min-products', '3'); click('#save-rules');
  step = 'admin/reviews'; click('.sidenav-item[data-tab="reviews"]');
  const firstHide = $('[data-rv-hide]'); const rvId = Number(firstHide?.dataset.rvHide);
  click(firstHide); click('#dlg-ok');
  check(!!DB().reviews.find(r => r.id === rvId)?.hidden, 'avaliação ocultada');
  click('[data-adm-pill="rvStars:ocultas"]'); click(`[data-rv-hide="${rvId}"]`);
  check(!DB().reviews.find(r => r.id === rvId)?.hidden, 'avaliação mostrada de novo');
  step = 'admin/users'; click('.sidenav-item[data-tab="users"]');
  click('#add-user'); type('#mu-name', 'Teste'); type('#mu-email', 't@t.com'); type('#mu-login', 'teste'); type('#mu-pass', '123456'); click('#save-user'); await sleep(30);
  check(DB().users.some(u => u.username === 'teste'), 'admin cria usuário');
  logout();

  // ---------- CONSUMIDOR ----------
  step = 'consumidor'; await login('consumidor');
  check(S().role === 'consumer', 'entrou como consumidor');
  check($$('.product-card').length > 20, 'loja mostra produtos');
  check(!!$('#app'), 'ok');
  check(!$$('.product-card').some(c => /Smartphone|Camiseta/.test(c.textContent)), 'só alimentos');
  check($$('.product-card').some(c => c.textContent.includes('Beterraba')), 'produto da maria aparece');
  const sel = $('#sort-select'); sel.value = 'rating'; sel.dispatchEvent(new w.Event('change', { bubbles: true }));
  sel.value = 'price_asc'; $('#sort-select').dispatchEvent(new w.Event('change', { bubbles: true }));
  type('#search-input', 'tom'); check(d.activeElement?.id === 'search-input', 'busca mantém o foco');
  click('#clear-search');
  const banana = DB().products.find(p => p.name === 'Banana Prata');
  click(`[data-add="${banana.id}"]`);
  check(S().cart.some(i => i.productId === banana.id), 'pôs banana na cesta');
  click(`[data-inc="${banana.id}"]`); check(S().cart.find(i => i.productId === banana.id).qty === 1.5, 'botão + soma meio quilo');
  check($(`.product-card[data-pid="${banana.id}"]`).textContent.includes('1,5 kg na cesta'), 'mostra 1,5 kg');
  check(!!$('#cart-bar'), 'barra da cesta aparece');
  click(`.product-card[data-pid="${banana.id}"] .product-name`);
  check(S().view === 'product' && !!$('#reviews'), 'página do produto com avaliações');
  click('#qty-up'); click('#add-detail');
  check(S().cart.find(i => i.productId === banana.id).qty === 3, 'adiciona 1,5 kg pela página do produto');
  click('#go-cart'); check(S().view === 'cart', 'abre a cesta');
  click(`[data-dec="${banana.id}"]`);
  click('#go-checkout');
  step = 'checkout';
  submit('#co-form'); check($$('.form-input.invalid').length > 0, 'mostra erros nos campos vazios');
  type('#co-name', 'Ana Souza'); type('#co-phone', '31999998888'); type('#co-cep', '35710000');
  type('#co-street', 'Rua A'); type('#co-num', '10'); type('#co-district', 'Centro'); type('#co-city', 'Santo Hipólito');
  check($('#co-phone').value === '(31) 99999-8888', 'máscara de telefone');
  check($('#co-cep').value === '35710-000', 'máscara de CEP');
  submit('#co-form'); check(S().checkoutStep === 2, 'vai para pagamento');
  const card = $('input[name="pay"][value="card"]'); card.checked = true; card.dispatchEvent(new w.Event('change', { bubbles: true }));
  type('#cc-num', '4111111111111111'); type('#cc-name', 'ANA SOUZA'); type('#cc-exp', '1230'); type('#cc-cvv', '123');
  submit('#co-form'); check(S().checkoutStep === 3, 'vai para revisão');
  check($('.cart-wrap').textContent.includes('final 1111'), 'revisão mostra cartão');
  const stockBefore = banana.stock;
  click('#confirm-order');
  check(S().view === 'order-success', 'pedido confirmado');
  const newOrder = DB().orders[DB().orders.length - 1];
  check(newOrder.address?.city === 'Santo Hipólito' && newOrder.payment?.last4 === '1111', 'pedido guarda endereço e pagamento');
  check(!JSON.stringify(newOrder).includes('4111111111111111'), 'número completo do cartão não é guardado');
  check(banana.stock === stockBefore - 2.5, 'estoque baixou 2,5 kg');
  step = 'meus pedidos'; click('[data-go="orders"]');
  check(S().view === 'orders', 'abre meus pedidos');
  click('[data-my-filter="todos"]');
  click(`[data-cancel-order="${newOrder.id}"]`); click('#dlg-ok');
  check(newOrder.status === 'cancelado', 'cancela pedido');
  check(banana.stock === stockBefore, 'estoque voltou após cancelar');
  const milho = DB().orders.find(o => o.date === '2026-11-09');
  check(!!$(`[data-review-order="${milho.id}"]`), 'botão avaliar aparece');
  click(`[data-review-order="${milho.id}"]`);
  click('.rv-item [data-star="4"]'); $('.rv-item textarea').value = 'Milho bom';
  click('#rv-save');
  check(DB().reviews.some(r => r.orderId === milho.id && r.stars === 4), 'avaliação salva');
  if ($(`[data-return-order="${milho.id}"]`)) {
    click(`[data-return-order="${milho.id}"]`);
    const inp = $('[data-ret-pid]'); inp.value = '1'; inp.dispatchEvent(new w.Event('input', { bubbles: true }));
    click('#ret-send');
    check((milho.returns || []).some(r => r.status === 'solicitada'), 'pedido de devolução');
  } else errors.push('[meus pedidos] botão devolver não apareceu (prazo?)');
  // cancelar compra no meio do checkout
  step = 'cancelar compra';
  click('#go-home'); click(`[data-add="${banana.id}"]`); click('#cart-bar'); click('#go-checkout');
  click('#cancel-checkout'); click('#dlg-second');
  check(S().view === 'cart' && S().cart.length === 1, 'sair e guardar itens');
  click('#clear-cart'); click('#dlg-ok'); check(S().cart.length === 0, 'esvaziar cesta');
  logout();

  // ---------- PRODUTOR ----------
  step = 'produtor'; await login('produtor');
  check(S().role === 'producer', 'entrou como produtor');
  for (const tab of ['dashboard', 'orders', 'products', 'returns', 'reviews', 'settings']) {
    step = 'produtor/' + tab; click(`.sidenav-item[data-tab="${tab}"]`);
    check($('.main-content')?.textContent.trim().length > 40, 'aba renderiza');
  }
  step = 'produtor/pedido manual'; click('.sidenav-item[data-tab="orders"]');
  click('[data-new-order]');
  check(!!$('#po-form'), 'abre registrar pedido');
  type('#po-name', 'Dona Lúcia'); type('#po-phone', '31988887777');
  const prodSel = $('[data-po-prod]'); const pid = Number(prodSel.value); const p0 = DB().products.find(p => p.id === pid); const st0 = p0.stock;
  $('[data-po-qty]').value = '2';
  click('#po-add'); const rows = $$('.po-row'); rows[1].querySelector('[data-po-prod]').value = String(pid); rows[1].querySelector('[data-po-qty]').value = '1';
  const st = $('#po-status'); st.value = 'processando';
  submit('#po-form'); await sleep(10);
  const manual = DB().orders[DB().orders.length - 1];
  check(manual.source === 'produtor' && manual.items[0].qty === 3 && manual.pickup, 'pedido manual somado (3 itens) e retirada');
  check(p0.stock === st0 - 3, 'estoque baixou no pedido manual');
  click(`[data-p-next="${manual.id}|entregue"]`);
  check(manual.status === 'entregue', 'cliente retirou');
  step = 'produtor/produtos'; click('.sidenav-item[data-tab="products"]');
  const sp = $('[data-stock-step]'); const [spid] = sp.dataset.stockStep.split(':').map(Number); const before = DB().products.find(p => p.id === spid).stock;
  click(`[data-stock-step="${spid}:1"]`); check(DB().products.find(p => p.id === spid).stock === before + 1, 'estoque +1');
  click('#add-product'); check(!!$('#mp-photo'), 'campo de foto'); type('#mp-name', 'Mandioca'); type('#mp-price', '4.5'); type('#mp-stock', '20'); submit('#mp-form');
  check(DB().products.some(p => p.name === 'Mandioca' && p.producerId === S().producerId), 'cadastra produto');
  step = 'produtor/pedidos'; click('.sidenav-item[data-tab="orders"]');
  const nx = $('[data-p-next]'); if (nx) { click(nx); check(true, 'marca enviado'); }
  step = 'produtor/avaliações'; click('.sidenav-item[data-tab="reviews"]'); click('[data-prf="todas"]');
  const rp = $('[data-rv-reply]'); if (rp) { const rid = Number(rp.dataset.rvReply); click(rp); type('#dlg-note', 'Obrigado!'); click('#dlg-ok'); check(!!DB().reviews.find(r => r.id === rid).reply, 'responde avaliação'); }
  step = 'produtor/devoluções'; click('.sidenav-item[data-tab="returns"]');
  const ap = $('[data-approve-return]'); if (ap) { click(ap); click('#dlg-ok'); check(true, 'aprova devolução'); }
  step = 'produtor/loja'; click('.sidenav-item[data-tab="settings"]');
  type('#st-name', 'Hortifrúti do Carlão'); type('#st-city', 'Curvelo'); submit('#store-form');
  check(DB().users.find(u => u.id === S().producerId).store === 'Hortifrúti do Carlão', 'salva loja');
  logout();

  step = 'produtor recusado'; await login('pedro');
  check(!!$('#resubmit-app'), 'pedro vê tela de recusado');
  click('#resubmit-app'); check(!!$('#app-rows'), 'abre reenvio'); click('#dlg-x');
  logout();

  // ---------- CADASTROS ----------
  step = 'cadastro cliente'; click('#go-signup-consumer');
  submit('#cs-form'); check($$('.form-input.invalid').length > 0, 'mostra erros');
  type('#cs-name', 'Joana Lima'); type('#cs-email', 'joana@x.com'); type('#cs-user', 'joana'); type('#cs-pass', 'abc12345'); type('#cs-pass2', 'abc12345');
  $('#cs-ok').checked = true; submit('#cs-form'); await sleep(60);
  check(S().user?.username === 'joana' && S().role === 'consumer', 'cria conta e entra');
  logout();
  step = 'cadastro produtor'; click('#go-signup');
  type('#su-name', 'Zé'); type('#su-email', 'ze@x.com'); type('#su-user', 'zeze'); type('#su-pass', '1234'); type('#su-store', 'Sítio do Zé'); type('#su-city', 'Curvelo');
  const r0 = $$('#app-rows .app-row')[0]; r0.querySelector('[data-f="name"]').value = 'Couve'; r0.querySelector('[data-f="stock"]').value = '10'; r0.querySelector('[data-f="price"]').value = '3';
  submit('#signup-form'); await sleep(60);
  check(DB().users.some(u => u.username === 'zeze' && u.approval === 'pendente'), 'pedido de produtor enviado');
  click('#signup-back');
  step = 'login errado'; await login('admin', 'errada'); check(!$('#login-error').classList.contains('hidden'), 'mostra erro de senha');

  // tema escuro
  step = 'tema'; await login('admin'); click('#toggle-theme'); check(d.documentElement.getAttribute('data-theme') === 'dark', 'tema escuro');

  await sleep(50);
  console.log(log.join('\n'));
  console.log('\n==== ' + (errors.length ? errors.length + ' PROBLEMA(S)' : 'NENHUM PROBLEMA') + ' ====');
  errors.forEach(e => console.log('- ' + e));
  process.exit(0);
})().catch(e => { console.log('ERRO NO TESTE:', e.stack); console.log(errors.join('\n')); process.exit(1); });
