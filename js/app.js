// UaiShop — lógica do site (telas, dados, regras)
// ===================== DATA STORE =====================
const EMOJI_MAP = {
  'Frutas': '🍌', 'Verduras': '🥬', 'Legumes': '🥕', 'Grãos e Mercearia': '🫘', 'Laticínios e Ovos': '🧀'
};
// Categorias que aparecem no filtro "Comidas"
const FOOD_CATS = ['Frutas', 'Verduras', 'Legumes', 'Grãos e Mercearia', 'Laticínios e Ovos'];
// Unidades de venda (quilo, maço, dúzia...)
const UNITS = { kg: 'kg', unidade: 'un.', 'maço': 'maço', 'dúzia': 'dúzia', litro: 'litro', bandeja: 'bandeja', pacote: 'pacote', pote: 'pote' };
function pEmoji(p) { return (p && p.emoji) || EMOJI_MAP[p?.category] || '📦'; }
function unitTag(p) { return p && p.unit && p.unit !== 'unidade' ? `<span class="unit">/${UNITS[p.unit] || p.unit}</span>` : ''; }
function unitWord(p) { return p && p.unit ? (p.unit === 'unidade' ? 'unidade' : p.unit) : 'unidade'; }
// Produtos vendidos por kg andam de meio em meio quilo; o resto, de 1 em 1
function unitStep(p) { return p && p.unit === 'kg' ? 0.5 : 1; }
function roundQty(q, step) { return Math.round(q / step) * step; }
function validQty(p, q) { const s = unitStep(p); return Number.isFinite(q) && q > 0 && Math.abs(q / s - Math.round(q / s)) < 1e-9; }
function fmtQty(q) { return String(Math.round(Number(q) * 100) / 100).replace('.', ','); }
// Foto do produto (só aceita a imagem que o próprio sistema gerou) ou o emoji
function pVisual(p) { return p && typeof p.photo === 'string' && p.photo.startsWith('data:image/jpeg;base64,') ? `<img src="${p.photo}" alt="" loading="lazy">` : pEmoji(p); }

// Leitura e gravação seguras: o navegador pode bloquear ou encher o armazenamento
function loadJSON(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; } catch (e) { return fallback; } }
let storageWarned = false;
function storeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (e) {
    if (!storageWarned && document.getElementById('toast-container')) { storageWarned = true; toast('Não deu para salvar neste navegador (armazenamento cheio ou bloqueado). As mudanças valem até fechar a página.', 'error'); }
    return false;
  }
}
// Se os dados salvos estiverem quebrados, começa de novo com os dados de demonstração
let DB = (d => d && Array.isArray(d.users) && Array.isArray(d.products) && Array.isArray(d.orders) ? d : null)(loadJSON('uaishop_db', null)) || {
  users: [
    { id: 1, name: 'Ana Souza', email: 'ana@email.com', role: 'consumer', active: true },
    { id: 2, name: 'Carlos Mineiro', email: 'carlos@loja.com', role: 'producer', active: true, store: 'Mineiro Store' },
    { id: 3, name: 'Beatriz Lima', email: 'bia@loja.com', role: 'producer', active: true, store: 'Bia Modas' },
    { id: 4, name: 'Admin', email: 'admin@uaishop.com', role: 'admin', active: true },
  ],
  products: [
    { id: 1, name: 'Smartphone UaiX Pro', category: 'Eletrônicos', price: 1299.90, stock: 15, producerId: 2, store: 'Mineiro Store', rating: 4.7, reviews: 83, description: 'Smartphone topo de linha com câmera de 108MP e bateria de 5000mAh.', active: true },
    { id: 2, name: 'Camiseta Uai Estampada', category: 'Roupas', price: 59.90, stock: 42, producerId: 3, store: 'Bia Modas', rating: 4.5, reviews: 31, description: 'Camiseta 100% algodão com estampa exclusiva de Minas Gerais.', active: true },
    { id: 3, name: 'Tênis RunMinas', category: 'Calçados', price: 249.90, stock: 8, producerId: 2, store: 'Mineiro Store', rating: 4.3, reviews: 19, description: 'Tênis esportivo ideal para corridas e caminhadas longas.', active: true },
    { id: 4, name: 'Cafeteira Espresso Elite', category: 'Casa', price: 189.90, stock: 20, producerId: 3, store: 'Bia Modas', rating: 4.8, reviews: 56, description: 'Cafeteira compacta para café espresso com 15 bar de pressão.', active: true },
    { id: 5, name: 'Queijo Minas Artesanal', category: 'Alimentos', price: 42.50, stock: 60, producerId: 2, store: 'Mineiro Store', rating: 5.0, reviews: 142, description: 'Queijo minas artesanal produzido na Serra da Canastra.', active: true },
    { id: 6, name: 'Kit Hidratante Floral', category: 'Beleza', price: 89.90, stock: 35, producerId: 3, store: 'Bia Modas', rating: 4.6, reviews: 48, description: 'Kit com sabonete, loção e óleo corporal com fragrância floral.', active: true },
    { id: 7, name: 'Livro: Sabor Mineiro', category: 'Livros', price: 54.90, stock: 25, producerId: 2, store: 'Mineiro Store', rating: 4.9, reviews: 67, description: 'Receitas tradicionais da culinária mineira com história e cultura.', active: true },
    { id: 8, name: 'Chuteira Campo Pro', category: 'Esportes', price: 189.00, stock: 12, producerId: 3, store: 'Bia Modas', rating: 4.4, reviews: 24, description: 'Chuteira de campo com solado de trava natural, couro sintético.', active: true },
  ],
  orders: [
    { id: 1001, consumerId: 1, consumerName: 'Ana Souza', items: [{ productId: 1, name: 'Smartphone UaiX Pro', qty: 1, price: 1299.90 }], total: 1299.90, status: 'entregue', date: '2026-11-10', producerId: 2 },
    { id: 1002, consumerId: 1, consumerName: 'Ana Souza', items: [{ productId: 2, name: 'Camiseta Uai Estampada', qty: 2, price: 59.90 }, { productId: 5, name: 'Queijo Minas Artesanal', qty: 1, price: 42.50 }], total: 162.30, status: 'em trânsito', date: '2026-11-18', producerId: 3 },
    { id: 1003, consumerId: 1, consumerName: 'Ana Souza', items: [{ productId: 7, name: 'Livro: Sabor Mineiro', qty: 1, price: 54.90 }], total: 54.90, status: 'processando', date: '2026-11-24', producerId: 2 },
  ],
  nextOrderId: 1004,
  nextProductId: 9,
};

function saveDB() { return storeJSON('uaishop_db', DB); }

// ===================== DADOS: COMIDAS (versão 2) =====================
// Produtos de exemplo para a feira. Preços e avaliações são fictícios.
const FOOD_SEED = [
  // Frutas
  { name: 'Banana Prata', category: 'Frutas', emoji: '🍌', unit: 'kg', price: 6.90, stock: 80, rating: 4.8, reviews: 54, description: 'Banana prata madura no ponto, colhida esta semana.' },
  { name: 'Maçã Gala', category: 'Frutas', emoji: '🍎', unit: 'kg', price: 9.90, stock: 45, rating: 4.6, reviews: 31, description: 'Maçã gala doce e crocante.' },
  { name: 'Laranja Pera', category: 'Frutas', emoji: '🍊', unit: 'kg', price: 4.50, stock: 120, rating: 4.7, reviews: 62, description: 'Laranja pera suculenta, ótima para suco.' },
  { name: 'Morango', category: 'Frutas', emoji: '🍓', unit: 'bandeja', price: 8.90, stock: 30, rating: 4.9, reviews: 40, description: 'Bandeja com 250 g de morangos frescos.' },
  { name: 'Manga Palmer', category: 'Frutas', emoji: '🥭', unit: 'kg', price: 7.90, stock: 50, rating: 4.7, reviews: 28, description: 'Manga palmer sem fiapo, polpa macia.' },
  { name: 'Abacaxi Pérola', category: 'Frutas', emoji: '🍍', unit: 'unidade', price: 7.50, stock: 25, rating: 4.5, reviews: 19, description: 'Abacaxi pérola doce, tamanho médio.' },
  // Legumes
  { name: 'Tomate', category: 'Legumes', emoji: '🍅', unit: 'kg', price: 7.90, stock: 70, rating: 4.6, reviews: 47, description: 'Tomate vermelho firme, bom para salada e molho.' },
  { name: 'Batata Inglesa', category: 'Legumes', emoji: '🥔', unit: 'kg', price: 5.90, stock: 100, rating: 4.5, reviews: 36, description: 'Batata lavada, boa para frita e purê.' },
  { name: 'Cenoura', category: 'Legumes', emoji: '🥕', unit: 'kg', price: 4.90, stock: 90, rating: 4.7, reviews: 33, description: 'Cenoura fresca e crocante.' },
  { name: 'Cebola', category: 'Legumes', emoji: '🧅', unit: 'kg', price: 5.50, stock: 85, rating: 4.4, reviews: 22, description: 'Cebola amarela de tamanho médio.' },
  { name: 'Pimentão Verde', category: 'Legumes', emoji: '🫑', unit: 'kg', price: 9.90, stock: 30, rating: 4.5, reviews: 15, description: 'Pimentão verde firme e brilhante.' },
  { name: 'Milho Verde', category: 'Legumes', emoji: '🌽', unit: 'unidade', price: 2.50, stock: 60, rating: 4.8, reviews: 41, description: 'Espiga de milho verde, ótima para pamonha e curau.' },
  // Verduras
  { name: 'Alface Crespa', category: 'Verduras', emoji: '🥬', unit: 'maço', price: 3.50, stock: 40, rating: 4.7, reviews: 38, description: 'Alface crespa sem agrotóxico, colhida no dia.' },
  { name: 'Couve Manteiga', category: 'Verduras', emoji: '🥬', unit: 'maço', price: 3.00, stock: 40, rating: 4.8, reviews: 44, description: 'Couve manteiga fresquinha, perfeita para o feijão tropeiro.' },
  { name: 'Brócolis', category: 'Verduras', emoji: '🥦', unit: 'maço', price: 6.90, stock: 25, rating: 4.6, reviews: 20, description: 'Brócolis ramoso, verde e firme.' },
  { name: 'Cheiro-Verde', category: 'Verduras', emoji: '🌿', unit: 'maço', price: 2.50, stock: 50, rating: 4.7, reviews: 26, description: 'Maço de salsinha com cebolinha.' },
  // Laticínios e ovos
  { name: 'Ovos Caipira', category: 'Laticínios e Ovos', emoji: '🥚', unit: 'dúzia', price: 14.90, stock: 40, rating: 4.9, reviews: 58, description: 'Ovos de galinhas criadas soltas.' },
  { name: 'Leite Fresco', category: 'Laticínios e Ovos', emoji: '🥛', unit: 'litro', price: 6.50, stock: 30, rating: 4.7, reviews: 23, description: 'Leite pasteurizado da fazenda, garrafa de 1 litro.' },
  // Grãos e mercearia
  { name: 'Feijão Carioca', category: 'Grãos e Mercearia', emoji: '🫘', unit: 'kg', price: 8.90, stock: 60, rating: 4.6, reviews: 29, description: 'Feijão carioca novo, cozinha rápido.' },
  { name: 'Café Torrado e Moído', category: 'Grãos e Mercearia', emoji: '☕', unit: 'pacote', price: 24.90, stock: 35, rating: 4.9, reviews: 71, description: 'Pacote de 500 g de café do Sul de Minas.' },
  { name: 'Doce de Leite', category: 'Grãos e Mercearia', emoji: '🍯', unit: 'pote', price: 16.90, stock: 30, rating: 5.0, reviews: 64, description: 'Pote de 400 g de doce de leite caseiro.' },
];
if ((DB.dataVersion || 1) < 2) {
  // Novo produtor rural (login: produtor3 / senha 123)
  if (!DB.users.some(u => u.email === 'joao@sitio.com')) {
    DB.users.push({ id: Math.max(...DB.users.map(u => u.id)) + 1, name: 'João do Sítio', email: 'joao@sitio.com', username: 'produtor3', role: 'producer', active: true, store: 'Sítio Boa Vista', passwordHash: 'd0e3998772c28482e4092c18baeae1876ad27178a66502278307d80675dec27b' });
  }
  const joao = DB.users.find(u => u.email === 'joao@sitio.com');
  // O queijo passa para a nova categoria de laticínios
  DB.products.forEach(p => { if (p.category === 'Alimentos' && /queijo/i.test(p.name)) { p.category = 'Laticínios e Ovos'; p.emoji = '🧀'; p.unit = p.unit || 'unidade'; } });
  let nextId = Math.max(0, ...DB.products.map(p => p.id)) + 1;
  FOOD_SEED.forEach(f => {
    if (DB.products.some(p => p.name === f.name)) return;
    DB.products.push({ id: nextId++, ...f, producerId: joao.id, store: joao.store, active: true });
  });
  DB.nextProductId = Math.max(DB.nextProductId || 0, nextId);
  DB.dataVersion = 2;
  saveDB();
}

// ===================== DADOS: HORTIFRÚTI (versão 3) =====================
// O site passa a vender somente alimentos. Preços e avaliações são fictícios.
const EXTRA_FOOD = [
  { name: 'Uva Niágara', category: 'Frutas', emoji: '🍇', unit: 'bandeja', price: 12.90, stock: 25, rating: 4.7, reviews: 21, description: 'Bandeja de 500 g de uva niágara doce.' },
  { name: 'Melão Amarelo', category: 'Frutas', emoji: '🍈', unit: 'kg', price: 5.90, stock: 40, rating: 4.5, reviews: 17, description: 'Melão amarelo doce e refrescante.' },
  { name: 'Melancia', category: 'Frutas', emoji: '🍉', unit: 'unidade', price: 22.00, stock: 15, rating: 4.8, reviews: 30, description: 'Melancia inteira, cerca de 8 kg.' },
  { name: 'Limão Taiti', category: 'Frutas', emoji: '🍋', unit: 'kg', price: 5.50, stock: 60, rating: 4.6, reviews: 25, description: 'Limão taiti suculento, ótimo para suco e tempero.' },
  { name: 'Rúcula', category: 'Verduras', emoji: '🥬', unit: 'maço', price: 3.50, stock: 35, rating: 4.6, reviews: 18, description: 'Rúcula fresca de horta.' },
  { name: 'Espinafre', category: 'Verduras', emoji: '🥬', unit: 'maço', price: 4.50, stock: 25, rating: 4.5, reviews: 12, description: 'Espinafre verde-escuro, folhas macias.' },
  { name: 'Alho Roxo', category: 'Legumes', emoji: '🧄', unit: 'kg', price: 32.90, stock: 20, rating: 4.7, reviews: 27, description: 'Alho roxo de dentes graúdos e sabor forte.' },
  { name: 'Abóbora Cabotiá', category: 'Legumes', emoji: '🎃', unit: 'kg', price: 4.90, stock: 45, rating: 4.6, reviews: 16, description: 'Abóbora cabotiá doce, boa para sopa e quibebe.' },
  { name: 'Pepino', category: 'Legumes', emoji: '🥒', unit: 'kg', price: 5.90, stock: 40, rating: 4.4, reviews: 11, description: 'Pepino japonês crocante.' },
  { name: 'Arroz Agulhinha', category: 'Grãos e Mercearia', emoji: '🍚', unit: 'pacote', price: 27.90, stock: 40, rating: 4.7, reviews: 52, description: 'Pacote de 5 kg de arroz agulhinha tipo 1.' },
  { name: 'Milho de Pipoca', category: 'Grãos e Mercearia', emoji: '🍿', unit: 'pacote', price: 6.90, stock: 50, rating: 4.8, reviews: 34, description: 'Pacote de 500 g de milho que estoura bem.' },
  { name: 'Amendoim', category: 'Grãos e Mercearia', emoji: '🥜', unit: 'kg', price: 14.90, stock: 30, rating: 4.6, reviews: 19, description: 'Amendoim cru com casca vermelha.' },
  { name: 'Fubá Mimoso', category: 'Grãos e Mercearia', emoji: '🌽', unit: 'pacote', price: 5.90, stock: 45, rating: 4.9, reviews: 38, description: 'Pacote de 1 kg de fubá para angu e bolo.' },
];
if ((DB.dataVersion || 1) < 3) {
  // Lojas com nomes de quitanda
  const renames = { 2: 'Hortifrúti do Carlos', 3: 'Quitanda da Bia' };
  DB.users.forEach(u => { if (u.role === 'producer' && renames[u.id]) u.store = renames[u.id]; });
  // Remove tudo que não é alimento (eletrônicos, roupas, calçados, casa, esportes, beleza, livros)
  DB.products = DB.products.filter(p => FOOD_CATS.includes(p.category));
  DB.products.forEach(p => { const owner = DB.users.find(u => u.id === p.producerId); if (owner?.store) p.store = owner.store; });
  // Novos alimentos divididos entre os produtores
  const owners = DB.users.filter(u => u.role === 'producer' && u.active && u.store);
  let nextId = Math.max(0, ...DB.products.map(p => p.id)) + 1;
  EXTRA_FOOD.forEach((f, i) => {
    if (!owners.length || DB.products.some(p => p.name === f.name)) return;
    const o = owners[i % owners.length];
    DB.products.push({ id: nextId++, ...f, producerId: o.id, store: o.store, active: true });
  });
  DB.nextProductId = Math.max(DB.nextProductId || 0, nextId);
  // Pedidos de exemplo passam a ter alimentos
  const sample = {
    1001: [['Café Torrado e Moído', 2], ['Doce de Leite', 1]],
    1002: [['Banana Prata', 2], ['Tomate', 1], ['Alface Crespa', 2]],
    1003: [['Feijão Carioca', 2], ['Arroz Agulhinha', 1]],
  };
  DB.orders.forEach(o => {
    if (!sample[o.id]) return;
    const items = sample[o.id].map(([n, qty]) => { const p = DB.products.find(x => x.name === n); return p && { productId: p.id, name: p.name, qty, price: p.price }; }).filter(Boolean);
    if (!items.length) return;
    o.items = items;
    o.total = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
    o.producerId = DB.products.find(p => p.id === items[0].productId)?.producerId ?? o.producerId;
  });
  DB.dataVersion = 3;
  saveDB();
}

// ===================== DADOS: PEDIDOS DE EXEMPLO (versão 4) =====================
// Histórico fictício para o relatório de produtores ter números para mostrar.
if ((DB.dataVersion || 1) < 4) {
  const consumer = DB.users.find(u => u.role === 'consumer');
  const history = [
    ['2026-09-05', [['Banana Prata', 3], ['Laranja Pera', 4], ['Alface Crespa', 2]], 'entregue'],
    ['2026-09-12', [['Café Torrado e Moído', 2], ['Feijão Carioca', 3]], 'entregue'],
    ['2026-09-20', [['Tomate', 2], ['Cebola', 1], ['Batata Inglesa', 3]], 'entregue'],
    ['2026-09-28', [['Ovos Caipira', 2], ['Leite Fresco', 4]], 'entregue'],
    ['2026-10-03', [['Morango', 3], ['Uva Niágara', 2]], 'entregue'],
    ['2026-10-11', [['Arroz Agulhinha', 1], ['Feijão Carioca', 2], ['Alho Roxo', 1]], 'entregue'],
    ['2026-10-19', [['Melancia', 1], ['Manga Palmer', 2]], 'cancelado'],
    ['2026-10-25', [['Queijo Minas Artesanal', 2], ['Doce de Leite', 2]], 'entregue'],
    ['2026-11-02', [['Couve Manteiga', 3], ['Cheiro-Verde', 2], ['Cenoura', 2]], 'entregue'],
    ['2026-11-09', [['Milho Verde', 6], ['Fubá Mimoso', 2]], 'entregue'],
    ['2026-11-15', [['Banana Prata', 2], ['Maçã Gala', 2], ['Limão Taiti', 1]], 'em trânsito'],
    ['2026-11-21', [['Brócolis', 2], ['Rúcula', 2], ['Abóbora Cabotiá', 3]], 'processando'],
  ];
  history.forEach(([date, list, status]) => {
    const items = list.map(([n, qty]) => {
      const p = DB.products.find(x => x.name === n);
      return p && { productId: p.id, producerId: p.producerId, name: p.name, qty, price: p.price };
    }).filter(Boolean);
    if (!items.length) return;
    DB.orders.push({
      id: DB.nextOrderId++, consumerId: consumer?.id ?? 1, consumerName: consumer?.name ?? 'Cliente',
      items, total: Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100,
      status, date, producerId: items[0].producerId,
    });
  });
  DB.orders.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  DB.dataVersion = 4;
  saveDB();
}

// ===================== DADOS: ENTREGAS E DEVOLUÇÕES (versão 5) =====================
if ((DB.dataVersion || 1) < 5) {
  const plus = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  DB.orders.forEach(o => {
    if (o.status === 'entregue' && !o.deliveredAt) o.deliveredAt = plus(o.date, 3);
    if (o.status === 'cancelado' && !o.cancelReason) { o.cancelReason = 'Desisti da compra'; o.cancelledAt = plus(o.date, 1); o.refunded = o.total; }
  });
  // Exemplo: pedido recente ainda dentro do prazo de devolução
  const milho = DB.orders.find(o => o.date === '2026-11-09' && o.items.some(i => i.name === 'Milho Verde'));
  if (milho) milho.deliveredAt = '2026-11-21';
  // Exemplo: uma devolução esperando análise
  const couve = DB.orders.find(o => o.date === '2026-11-02' && o.items.some(i => i.name === 'Couve Manteiga'));
  const ci = couve && couve.items.find(i => i.name === 'Couve Manteiga');
  if (ci && !(couve.returns || []).length) {
    couve.returns = [{ id: 1, date: '2026-11-06', items: [{ productId: ci.productId, producerId: ci.producerId, name: ci.name, qty: 1, price: ci.price }], reason: 'Produto estragado ou passado', comment: 'Um dos maços chegou com as folhas amareladas.', status: 'solicitada', refund: ci.price }];
  }
  DB.dataVersion = 5;
  saveDB();
}

// ===================== DADOS: APROVAÇÃO DE PRODUTORES (versão 6) =====================
if ((DB.dataVersion || 1) < 6) {
  DB.settings = Object.assign({ minProducts: 3, minStock: 5 }, DB.settings || {});
  DB.users.forEach(u => { if (u.role === 'producer' && !u.approval) u.approval = 'aprovado'; });
  const nextUid = () => Math.max(...DB.users.map(u => u.id)) + 1;
  // Dois pedidos de exemplo: um cumpre as regras, o outro não (dados fictícios; senha 123)
  if (!DB.users.some(u => u.email === 'maria@horta.com')) DB.users.push({
    id: nextUid(), name: 'Maria Aparecida', email: 'maria@horta.com', username: 'maria', role: 'producer', active: true,
    approval: 'pendente', store: 'Horta da Maria', passwordHash: 'abd9fecb068645b0bcc63f217758ab9578c20b9371f685d60bee3ba3d73c9704',
    application: { date: '2026-11-23', city: 'Curvelo', products: [
      { name: 'Alface Americana', category: 'Verduras', unit: 'maço', stock: 40, price: 3.80 },
      { name: 'Couve-Flor', category: 'Verduras', unit: 'unidade', stock: 15, price: 8.90 },
      { name: 'Beterraba', category: 'Legumes', unit: 'kg', stock: 30, price: 5.50 },
      { name: 'Quiabo', category: 'Legumes', unit: 'kg', stock: 12, price: 9.90 },
    ] },
  });
  if (!DB.users.some(u => u.email === 'pedro@pomar.com')) DB.users.push({
    id: nextUid(), name: 'Pedro Henrique', email: 'pedro@pomar.com', username: 'pedro', role: 'producer', active: true,
    approval: 'pendente', store: 'Pomar do Pedro', passwordHash: '80c2b9eb7546d46b9afaccc31953f6bc53c0e58d76b4d9235943688a8a4dc81b',
    application: { date: '2026-11-24', city: 'Santo Hipólito', products: [
      { name: 'Tangerina Ponkan', category: 'Frutas', unit: 'kg', stock: 20, price: 6.50 },
      { name: 'Goiaba Vermelha', category: 'Frutas', unit: 'kg', stock: 3, price: 7.90 },
    ] },
  });
  DB.dataVersion = 6;
  saveDB();
}

// ===================== DADOS: AVALIAÇÕES (versão 7) =====================
// As notas passam a vir só de avaliações reais, ligadas a pedidos entregues.
// Exemplos fictícios feitos a partir dos pedidos de exemplo já entregues.
if ((DB.dataVersion || 1) < 7) {
  DB.reviews = DB.reviews || [];
  const SAMPLE = {
    'Banana Prata': [5, 'Bananas no ponto certo, bem docinhas.'],
    'Laranja Pera': [4, 'Boas para suco. Algumas vieram um pouco pequenas.'],
    'Alface Crespa': [5, 'Chegou fresquinha, durou a semana toda.'],
    'Café Torrado e Moído': [5, 'Café muito bom, aroma forte.'],
    'Feijão Carioca': [5, 'Cozinhou rápido, feijão novo mesmo.'],
    'Tomate': [4, 'Tomates firmes, chegaram bem embalados.'],
    'Batata Inglesa': [4, ''],
    'Ovos Caipira': [5, 'Gema bem amarelinha. Vou comprar de novo.'],
    'Leite Fresco': [4, 'Leite gostoso, chegou gelado.'],
    'Morango': [3, 'Gostosos, mas alguns vieram amassados.'],
    'Arroz Agulhinha': [5, ''],
    'Queijo Minas Artesanal': [5, 'Queijo maravilhoso!'],
    'Doce de Leite': [5, 'Igualzinho ao de vó.'],
    'Couve Manteiga': [2, 'Um dos maços chegou com as folhas amareladas.'],
  };
  const plusD = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  let rid = Math.max(0, ...DB.reviews.map(r => r.id)) + 1;
  // O pedido de 09/11 fica sem avaliação, para testar
  DB.orders.filter(o => o.status === 'entregue' && o.date !== '2026-11-09').forEach(o => o.items.forEach(i => {
    const s = SAMPLE[i.name];
    if (!s || DB.reviews.some(r => r.orderId === o.id && r.productId === i.productId)) return;
    const u = DB.users.find(x => x.id === o.consumerId);
    DB.reviews.push({ id: rid++, productId: i.productId, producerId: i.producerId ?? DB.products.find(p => p.id === i.productId)?.producerId, productName: i.name, orderId: o.id, userId: o.consumerId, userName: u?.name || o.consumerName, stars: s[0], comment: s[1], date: plusD(o.deliveredAt || o.date, 1) });
  }));
  const mor = DB.reviews.find(r => r.productName === 'Morango');
  if (mor) mor.reply = { text: 'Obrigado pelo aviso! Já reforçamos a embalagem dos morangos.', date: plusD(mor.date, 1) };
  DB.dataVersion = 7;
  saveDB();
}
function sellerOk(p) {
  const u = DB.users.find(x => x.id === p.producerId);
  return !!u && u.active && (!u.approval || u.approval === 'aprovado');
}
// Correção de grafia em dados já salvos
DB.products.forEach(p => {
  if (p.name === 'Abóbora Caboutiá') { p.name = 'Abóbora Cabotiá'; saveDB(); }
  if (p.description && p.description.includes('graudos')) { p.description = p.description.replace('graudos', 'graúdos'); saveDB(); }
});

// ===================== AUTH =====================
// Senhas guardadas apenas como hash SHA-256 (sal = e-mail). Protótipo: autenticação real deve ficar no servidor.
// Contas de demonstração: usuário de login + hash da senha "123"
const SEED_ACCOUNTS = {
  'admin@uaishop.com': { username: 'admin', hash: 'e81c8c440185eb16a469f84e584f6cb116d321f285ae61a46c8edcf50b0d5dd9' },
  'ana@email.com': { username: 'consumidor', hash: 'e0bd1c39b81dd02cdc54d2604e1165d347fd21dc77f60816b5ad33ffe5627304' },
  'carlos@loja.com': { username: 'produtor', hash: '3a612d84f15d321f25330babba0223e7d281a93e8e9f8e33bfad6a1fe5ffbc77' },
  'bia@loja.com': { username: 'produtor2', hash: '4493e22d4c42d388c21ad5d17e90f5ec5862201e1fe490ffebc228e9705d605b' },
};
const AUTH_VERSION = 2;
const DEMO_ACCOUNTS = [
  { role: 'admin', user: 'admin', pw: '123' },
  { role: 'consumer', user: 'consumidor', pw: '123' },
  { role: 'producer', user: 'produtor', pw: '123' },
];
const ROLE_INFO = {
  consumer: { icon: '🛒', title: 'Consumidor', btn: 'btn-primary' },
  producer: { icon: '🏪', title: 'Produtor', btn: 'btn-accent' },
  admin: { icon: '⚙️', title: 'Administrador', btn: 'btn-primary' },
};
// Migração: bancos antigos salvos no navegador ganham as senhas de demonstração
if (DB.authVersion !== AUTH_VERSION) {
  DB.users.forEach(u => {
    const s = SEED_ACCOUNTS[u.email.toLowerCase()];
    if (s) { u.username = s.username; u.passwordHash = s.hash; }
  });
  DB.authVersion = AUTH_VERSION;
}
saveDB();
function findUserByLogin(login) {
  const k = login.trim().toLowerCase();
  return DB.users.find(u => (u.username || '').toLowerCase() === k || u.email.toLowerCase() === k);
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function hashPassword(email, pw) {
  const data = new TextEncoder().encode('uaishop|' + email.toLowerCase() + '|' + pw);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const LOGIN_GUARD = { fails: 0, until: 0 };
function loginLockRemaining() { return Math.max(0, Math.ceil((LOGIN_GUARD.until - Date.now()) / 1000)); }
function registerLoginFail() { if (++LOGIN_GUARD.fails >= 5) { LOGIN_GUARD.until = Date.now() + 30000; LOGIN_GUARD.fails = 0; } }
function loginAs(user) {
  LOGIN_GUARD.fails = 0;
  STATE.user = user; STATE.role = user.role; STATE.loginRole = null;
  if (user.role === 'producer') STATE.producerId = user.id;
  STATE.view = 'home'; STATE.producerTab = 'dashboard'; STATE.adminTab = 'overview';
  try { sessionStorage.setItem('uaishop_session', JSON.stringify({ userId: user.id })); } catch (e) {}
  render();
}
function logout() {
  STATE.user = null; STATE.role = null; STATE.loginRole = null;
  try { sessionStorage.removeItem('uaishop_session'); } catch (e) {}
  closeModal(); render();
  toast('Você saiu da sua conta.');
}
function restoreSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem('uaishop_session') || 'null');
    const u = s && DB.users.find(x => x.id === s.userId && x.active);
    if (u) { STATE.user = u; STATE.role = u.role; if (u.role === 'producer') STATE.producerId = u.id; }
  } catch (e) {}
}

// ===================== STATE =====================
let STATE = {
  role: null, // 'consumer' | 'producer' | 'admin'
  user: null, // usuário logado
  loginRole: null, // perfil escolhido na tela inicial
  producerId: 2, // current producer
  view: 'home',
  subview: null,
  cart: [].concat(loadJSON('uaishop_cart', []) || []).filter(i => i && i.qty > 0 && DB.products.some(p => p.id === i.productId)),
  selectedProduct: null,
  productQty: 1,
  checkoutStep: 1,
  filterCategory: 'Todos',
  searchQuery: '',
  editingProduct: null,
  adminTab: 'overview',
  producerTab: 'dashboard',
};

function saveCart() { return storeJSON('uaishop_cart', STATE.cart); }
function cartCount() { return STATE.cart.length; }
function cartTotal() { return STATE.cart.reduce((s, i) => s + i.price * i.qty, 0); }
function fmt(n) { return 'R$ ' + Number(n).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function fmtDate(d) { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); }

// ===================== RENDER ENGINE =====================
function render() {
  const app = document.getElementById('app');
  if (!STATE.user) {
    if (STATE.signup === 'consumer') { app.innerHTML = renderConsumerSignup(); attachConsumerSignup(); }
    else if (STATE.signup) { app.innerHTML = renderSignup(); attachSignup(); }
    else { app.innerHTML = renderLogin(); attachLogin(); }
    return;
  }
  if (STATE.role === 'consumer') { app.innerHTML = renderConsumer(); attachConsumer(); }
  else if (STATE.role === 'producer') { app.innerHTML = renderProducer(); attachProducer(); }
  else if (STATE.role === 'admin') { app.innerHTML = renderAdmin(); attachAdmin(); }
  document.getElementById('logout-btn')?.addEventListener('click', logout);
}

// ===================== TOAST =====================
function toast(msg, type = '') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  const icons = { success: '✓', error: '✕', '': 'ℹ' };
  t.innerHTML = `<span>${icons[type]||icons['']}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateY(8px)'; t.style.transition='.2s'; setTimeout(() => t.remove(), 200); }, 2800);
}

// ===================== MODAL =====================
function showModal(html, onAttach) {
  const c = document.getElementById('modal-container');
  c.innerHTML = `<div class="modal-overlay" id="modal-overlay"><div class="modal">${html}</div></div>`;
  c.querySelector('#modal-overlay').addEventListener('click', e => { if(e.target.id==='modal-overlay') closeModal(); });
  if (onAttach) onAttach();
}
function closeModal() { document.getElementById('modal-container').innerHTML = ''; }

// ===================== LANDING =====================
function renderLanding() {
  return `
  <section id="landing">
    <div class="landing-logo">Uai<span>Shop</span></div>
    <p class="landing-tagline">O marketplace do jeito mineiro — simples, honesto e de confiança.</p>
    <div class="role-cards">
      <div class="role-card" data-role="consumer">
        <div class="role-icon">🛒</div>
        <div class="role-title">Consumidor</div>
        <div class="role-desc">Explore produtos, adicione ao carrinho e acompanhe seus pedidos.</div>
        <button class="btn btn-primary btn-sm mt-2">Entrar como Consumidor</button>
      </div>
      <div class="role-card" data-role="producer">
        <div class="role-icon">🏪</div>
        <div class="role-title">Produtor</div>
        <div class="role-desc">Gerencie seus produtos, estoque e pedidos recebidos.</div>
        <button class="btn btn-accent btn-sm mt-2">Entrar como Produtor</button>
      </div>
      <div class="role-card" data-role="admin">
        <div class="role-icon">⚙️</div>
        <div class="role-title">Administração</div>
        <div class="role-desc">Painel completo: usuários, lojas, relatórios e configurações.</div>
        <button class="btn btn-secondary btn-sm mt-2">Painel Admin</button>
      </div>
    </div>
    <p class="text-sm text-fg3 mt-6">UaiShop &copy; 2026 — Feito com 💛 em Minas Gerais</p>
  </section>`;
}
function attachLanding() {
  document.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', () => {
      STATE.loginRole = card.dataset.role;
      render();
    });
  });
}

// ===================== LOGIN =====================
function renderLogin() {
  const locked = loginLockRemaining();
  return `
  <section class="login-wrap"><div class="login-card">
    <div style="text-align:center">
      <div style="font-size:2.2rem;line-height:1" aria-hidden="true">🥬🍅🍌</div>
      <div class="landing-logo mt-1">Uai<span>Shop</span></div>
      <p class="font-600 mt-1">Hortifrúti mineiro</p>
      <p class="text-sm text-fg2">Frutas, verduras e grãos fresquinhos, direto do produtor.<br>Entre com seu usuário e senha.</p>
    </div>
    <form id="login-form" class="flex-col gap-3 mt-4" novalidate>
      <div class="form-group"><label class="form-label" for="login-email">Usuário ou e-mail</label>
        <input class="form-input" id="login-email" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="ex.: admin" required></div>
      <div class="form-group"><label class="form-label" for="login-pass">Senha</label>
        <div class="pass-wrap"><input class="form-input" id="login-pass" type="password" autocomplete="current-password" placeholder="Sua senha" required style="padding-right:4.8rem">
        <button type="button" class="pass-toggle" id="pass-toggle">Mostrar</button></div></div>
      <div class="login-error ${locked ? '' : 'hidden'}" id="login-error" role="alert">${locked ? `Muitas tentativas. Aguarde ${locked}s.` : ''}</div>
      <button type="submit" class="btn btn-primary btn-lg w-full" id="login-submit">Entrar</button>
    </form>
    <div class="text-xs text-fg3 mt-4" style="text-align:center">Ainda não tem conta?</div>
    <div class="flex gap-2 mt-2" style="flex-wrap:wrap">
      <button type="button" class="btn btn-secondary" style="flex:1;min-width:150px" id="go-signup-consumer">🧺 Criar conta para comprar</button>
      <button type="button" class="btn btn-secondary" style="flex:1;min-width:150px" id="go-signup">🌱 Quero vender</button>
    </div>
    <div class="demo-box mt-4">
      <div class="font-600 mb-2" style="color:var(--fg)">Acessos de demonstração (senha <code>123</code>)</div>
      <div class="flex-col gap-1">
        ${DEMO_ACCOUNTS.map((d, i) => `
        <button type="button" class="btn btn-secondary btn-sm" data-demo="${i}" style="justify-content:space-between">
          <span>${ROLE_INFO[d.role].icon} ${ROLE_INFO[d.role].title}</span><code>${d.user}</code>
        </button>`).join('')}
      </div>
      <button type="button" class="link-btn mt-2" id="reset-demo">Restaurar os dados de demonstração</button>
    </div>
    <p class="text-xs text-fg3 mt-4" style="text-align:center">UaiShop &copy; 2026 — Feito com 💛 em Minas Gerais</p>
  </div></section>`;
}
function attachLogin() {
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-pass');
  const errEl = document.getElementById('login-error');
  const submit = document.getElementById('login-submit');
  const showError = m => { errEl.textContent = m; errEl.classList.remove('hidden'); };
  document.getElementById('go-signup').addEventListener('click', () => { STATE.signup = 'form'; render(); });
  document.getElementById('go-signup-consumer').addEventListener('click', () => { STATE.signup = 'consumer'; render(); });
  document.getElementById('reset-demo').addEventListener('click', () => confirmDialog({
    title: 'Restaurar os dados de demonstração?',
    message: 'Apaga deste navegador tudo o que foi criado (pedidos, contas, produtos, avaliações) e volta ao começo. Útil antes de uma apresentação.',
    confirmText: 'Restaurar', danger: true,
  }, () => {
    try { localStorage.removeItem('uaishop_db'); localStorage.removeItem('uaishop_cart'); sessionStorage.removeItem('uaishop_session'); } catch (e) {}
    location.reload();
  }));
  document.getElementById('pass-toggle').addEventListener('click', e => {
    const show = passEl.type === 'password';
    passEl.type = show ? 'text' : 'password';
    e.currentTarget.textContent = show ? 'Ocultar' : 'Mostrar';
  });
  document.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => {
    const d = DEMO_ACCOUNTS[Number(b.dataset.demo)];
    emailEl.value = d.user; passEl.value = d.pw; passEl.focus();
  }));
  emailEl.focus();
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const wait = loginLockRemaining();
    if (wait) { showError(`Muitas tentativas. Aguarde ${wait}s e tente de novo.`); return; }
    const login = emailEl.value.trim();
    const pw = passEl.value;
    if (!login || !pw) { showError('Informe usuário e senha.'); return; }
    submit.disabled = true;
    try {
      const user = findUserByLogin(login);
      // Calcula o hash mesmo sem usuário, para não revelar pelo tempo de resposta se ele existe
      const hash = await hashPassword(user ? user.email : login, pw);
      if (!user || !user.passwordHash || user.passwordHash !== hash) {
        registerLoginFail();
        showError('Usuário ou senha incorretos.');
        return;
      }
      if (!user.active) { showError('Esta conta está desativada. Fale com o administrador.'); return; }
      loginAs(user);
      toast(`Bem-vindo(a), ${esc(user.name)}!`, 'success');
    } catch (err) {
      showError('Não foi possível entrar neste navegador.');
    } finally {
      submit.disabled = false;
    }
  });
}

// ===================== TOP NAV =====================
function renderTopNav(role) {
  const labels = { consumer: 'Consumidor', producer: 'Produtor', admin: 'Admin' };
  const cls = { consumer: 'nav-role-consumer', producer: 'nav-role-producer', admin: 'nav-role-admin' };
  const cartBtn = role === 'consumer' ? `
    <button class="btn btn-ghost btn-sm" id="go-orders-nav" title="Meus pedidos">📦<span class="nav-txt">Meus pedidos</span></button>
    <button class="btn btn-icon btn-ghost cart-btn" id="go-cart" title="Sua cesta" aria-label="Sua cesta, ${cartCount()} item(ns)">
      🛒
      ${cartCount() > 0 ? `<span class="cart-count">${cartCount()}</span>` : ''}
    </button>` : '';
  return `
  <nav class="topnav">
    <div class="nav-logo" id="go-home">🥬 Uai<span>Shop</span></div>
    <span class="nav-role-badge ${cls[role]}">${labels[role]}</span>
    <div class="nav-actions">
      ${cartBtn}
      <button class="btn btn-ghost btn-sm" id="toggle-theme" title="Alternar tema">🌓</button>
      <span class="nav-user truncate" title="${esc(STATE.user?.email)}">${esc(STATE.user?.name)}</span>
      <button class="btn btn-secondary btn-sm" id="logout-btn">Sair</button>
    </div>
  </nav>`;
}

// ===================== CONSUMER =====================
function renderConsumer() {
  const views = {
    home: renderConsumerHome,
    product: renderProductDetail,
    cart: renderCart,
    checkout: renderCheckout,
    orders: renderMyOrders,
    'order-success': renderOrderSuccess,
  };
  const content = (views[STATE.view] || renderConsumerHome)();
  return renderTopNav('consumer') + `<div id="consumer-area">${content}</div>`;
}

// --- Ajudantes da loja ---
function productById(id) { return DB.products.find(p => p.id === id); }
function cartQty(pid) { return STATE.cart.find(i => i.productId === pid)?.qty || 0; }
const SORTS = { relevance: 'Mais vendidos', rating: 'Mais bem avaliados', price_asc: 'Menor preço', price_desc: 'Maior preço', name: 'Nome (A a Z)' };

// --- Avaliações ---
const STAR_WORDS = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];
function starStr(n) { const k = Math.round(n); return '★'.repeat(k) + '☆'.repeat(5 - k); }
function avgStr(n) { return n.toFixed(1).replace('.', ','); }
function reviewsOf(pid) { return (DB.reviews || []).filter(r => r.productId === pid && !r.hidden); }
function ratingOf(pid) { const l = reviewsOf(pid); return { count: l.length, avg: l.length ? l.reduce((s, r) => s + r.stars, 0) / l.length : 0 }; }
function storeRatingOf(producerId) { const l = (DB.reviews || []).filter(r => r.producerId === producerId && !r.hidden); return { count: l.length, avg: l.length ? l.reduce((s, r) => s + r.stars, 0) / l.length : 0 }; }
function shortName(n) { const p = String(n || 'Cliente').trim().split(/\s+/); return esc(p[0] + (p[1] ? ' ' + p[1][0] + '.' : '')); }
function byDateDesc(a, b) { return b.date.localeCompare(a.date) || b.id - a.id; }
function distHtml(list) { return hbars([5, 4, 3, 2, 1].map(n => [`${n} ★`, list.filter(r => r.stars === n).length]), v => v); }
function ratingSummaryHtml(list) {
  const avg = list.reduce((s, r) => s + r.stars, 0) / list.length;
  return `<div class="rv-summary"><div style="text-align:center"><div class="rv-big">${avgStr(avg)}</div><div class="stars" style="font-size:1.15rem" aria-label="Média ${avgStr(avg)} de 5">${starStr(avg)}</div><div class="text-xs text-fg2">${list.length} avaliação(ões)</div></div><div>${distHtml(list)}</div></div>`;
}
// mode: 'public' (página do produto), 'producer' ou 'admin'
function reviewItem(r, mode) {
  const p = productById(r.productId);
  return `
  <div class="review ${r.hidden ? 'is-hidden' : ''}">
    <div class="flex justify-between items-center gap-2" style="flex-wrap:wrap">
      <span><span class="stars" aria-label="${r.stars} de 5 estrelas">${starStr(r.stars)}</span> <strong class="text-sm">${STAR_WORDS[r.stars]}</strong></span>
      <span class="text-xs text-fg3">${fmtDate(r.date)}${r.edited ? ' (editada)' : ''}</span>
    </div>
    ${mode !== 'public' ? `<div class="text-sm mt-1">${pEmoji(p)} <strong>${esc(p?.name || r.productName || 'Produto removido')}</strong>${mode === 'admin' && p?.store ? ' · ' + esc(p.store) : ''}</div>` : ''}
    ${r.comment ? `<p class="text-sm mt-1">${esc(r.comment)}</p>` : ''}
    <div class="text-xs text-fg2 mt-1">${mode === 'public' ? shortName(r.userName) : esc(r.userName)} · <span class="text-accent">✓ Compra verificada</span>${mode !== 'public' ? ' · pedido #' + r.orderId : ''}</div>
    ${r.reply ? `<div class="review-reply"><strong>Resposta da loja</strong> <span class="text-xs text-fg3">· ${fmtDate(r.reply.date)}</span><br>${esc(r.reply.text)}</div>` : ''}
    ${r.hidden && mode === 'admin' ? `<div class="text-xs text-danger mt-1">Oculta em ${fmtDate(r.hidden.date)}: ${esc(r.hidden.reason)}</div>` : ''}
    ${mode === 'producer' ? `<button class="btn btn-secondary btn-sm mt-2" data-rv-reply="${r.id}">${r.reply ? 'Editar resposta' : 'Responder'}</button>` : ''}
    ${mode === 'admin' ? `<button class="btn ${r.hidden ? 'btn-secondary' : 'btn-ghost text-danger'} btn-sm mt-2" data-rv-hide="${r.id}">${r.hidden ? 'Mostrar de novo' : 'Ocultar'}</button>` : ''}
  </div>`;
}
function productReviewsHtml(p) {
  const list = reviewsOf(p.id).sort(byDateDesc);
  const shown = STATE.allReviews === p.id ? list : list.slice(0, 4);
  return `
  <section class="card mt-6" id="reviews">
    <h2 class="card-title">Avaliações de quem comprou</h2>
    ${list.length ? `${ratingSummaryHtml(list)}<div class="mt-4">${shown.map(r => reviewItem(r, 'public')).join('')}</div>${list.length > shown.length ? `<button class="btn btn-secondary btn-sm mt-2" id="all-reviews">Ver todas as ${list.length} avaliações</button>` : ''}`
      : '<p class="text-sm text-fg2">Este produto ainda não tem avaliações. Quem compra e recebe pode avaliar em "Meus pedidos".</p>'}
  </section>`;
}
function reviewFor(orderId, pid, userId) { return (DB.reviews || []).find(r => r.orderId === orderId && r.productId === pid && r.userId === userId); }
// Bloco do pedido entregue em "Meus pedidos"
function reviewBlock(o) {
  if (o.status !== 'entregue' || o.consumerId !== STATE.user.id) return '';
  const pids = [...new Set(o.items.map(i => i.productId))];
  const done = pids.filter(pid => reviewFor(o.id, pid, STATE.user.id));
  return `
  <div class="after-note">
    ${done.length ? `<div class="text-sm" style="display:grid;gap:.2rem">${done.map(pid => { const r = reviewFor(o.id, pid, STATE.user.id); return `<div>${esc(o.items.find(i => i.productId === pid).name)}: <span class="stars" aria-label="${r.stars} de 5">${starStr(r.stars)}</span>${r.hidden ? ' <span class="text-xs text-fg3">(oculta pela moderação)</span>' : ''}${r.reply ? ' <span class="text-xs text-accent">· a loja respondeu</span>' : ''}</div>`; }).join('')}</div>`
      : '<div class="text-sm">Gostou do que recebeu? Sua opinião ajuda outros clientes e os produtores.</div>'}
    <button class="btn ${done.length < pids.length ? 'btn-primary' : 'btn-secondary'} btn-sm mt-2" data-review-order="${o.id}">${done.length < pids.length ? `⭐ Avaliar produtos (${pids.length - done.length} sem nota)` : 'Editar minhas avaliações'}</button>
  </div>`;
}
function openReviewModal(orderId) {
  const o = DB.orders.find(x => x.id === orderId);
  if (!o || o.status !== 'entregue' || o.consumerId !== STATE.user.id) { toast('Só dá para avaliar pedidos entregues', 'error'); return; }
  const items = [...new Map(o.items.map(i => [i.productId, i])).values()];
  showModal(`
  <div class="modal-title">Avaliar o pedido #${o.id} <button class="btn btn-ghost btn-icon" id="dlg-x" aria-label="Fechar">✕</button></div>
  <p class="text-sm text-fg2 mb-3">Dê de 1 a 5 estrelas. O comentário é opcional. Pode deixar sem nota o que não quiser avaliar.</p>
  ${items.map(i => { const r = reviewFor(o.id, i.productId, STATE.user.id), cur = r?.stars || 0; return `
  <div class="rv-item" data-rv-pid="${i.productId}" data-stars="${cur}">
    <div class="font-600">${pEmoji(productById(i.productId))} ${esc(i.name)}</div>
    <div class="flex items-center gap-2 mt-1" style="flex-wrap:wrap">
      <div class="star-input" role="radiogroup" aria-label="Nota para ${esc(i.name)}">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="${n === cur}" aria-label="${n} estrela(s): ${STAR_WORDS[n]}" data-star="${n}" class="${n <= cur ? 'on' : ''}">★</button>`).join('')}</div>
      <span class="text-sm text-fg2 rv-word">${cur ? STAR_WORDS[cur] : 'Sem nota'}</span>
    </div>
    <textarea class="form-input mt-2" maxlength="300" placeholder="Conte como foi (opcional)" aria-label="Comentário sobre ${esc(i.name)}" style="min-height:64px">${esc(r?.comment || '')}</textarea>
  </div>`; }).join('')}
  <div class="flex gap-2 mt-3" style="justify-content:flex-end;flex-wrap:wrap"><button class="btn btn-secondary" id="dlg-cancel">Voltar</button><button class="btn btn-primary" id="rv-save">Enviar avaliação</button></div>`, () => {
    document.querySelectorAll('.rv-item').forEach(box => box.querySelectorAll('[data-star]').forEach(b => b.addEventListener('click', () => {
      const n = Number(b.dataset.star);
      box.dataset.stars = n;
      box.querySelectorAll('[data-star]').forEach(x => { const k = Number(x.dataset.star); x.classList.toggle('on', k <= n); x.setAttribute('aria-checked', String(k === n)); });
      box.querySelector('.rv-word').textContent = STAR_WORDS[n];
    })));
    document.getElementById('dlg-x').addEventListener('click', closeModal);
    document.getElementById('dlg-cancel').addEventListener('click', closeModal);
    document.getElementById('rv-save').addEventListener('click', () => {
      // 1) lê e confere tudo antes de salvar
      const entries = [...document.querySelectorAll('.rv-item')].map(box => ({ pid: Number(box.dataset.rvPid), stars: Number(box.dataset.stars), comment: box.querySelector('textarea').value.trim().slice(0, 300) }));
      if (entries.some(e => !e.stars && e.comment)) { toast('Dê as estrelas dos produtos em que você escreveu um comentário', 'error'); return; }
      const rated = entries.filter(e => e.stars >= 1 && e.stars <= 5);
      if (!rated.length) { toast('Escolha a nota de pelo menos um produto', 'error'); return; }
      // 2) salva
      DB.reviews = DB.reviews || [];
      rated.forEach(e => {
        const it = o.items.find(i => i.productId === e.pid);
        const old = reviewFor(o.id, e.pid, STATE.user.id);
        if (old) { if (old.stars !== e.stars || old.comment !== e.comment) Object.assign(old, { stars: e.stars, comment: e.comment, date: todayISO(), edited: true }); }
        else DB.reviews.push({ id: Math.max(0, ...DB.reviews.map(r => r.id)) + 1, productId: e.pid, producerId: itemProducer(it), productName: it.name, orderId: o.id, userId: STATE.user.id, userName: STATE.user.name, stars: e.stars, comment: e.comment, date: todayISO() });
      });
      saveDB(); closeModal(); render();
      toast('Obrigado pela avaliação!', 'success');
    });
  });
}
// Produtor e admin
function lowUnanswered(producerId) { return (DB.reviews || []).filter(r => r.producerId === producerId && !r.hidden && !r.reply && r.stars <= 3).length; }
function renderProducerReviews() {
  const all = (DB.reviews || []).filter(r => r.producerId === STATE.producerId && !r.hidden).sort(byDateDesc);
  const f = STATE.prf || 'todas';
  const filters = { todas: () => true, sem: r => !r.reply, baixas: r => r.stars <= 3 };
  const labels = { todas: 'Todas', sem: 'Sem resposta', baixas: 'Notas baixas (1 a 3)' };
  const list = all.filter(filters[f] || filters.todas);
  return `
  ${adminHead('Avaliações', 'O que os clientes acham dos seus produtos')}
  ${all.length ? `<div class="card mb-4">${ratingSummaryHtml(all)}</div>` : ''}
  <div class="pill-row">${Object.keys(labels).map(k => `<button class="category-chip ${f === k ? 'active' : ''}" data-prf="${k}">${labels[k]} <span class="pill-n">${all.filter(filters[k]).length}</span></button>`).join('')}</div>
  ${list.length ? `<div class="card">${list.map(r => reviewItem(r, 'producer')).join('')}</div>` : `<div class="empty-state"><div class="empty-state-icon">⭐</div><div class="empty-state-title">${all.length ? 'Nada neste filtro' : 'Você ainda não recebeu avaliações'}</div><div class="empty-state-desc">Os clientes avaliam depois que o pedido é entregue.</div></div>`}
  <p class="text-xs text-fg3 mt-3">Dica: responder com educação, principalmente as notas baixas, mostra aos clientes que a loja se importa.</p>`;
}
function renderAdminReviews() {
  const f = STATE.adm; f.rvStars = f.rvStars || 'todas';
  const q = (f.rvQ || '').trim().toLowerCase();
  const all = (DB.reviews || []).slice().sort(byDateDesc);
  const visible = all.filter(r => !r.hidden), hiddenCount = all.length - visible.length;
  const match = r => f.rvStars === 'todas' ? !r.hidden : f.rvStars === 'ocultas' ? !!r.hidden : (!r.hidden && r.stars === Number(f.rvStars));
  const list = all.filter(match).filter(r => !q || [r.userName, r.comment, r.productName, productById(r.productId)?.name, productById(r.productId)?.store].some(v => (v || '').toLowerCase().includes(q)));
  const avg = visible.length ? visible.reduce((s, r) => s + r.stars, 0) / visible.length : 0;
  const stores = DB.users.filter(u => u.role === 'producer').map(u => { const s = storeRatingOf(u.id); return [`${esc(u.store || u.name)} <span class="text-fg3">(${s.count})</span>`, s.avg, s.count]; }).filter(x => x[2]).sort((a, b) => b[1] - a[1]);
  return `
  ${adminHead('Avaliações', 'Notas e comentários dos clientes. Oculte o que for ofensivo, falso ou expuser dados pessoais.')}
  <div class="stat-grid">
    <div class="stat-tile"><div class="stat-label">Nota média da plataforma</div><div class="stat-value tabular">${visible.length ? avgStr(avg) : '—'}</div><div class="stat-delta"><span class="stars">${visible.length ? starStr(avg) : ''}</span></div></div>
    <div class="stat-tile"><div class="stat-label">Avaliações publicadas</div><div class="stat-value tabular">${visible.length}</div><div class="stat-delta">${visible.filter(r => r.comment).length} com comentário</div></div>
    <div class="stat-tile"><div class="stat-label">Notas baixas sem resposta</div><div class="stat-value tabular ${visible.some(r => r.stars <= 3 && !r.reply) ? 'text-warn' : ''}">${visible.filter(r => r.stars <= 3 && !r.reply).length}</div><div class="stat-delta">1 a 3 estrelas</div></div>
    <div class="stat-tile"><div class="stat-label">Ocultas pela moderação</div><div class="stat-value tabular">${hiddenCount}</div></div>
  </div>
  <div class="admin-grid mt-4">
    <section class="card"><h2 class="card-title">Como as notas se dividem</h2>${visible.length ? distHtml(visible) : '<p class="text-sm text-fg2">Sem avaliações ainda.</p>'}</section>
    <section class="card"><h2 class="card-title">Nota de cada loja</h2>${stores.length ? hbars(stores.map(x => [x[0], x[1]]), v => avgStr(v) + ' ★') : '<p class="text-sm text-fg2">Sem avaliações ainda.</p>'}</section>
  </div>
  <div class="mt-4">${pills('rvStars', [['todas', 'Todas', visible.length], ...[5, 4, 3, 2, 1].map(n => [String(n), n + ' ★', visible.filter(r => r.stars === n).length]), ['ocultas', 'Ocultas', hiddenCount]])}</div>
  <div class="toolbar">${searchBox('adm-rv-q', 'rvQ', 'Buscar por cliente, produto, loja ou comentário')}<span class="text-sm text-fg2">${list.length} resultado(s)</span></div>
  ${list.length ? `<div class="card">${list.map(r => reviewItem(r, 'admin')).join('')}</div>` : '<div class="empty-state"><div class="empty-state-title">Nenhuma avaliação encontrada</div><div class="empty-state-desc">Mude o filtro ou a busca.</div></div>'}`;
}
function attachReviewActions() {
  document.querySelectorAll('[data-prf]').forEach(b => b.addEventListener('click', () => { STATE.prf = b.dataset.prf; render(); }));
  document.querySelectorAll('[data-rv-reply]').forEach(b => b.addEventListener('click', () => {
    const r = (DB.reviews || []).find(x => x.id === Number(b.dataset.rvReply));
    if (!r || STATE.role !== 'producer' || r.producerId !== STATE.producerId) return;
    confirmDialog({
      title: r.reply ? 'Editar resposta' : 'Responder avaliação',
      message: `<span class="stars">${starStr(r.stars)}</span> “${esc(r.comment || 'sem comentário')}”`,
      confirmText: 'Publicar resposta',
      extraHtml: `<div class="form-group mt-3"><label class="form-label" for="dlg-note">Sua resposta (aparece para todos os clientes)</label><textarea class="form-input" id="dlg-note" maxlength="300">${esc(r.reply?.text || '')}</textarea></div>`,
    }, () => {
      const t = document.getElementById('dlg-note').value.trim();
      if (t.length < 2) { toast('Escreva a resposta', 'error'); return false; }
      r.reply = { text: t.slice(0, 300), date: todayISO() }; saveDB(); render();
      toast('Resposta publicada', 'success');
    });
  }));
  document.querySelectorAll('[data-rv-hide]').forEach(b => b.addEventListener('click', () => {
    const r = (DB.reviews || []).find(x => x.id === Number(b.dataset.rvHide));
    if (!r || STATE.role !== 'admin') return;
    if (r.hidden) { delete r.hidden; saveDB(); render(); toast('Avaliação visível de novo', 'success'); return; }
    confirmDialog({
      title: 'Ocultar esta avaliação?', message: 'Ela some da loja e deixa de contar na nota do produto. Dá para mostrar de novo depois.',
      confirmText: 'Ocultar', danger: true,
      extraHtml: '<div class="form-group mt-3"><label class="form-label" for="dlg-reason">Motivo</label><select class="form-input form-select" id="dlg-reason"><option>Linguagem ofensiva</option><option>Informação falsa ou propaganda</option><option>Expõe dados pessoais</option><option>Não fala do produto</option></select></div>',
    }, () => { r.hidden = { reason: document.getElementById('dlg-reason').value, date: todayISO() }; saveDB(); render(); toast('Avaliação ocultada', 'success'); });
  }));
}
function sortProducts(list) {
  const s = STATE.sort || 'relevance', arr = [...list];
  if (s === 'price_asc') arr.sort((a, b) => a.price - b.price);
  else if (s === 'price_desc') arr.sort((a, b) => b.price - a.price);
  else if (s === 'name') arr.sort((a, b) => a.name.localeCompare(b.name));
  else if (s === 'rating') arr.sort((a, b) => { const ra = ratingOf(a.id), rb = ratingOf(b.id); return rb.avg - ra.avg || rb.count - ra.count || a.name.localeCompare(b.name); });
  else { const sold = soldByProduct(); arr.sort((a, b) => (sold[b.id] || 0) - (sold[a.id] || 0) || a.name.localeCompare(b.name)); }
  return arr;
}
function addressText(a) {
  return `${esc(a.name)}${a.phone ? ' · ' + esc(a.phone) : ''}<br>${esc(a.street)}, ${esc(a.num)}${a.district ? ' — ' + esc(a.district) : ''}<br>${esc(a.city)} / ${esc(a.uf)}${a.cep ? ' · CEP ' + esc(a.cep) : ''}`;
}
function productCard(p) {
  const q = cartQty(p.id), out = p.stock <= 0, low = !out && p.stock <= 5;
  return `
  <div class="product-card ${out ? 'soldout' : ''}" data-pid="${p.id}" tabindex="0" aria-label="${esc(p.name)}, ${fmt(p.price)} por ${unitWord(p)}">
    <div class="product-img" aria-hidden="true">${pVisual(p)}</div>
    <div class="product-info">
      <div class="product-name">${esc(p.name)}</div>
      <div class="product-seller">${esc(p.store)}</div>
      <div class="product-rating">${(rt => rt.count ? `★ ${avgStr(rt.avg)} <span class="text-fg3">(${rt.count})</span>` : '<span class="text-fg3">Sem avaliações</span>')(ratingOf(p.id))}</div>
      <div class="product-price">${fmt(p.price)}${unitTag(p)}</div>
      ${out ? '<div class="stock-note" style="color:var(--danger)">Esgotado</div>' : low ? `<div class="stock-note">Últimas ${qtyLabel(p, p.stock)}</div>` : ''}
    </div>
    <div class="card-actions">
      ${out ? '<button class="btn btn-secondary btn-sm" disabled>Esgotado</button>'
        : q ? `<div class="card-qty"><button data-dec="${p.id}" aria-label="Tirar ${unitStep(p) < 1 ? 'meio quilo' : '1 ' + unitWord(p)}">−</button><span>${qtyLabel(p, q)} na cesta</span><button data-inc="${p.id}" aria-label="Pôr mais ${unitStep(p) < 1 ? 'meio quilo' : '1 ' + unitWord(p)}" ${q + unitStep(p) > p.stock ? 'disabled' : ''}>+</button></div>`
        : `<button class="btn btn-primary btn-sm" data-add="${p.id}">+ Pôr na cesta</button>`}
    </div>
  </div>`;
}

function renderConsumerHome() {
  const live = DB.products.filter(p => p.active && sellerOk(p));
  const cats = FOOD_CATS.filter(c => live.some(p => p.category === c));
  if (STATE.filterCategory !== 'Todos' && !cats.includes(STATE.filterCategory)) STATE.filterCategory = 'Todos';
  const q = STATE.searchQuery.trim().toLowerCase();
  const filtered = sortProducts(live.filter(p => (STATE.filterCategory === 'Todos' || p.category === STATE.filterCategory)
    && (!q || p.name.toLowerCase().includes(q) || (p.store || '').toLowerCase().includes(q) || p.category.toLowerCase().includes(q))));
  const grouped = STATE.filterCategory === 'Todos' && !q && (STATE.sort || 'relevance') === 'relevance';
  const groups = grouped ? cats.map(c => ({ title: c, items: filtered.filter(p => p.category === c) })).filter(g => g.items.length) : [{ title: null, items: filtered }];
  const hasBar = STATE.cart.length > 0;
  return `
  <div class="consumer-wrap ${hasBar ? 'has-bar' : ''}">
    <div class="shop-hello">Olá, ${esc((STATE.user.name || '').split(' ')[0])}! O que vai para a mesa hoje?</div>
    <div class="shop-tools">
      <div class="search-input-wrap"><span class="search-icon" aria-hidden="true">🔍</span><input class="form-input search-input" type="search" id="search-input" placeholder="Buscar frutas, verduras, grãos ou quitandas…" value="${esc(STATE.searchQuery)}" aria-label="Buscar produtos"></div>
      <select class="form-input form-select" id="sort-select" aria-label="Ordenar produtos" style="width:auto">${Object.entries(SORTS).map(([k, v]) => `<option value="${k}" ${(STATE.sort || 'relevance') === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
    </div>
    ${grouped && live.length ? `
    <div class="feira-banner">
      <div class="feira-emojis" aria-hidden="true">🍌🍅🥬</div>
      <div class="feira-text">
        <div class="feira-title">Colhido hoje, na sua mesa amanhã</div>
        <div class="text-sm text-fg2">${live.length} produtos fresquinhos de ${new Set(live.map(p => p.producerId)).size} produtores da região. Entrega grátis.</div>
      </div>
    </div>` : ''}
    <div class="chips-sticky"><div class="filter-row" aria-label="Seções da loja">
      ${['Todos', ...cats].map(c => `<button class="category-chip ${STATE.filterCategory === c ? 'active' : ''}" data-cat="${c}" aria-pressed="${STATE.filterCategory === c}">${c === 'Todos' ? 'Tudo' : (EMOJI_MAP[c] || '') + ' ' + c}</button>`).join('')}
    </div></div>
    ${q ? `<p class="text-sm text-fg2">${filtered.length} resultado(s) para “${esc(STATE.searchQuery.trim())}” · <button class="link-btn" id="clear-search">Limpar busca</button></p>` : ''}
    ${!filtered.length ? `<div class="empty-state mt-4"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Nada encontrado</div><div class="empty-state-desc">Tente outra palavra ou veja todos os produtos.</div><button class="btn btn-primary mt-3" id="clear-search">Ver todos os produtos</button></div>`
      : groups.map(g => `
    ${g.title ? `<h2 class="cat-title">${EMOJI_MAP[g.title] || ''} ${g.title} <span class="cat-count">${g.items.length} produto(s)</span></h2>` : ''}
    <div class="products-grid">${g.items.map(productCard).join('')}</div>`).join('')}
  </div>
  ${hasBar ? `<button class="cart-bar" id="cart-bar"><span>🛒 Ver cesta · ${cartCount()} item(ns)</span><span class="tabular">${fmt(cartTotal())}</span></button>` : ''}`;
}

function renderProductDetail() {
  const p = productById(STATE.selectedProduct);
  if (!p || !p.active || !sellerOk(p)) { STATE.view = 'home'; return renderConsumerHome(); }
  const inCart = cartQty(p.id), left = Math.max(0, p.stock - inCart);
  const step = unitStep(p);
  STATE.productQty = roundQty(Math.min(Math.max(step, STATE.productQty), Math.max(step, left)), step);
  const seller = DB.users.find(u => u.id === p.producerId);
  const more = DB.products.filter(x => x.producerId === p.producerId && x.id !== p.id && x.active && x.stock > 0).slice(0, 4);
  return `
  <div class="product-detail">
    <button class="btn btn-ghost btn-sm mb-3" id="back-home">← Voltar para a loja</button>
    <div class="product-detail-grid">
      <div class="product-detail-img" aria-hidden="true">${pVisual(p)}</div>
      <div>
        <span class="badge badge-neutral">${esc(p.category)}</span>
        <h1 class="font-head text-2xl font-700 mt-2 wrap-balance">${esc(p.name)}</h1>
        <p class="text-fg2 text-sm mt-1">Vendido por <strong>${esc(p.store)}</strong>${seller?.city ? ' · ' + esc(seller.city) : ''}${(s => s.count ? ` · loja com nota <span class="stars">★</span> ${avgStr(s.avg)}` : '')(storeRatingOf(p.producerId))}</p>
        <div class="flex items-center gap-2 mt-2" style="flex-wrap:wrap">
          ${(rt => rt.count ? `<span class="stars" aria-label="Nota ${avgStr(rt.avg)} de 5">${starStr(rt.avg)}</span><span class="text-sm font-600">${avgStr(rt.avg)}</span><button class="link-btn" id="go-reviews">${rt.count} avaliação(ões)</button>` : '<span class="text-fg3 text-sm">Sem avaliações ainda</span>')(ratingOf(p.id))}
          <span class="badge badge-${p.stock > 10 ? 'accent' : p.stock > 0 ? 'warn' : 'danger'}">${p.stock > 0 ? qtyLabel(p, p.stock) + ' disponíveis' : 'Esgotado'}</span>
        </div>
        <div class="product-detail-price mt-3">${fmt(p.price)}${unitTag(p)}</div>
        <p class="text-xs text-fg3">Preço por ${unitWord(p)}.${step < 1 ? ' Dá para pedir de meio em meio quilo.' : ''}</p>
        ${p.description ? `<p class="text-sm text-fg2 mt-3">${esc(p.description)}</p>` : ''}
        ${seller?.storeDesc ? `<p class="text-xs text-fg2 mt-2">Sobre a loja: ${esc(seller.storeDesc)}</p>` : ''}
        ${left > 0 ? `
        <div class="product-detail-actions">
          <div class="qty-control" role="group" aria-label="Quantidade">
            <button class="qty-btn" id="qty-down" aria-label="Diminuir">−</button>
            <span class="qty-val tabular" id="qty-val" aria-live="polite">${qtyLabel(p, STATE.productQty)}</span>
            <button class="qty-btn" id="qty-up" aria-label="Aumentar">+</button>
          </div>
          <button class="btn btn-primary" id="add-detail">Pôr na cesta · <span id="qty-total">${fmt(p.price * STATE.productQty)}</span></button>
        </div>` : `<p class="text-sm mt-3 ${p.stock > 0 ? 'text-fg2' : 'text-danger'}">${p.stock > 0 ? 'Você já pôs na cesta tudo o que tem disponível.' : 'Este produto acabou. Volte em breve!'}</p>`}
        ${inCart ? `<p class="text-sm text-accent mt-2">✓ ${qtyLabel(p, inCart)} na sua cesta · <button class="link-btn" id="go-cart-inline">Ver cesta</button></p>` : ''}
      </div>
    </div>
    ${productReviewsHtml(p)}
    ${more.length ? `<h2 class="cat-title">Mais da ${esc(p.store)}</h2><div class="products-grid">${more.map(productCard).join('')}</div>` : ''}
  </div>`;
}

function renderCart() {
  const items = STATE.cart.map(i => ({ i, p: productById(i.productId) }));
  const stores = [...new Set(items.map(x => x.p?.store || 'Loja'))];
  return `
  <div class="cart-wrap">
    <button class="btn btn-ghost btn-sm mb-2" data-go="home">← Continuar comprando</button>
    <div class="flex items-center gap-2 mb-2" style="flex-wrap:wrap">
      <h1 class="font-head text-xl font-700">Sua cesta</h1>
      ${items.length ? `<span class="text-fg3 text-sm">${cartCount()} item(ns)</span><button class="btn btn-ghost btn-sm text-danger" id="clear-cart" style="margin-left:auto">Esvaziar cesta</button>` : ''}
    </div>
    ${!items.length ? `<div class="empty-state"><div class="empty-state-icon">🧺</div><div class="empty-state-title">Sua cesta está vazia</div><div class="empty-state-desc">Escolha frutas, verduras e grãos na loja.</div><button class="btn btn-primary mt-3" data-go="home">Ir para a loja</button></div>` : `
    ${stores.map(s => `<div class="store-group">🏪 ${esc(s)}</div>${items.filter(x => (x.p?.store || 'Loja') === s).map(({ i, p }) => `
    <div class="cart-item">
      <div class="cart-item-img" aria-hidden="true">${pVisual(p)}</div>
      <div class="cart-item-info">
        <div class="font-600">${esc(i.name)}</div>
        <div class="text-sm text-fg2">${fmt(i.price)} por ${unitWord(p)}</div>
        <div class="flex items-center gap-2 mt-1" style="flex-wrap:wrap">
          <div class="qty-control" role="group" aria-label="Quantidade de ${esc(i.name)}">
            <button class="qty-btn" data-dec="${i.productId}" aria-label="Diminuir">−</button>
            <span class="qty-val tabular">${qtyLabel(p, i.qty)}</span>
            <button class="qty-btn" data-inc="${i.productId}" aria-label="Aumentar" ${p && i.qty + unitStep(p) > p.stock + 1e-9 ? 'disabled' : ''}>+</button>
          </div>
          <button class="btn btn-ghost btn-sm text-danger" data-remove="${i.productId}">Remover</button>
          ${p && i.qty >= p.stock ? '<span class="stock-note">Máximo disponível</span>' : ''}
        </div>
      </div>
      <div class="font-head font-700 tabular">${fmt(i.price * i.qty)}</div>
    </div>`).join('')}`).join('')}
    <div class="cart-summary">
      <div class="summary-row"><span>Produtos</span><span class="tabular">${fmt(cartTotal())}</span></div>
      <div class="summary-row"><span>Entrega</span><span class="text-accent">Grátis</span></div>
      <div class="summary-row total"><span>Total</span><span class="tabular text-primary">${fmt(cartTotal())}</span></div>
      ${stores.length > 1 ? `<p class="text-xs text-fg3 mt-1">Sua cesta tem produtos de ${stores.length} produtores.</p>` : ''}
      <button class="btn btn-primary btn-lg w-full mt-3" id="go-checkout">Continuar para a entrega →</button>
    </div>`}
  </div>`;
}

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const PAY_LABEL = { pix: 'PIX', card: 'Cartão de crédito', boleto: 'Boleto bancário', dinheiro: 'Dinheiro', combinar: 'A combinar' };
// Dados da compra em andamento. O endereço do último pedido vem preenchido para facilitar.
function coDefaults() {
  if (!STATE.co) {
    const last = [...DB.orders].reverse().find(o => o.consumerId === STATE.user.id && o.address);
    STATE.co = Object.assign({ name: STATE.user.name, phone: STATE.user.phone || '', cep: '', street: '', num: '', district: '', city: '', uf: 'MG' }, last?.address || {}, { pay: last?.payment?.method || 'pix' });
  }
  return STATE.co;
}
function renderCheckout() {
  if (!STATE.cart.length) { STATE.view = 'cart'; return renderCart(); }
  const c = coDefaults(), step = STATE.checkoutStep;
  const field = (id, label, val, attrs = '', cls = '') => `<div class="form-group ${cls}"><label class="form-label" for="co-${id}">${label}</label><input class="form-input" id="co-${id}" data-co="${id}" value="${esc(val)}" ${attrs}><div class="field-err" id="err-${id}"></div></div>`;
  let body;
  if (step === 1) body = `
    <div class="card"><h2 class="font-600 mb-3">📍 Onde vamos entregar?</h2>
      <form id="co-form" novalidate><div class="form-grid">
        ${field('name', 'Nome de quem vai receber', c.name, 'autocomplete="name" maxlength="80"', 'span-2')}
        ${field('phone', 'Telefone (WhatsApp)', c.phone, 'type="tel" inputmode="tel" autocomplete="tel" placeholder="(31) 99999-9999" maxlength="16"')}
        ${field('cep', 'CEP', c.cep, 'inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" maxlength="9"')}
        ${field('street', 'Rua ou avenida', c.street, 'autocomplete="address-line1" maxlength="100"', 'span-2')}
        ${field('num', 'Número', c.num, 'maxlength="10" placeholder="Ex.: 42 ou S/N"')}
        ${field('district', 'Bairro', c.district, 'maxlength="60"')}
        ${field('city', 'Cidade', c.city, 'autocomplete="address-level2" maxlength="60"')}
        <div class="form-group"><label class="form-label" for="co-uf">Estado</label><select class="form-input form-select" id="co-uf" data-co="uf">${UFS.map(u => `<option ${c.uf === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
      </div>
      <button type="submit" class="btn btn-primary btn-lg w-full mt-4">Continuar para o pagamento →</button></form>
    </div>`;
  else if (step === 2) body = `
    <div class="card"><h2 class="font-600 mb-3">💳 Como você quer pagar?</h2>
      <form id="co-form" novalidate><div style="display:grid;gap:.6rem">
        ${[['pix', '📱', 'PIX', 'Pagamento na hora, com o código gerado ao confirmar.'], ['card', '💳', 'Cartão de crédito', 'À vista, em 1 vez.'], ['boleto', '🏦', 'Boleto bancário', 'Pode levar até 3 dias úteis para confirmar.']].map(([k, ic, t, d]) => `<label class="pay-opt"><input type="radio" name="pay" value="${k}" ${c.pay === k ? 'checked' : ''} style="accent-color:var(--primary);width:18px;height:18px"><span aria-hidden="true" style="font-size:1.3rem">${ic}</span><span><span class="font-600">${t}</span><br><span class="text-xs text-fg2">${d}</span></span></label>`).join('')}
      </div>
      <div id="card-fields" class="mt-3 ${c.pay === 'card' ? '' : 'hidden'}">
        <p class="text-xs text-warn mb-2">Isto é uma simulação: não digite os dados de um cartão de verdade. Só os 4 últimos números ficam guardados.</p>
        <div class="form-grid">
          <div class="form-group span-2"><label class="form-label" for="cc-num">Número do cartão</label><input class="form-input" id="cc-num" inputmode="numeric" autocomplete="off" placeholder="0000 0000 0000 0000" maxlength="23"><div class="field-err" id="err-cc-num"></div></div>
          <div class="form-group span-2"><label class="form-label" for="cc-name">Nome impresso no cartão</label><input class="form-input" id="cc-name" autocomplete="off" maxlength="60"><div class="field-err" id="err-cc-name"></div></div>
          <div class="form-group"><label class="form-label" for="cc-exp">Validade</label><input class="form-input" id="cc-exp" inputmode="numeric" placeholder="MM/AA" maxlength="5" autocomplete="off"><div class="field-err" id="err-cc-exp"></div></div>
          <div class="form-group"><label class="form-label" for="cc-cvv">Código de segurança</label><input class="form-input" id="cc-cvv" type="password" inputmode="numeric" placeholder="3 números" maxlength="4" autocomplete="off"><div class="field-err" id="err-cc-cvv"></div></div>
        </div>
      </div>
      <div class="flex gap-2 mt-4" style="flex-wrap:wrap"><button type="button" class="btn btn-secondary" data-co-step="1">← Voltar</button><button type="submit" class="btn btn-primary" style="flex:1">Revisar o pedido →</button></div></form>
    </div>`;
  else body = `
    <div class="card"><h2 class="font-600 mb-3">📋 Confira antes de confirmar</h2>
      ${STATE.cart.map(i => `<div class="summary-row"><span>${pEmoji(productById(i.productId))} ${esc(i.name)} × ${fmtQty(i.qty)}</span><span class="tabular">${fmt(i.price * i.qty)}</span></div>`).join('')}
      <div class="summary-row"><span>Entrega</span><span class="text-accent">Grátis</span></div>
      <div class="summary-row total"><span>Total</span><span class="tabular text-primary">${fmt(cartTotal())}</span></div>
      <div class="review-block"><div class="flex justify-between items-center"><strong>Entrega</strong><button class="link-btn" data-co-step="1">Alterar</button></div>${addressText(c)}</div>
      <div class="review-block"><div class="flex justify-between items-center"><strong>Pagamento</strong><button class="link-btn" data-co-step="2">Alterar</button></div>${PAY_LABEL[c.pay]}${c.pay === 'card' && c.last4 ? ' final ' + esc(c.last4) : ''}</div>
      <button class="btn btn-primary btn-lg w-full mt-4" id="confirm-order">✅ Confirmar pedido de ${fmt(cartTotal())}</button>
      <p class="text-xs text-fg3 mt-2" style="text-align:center">Dá para cancelar enquanto o pedido não sai para entrega.</p>
    </div>`;
  return `
  <div class="cart-wrap">
    <div class="flex justify-between items-center mb-3" style="flex-wrap:wrap;gap:.5rem">
      <button class="btn btn-ghost btn-sm" id="back-cart">← Voltar para a cesta</button>
      <button class="btn btn-ghost btn-sm text-danger" id="cancel-checkout">✕ Cancelar compra</button>
    </div>
    <h1 class="font-head text-xl font-700 mb-3">Finalizar compra</h1>
    <div class="checkout-steps">${['Entrega', 'Pagamento', 'Revisão'].map((s, i) => `<div class="step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}">${step > i + 1 ? '✓ ' : ''}${s}</div>`).join('')}</div>
    ${body}
  </div>`;
}

function renderMyOrders() {
  const all = DB.orders.filter(o => o.consumerId === STATE.user.id).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const groups = { andamento: o => o.status === 'processando' || o.status === 'em trânsito', entregues: o => o.status === 'entregue', cancelados: o => o.status === 'cancelado', todos: () => true };
  const labels = { andamento: 'Em andamento', entregues: 'Entregues', cancelados: 'Cancelados', todos: 'Todos' };
  const f = STATE.myOrdersFilter || (all.some(groups.andamento) ? 'andamento' : 'todos');
  const list = all.filter(groups[f]);
  const trackIdx = { processando: 0, 'em trânsito': 1, entregue: 2 };
  return `
  <div class="cart-wrap">
    <button class="btn btn-ghost btn-sm mb-2" data-go="home">← Voltar para a loja</button>
    <h1 class="font-head text-xl font-700 mb-3">Meus pedidos</h1>
    <div class="pill-row">${Object.keys(labels).map(k => `<button class="category-chip ${f === k ? 'active' : ''}" data-my-filter="${k}">${labels[k]} <span class="pill-n">${all.filter(groups[k]).length}</span></button>`).join('')}</div>
    ${!list.length ? `<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-title">${all.length ? 'Nenhum pedido aqui' : 'Você ainda não fez pedidos'}</div><button class="btn btn-primary mt-3" data-go="home">Ir para a loja</button></div>` :
    list.map(o => `
    <div class="card card-sm mb-3">
      <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:.4rem">
        <span class="font-600 font-head">Pedido #${o.id}</span>
        ${statusBadgeHtml(o.status)}
      </div>
      <div class="text-sm text-fg2 mt-1">Feito em ${fmtDate(o.date)}${o.deliveredAt ? ' · entregue em ' + fmtDate(o.deliveredAt) : ''}${o.payment ? ' · ' + PAY_LABEL[o.payment.method] : ''}</div>
      ${o.status !== 'cancelado' ? `<div class="track" aria-label="Andamento: ${STATUS_LABEL[o.status]}">${['Preparando', 'A caminho', 'Entregue'].map((s, i) => `<div class="track-step ${i <= trackIdx[o.status] ? 'done' : ''}">${s}</div>`).join('')}</div>` : ''}
      <div class="text-sm mt-3">${o.items.map(i => `${pEmoji(productById(i.productId))} ${esc(i.name)} × ${fmtQty(i.qty)}`).join(' · ')}</div>
      <div class="flex justify-between items-center mt-2">
        <span class="text-sm text-fg2">${o.items.length} produto(s)</span>
        <span class="font-head font-700 text-primary tabular">${fmt(o.total)}</span>
      </div>
      ${orderAfterSale(o)}
      ${reviewBlock(o)}
    </div>`).join('')}
  </div>`;
}

function renderOrderSuccess() {
  const o = DB.orders.find(x => x.id === STATE.lastOrderId);
  if (!o) { STATE.view = 'home'; return renderConsumerHome(); }
  const payInfo = { pix: 'Pague com PIX para liberar o pedido. Nesta demonstração, o pagamento é aprovado na hora.', card: `Pagamento no cartão final ${esc(o.payment?.last4 || '')} aprovado.`, boleto: 'O boleto foi gerado. Nesta demonstração, ele é aprovado na hora.' }[o.payment?.method] || '';
  return `
  <div class="cart-wrap">
    <div class="success-banner">
      <div class="success-icon" aria-hidden="true">🎉</div>
      <h1 class="font-head text-2xl font-700">Pedido confirmado!</h1>
      <p class="text-fg2 mt-2">Pedido <strong>#${o.id}</strong> · ${fmt(o.total)}</p>
      <p class="text-sm text-fg2 mt-1">${payInfo}</p>
      ${o.address ? `<div class="review-block" style="text-align:left"><strong>Vai ser entregue para</strong><br>${addressText(o.address)}</div>` : ''}
      <div class="flex gap-2 justify-center mt-4" style="flex-wrap:wrap">
        <button class="btn btn-secondary" data-go="orders">📦 Acompanhar pedido</button>
        <button class="btn btn-primary" data-go="home">Continuar comprando</button>
      </div>
    </div>
  </div>`;
}

function attachConsumer() {
  const go = v => { STATE.view = v; render(); window.scrollTo(0, 0); };
  document.getElementById('go-home')?.addEventListener('click', () => go('home'));
  document.getElementById('go-cart')?.addEventListener('click', () => go('cart'));
  document.getElementById('cart-bar')?.addEventListener('click', () => go('cart'));
  document.getElementById('go-cart-inline')?.addEventListener('click', () => go('cart'));
  document.getElementById('go-orders-nav')?.addEventListener('click', () => go('orders'));
  document.getElementById('back-home')?.addEventListener('click', () => go('home'));
  document.getElementById('back-cart')?.addEventListener('click', () => go('cart'));
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
  document.getElementById('toggle-theme')?.addEventListener('click', toggleTheme);

  // Busca, ordem e seções
  const si = document.getElementById('search-input');
  if (si) si.addEventListener('input', e => {
    STATE.searchQuery = e.target.value; render();
    const n = document.getElementById('search-input');
    if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
  });
  document.getElementById('sort-select')?.addEventListener('change', e => { STATE.sort = e.target.value; render(); });
  document.getElementById('clear-search')?.addEventListener('click', () => { STATE.searchQuery = ''; STATE.filterCategory = 'Todos'; render(); });
  document.querySelectorAll('.category-chip[data-cat]').forEach(c => c.addEventListener('click', () => { STATE.filterCategory = c.dataset.cat; render(); }));
  document.querySelectorAll('[data-my-filter]').forEach(b => b.addEventListener('click', () => { STATE.myOrdersFilter = b.dataset.myFilter; render(); }));

  // Abrir um produto (clique ou Enter)
  document.querySelectorAll('.product-card').forEach(card => {
    const open = () => { STATE.selectedProduct = Number(card.dataset.pid); STATE.productQty = 1; go('product'); };
    card.addEventListener('click', e => { if (e.target.closest('button')) return; open(); });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target === card) open(); });
  });
  // Pôr e tirar da cesta (nos cartões e na cesta)
  document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); if (addToCart(Number(b.dataset.add), 1)) render(); }));
  document.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const id = Number(b.dataset.inc); adjustCart(id, unitStep(productById(id))); render(); }));
  document.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const id = Number(b.dataset.dec); adjustCart(id, -unitStep(productById(id))); render(); }));
  document.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => { STATE.cart = STATE.cart.filter(i => i.productId !== Number(b.dataset.remove)); saveCart(); render(); toast('Item tirado da cesta'); }));

  // Página do produto
  if (STATE.view === 'product') {
    const p = productById(STATE.selectedProduct);
    const left = p ? Math.max(0, p.stock - cartQty(p.id)) : 0;
    const step = unitStep(p);
    const upd = () => { document.getElementById('qty-val').textContent = qtyLabel(p, STATE.productQty); const t = document.getElementById('qty-total'); if (t) t.textContent = fmt(p.price * STATE.productQty); };
    document.getElementById('qty-up')?.addEventListener('click', () => { if (STATE.productQty + step <= left + 1e-9) { STATE.productQty = roundQty(STATE.productQty + step, step); upd(); } else toast(`Só tem ${qtyLabel(p, left)} disponível(is)`, 'error'); });
    document.getElementById('qty-down')?.addEventListener('click', () => { STATE.productQty = Math.max(step, roundQty(STATE.productQty - step, step)); upd(); });
    document.getElementById('add-detail')?.addEventListener('click', () => { if (addToCart(STATE.selectedProduct, STATE.productQty)) { STATE.productQty = 1; render(); } });
  }
  document.getElementById('go-checkout')?.addEventListener('click', () => { STATE.checkoutStep = 1; go('checkout'); });

  // Finalizar compra: entrega e pagamento
  const coForm = document.getElementById('co-form');
  if (coForm) {
    const c = STATE.co;
    const setErr = (id, msg) => {
      const e = document.getElementById('err-' + id);
      const inp = document.getElementById(id.startsWith('cc-') ? id : 'co-' + id);
      if (e) e.textContent = msg || '';
      if (inp) { inp.classList.toggle('invalid', !!msg); inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); }
      return !msg;
    };
    document.getElementById('co-cep')?.addEventListener('input', e => { const d = e.target.value.replace(/\D/g, '').slice(0, 8); e.target.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d; });
    document.getElementById('co-phone')?.addEventListener('input', e => { const d = e.target.value.replace(/\D/g, '').slice(0, 11); e.target.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d; });
    document.getElementById('cc-num')?.addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 '); });
    document.getElementById('cc-exp')?.addEventListener('input', e => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); e.target.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; });
    document.querySelectorAll('input[name="pay"]').forEach(r => r.addEventListener('change', () => { c.pay = r.value; document.getElementById('card-fields').classList.toggle('hidden', r.value !== 'card'); }));
    coForm.addEventListener('submit', e => {
      e.preventDefault();
      if (STATE.checkoutStep === 1) {
        document.querySelectorAll('[data-co]').forEach(el => { c[el.dataset.co] = el.value.trim(); });
        let ok = true;
        ok = setErr('name', c.name.length >= 3 ? '' : 'Digite o nome de quem vai receber') && ok;
        ok = setErr('phone', /^\(\d{2}\) \d{4,5}-\d{4}$/.test(c.phone) ? '' : 'Digite um telefone com DDD') && ok;
        ok = setErr('cep', /^\d{5}-\d{3}$/.test(c.cep) ? '' : 'O CEP tem 8 números') && ok;
        ok = setErr('street', c.street ? '' : 'Digite a rua') && ok;
        ok = setErr('num', c.num ? '' : 'Digite o número (ou S/N)') && ok;
        ok = setErr('district', c.district ? '' : 'Digite o bairro') && ok;
        ok = setErr('city', c.city ? '' : 'Digite a cidade') && ok;
        if (!ok) { coForm.querySelector('.invalid')?.focus(); return; }
        STATE.checkoutStep = 2; render(); window.scrollTo(0, 0);
      } else {
        c.pay = coForm.querySelector('input[name="pay"]:checked')?.value || 'pix';
        if (c.pay === 'card') {
          const num = document.getElementById('cc-num').value.replace(/\D/g, '');
          const exp = document.getElementById('cc-exp').value;
          const [mm, yy] = exp.split('/').map(Number);
          const now = new Date();
          const expOk = mm >= 1 && mm <= 12 && (2000 + yy > now.getFullYear() || (2000 + yy === now.getFullYear() && mm >= now.getMonth() + 1));
          let ok = true;
          ok = setErr('cc-num', num.length >= 13 && num.length <= 19 ? '' : 'Número do cartão incompleto') && ok;
          ok = setErr('cc-name', document.getElementById('cc-name').value.trim().length >= 3 ? '' : 'Digite o nome que está no cartão') && ok;
          ok = setErr('cc-exp', /^\d{2}\/\d{2}$/.test(exp) && expOk ? '' : 'Validade errada ou vencida') && ok;
          ok = setErr('cc-cvv', /^\d{3,4}$/.test(document.getElementById('cc-cvv').value) ? '' : 'São 3 ou 4 números') && ok;
          if (!ok) { coForm.querySelector('.invalid')?.focus(); return; }
          c.last4 = num.slice(-4); // só os 4 últimos números são guardados
        } else delete c.last4;
        STATE.checkoutStep = 3; render(); window.scrollTo(0, 0);
      }
    });
  }
  document.querySelectorAll('[data-co-step]').forEach(b => b.addEventListener('click', () => { STATE.checkoutStep = Number(b.dataset.coStep); render(); }));
  document.getElementById('confirm-order')?.addEventListener('click', confirmOrder);
  // Cancelar a compra antes de finalizar
  document.getElementById('cancel-checkout')?.addEventListener('click', () => confirmDialog({
    title: 'Cancelar esta compra?',
    message: 'Nada foi cobrado ainda. Você pode guardar os itens no carrinho para comprar depois ou esvaziar o carrinho.',
    confirmText: 'Esvaziar cesta', cancelText: 'Continuar comprando', danger: true,
    secondary: { text: 'Sair e guardar itens', onClick: () => { STATE.view = 'cart'; STATE.checkoutStep = 1; render(); toast('Compra cancelada. Seus itens continuam na cesta.'); } },
  }, () => { STATE.cart = []; saveCart(); STATE.view = 'home'; STATE.checkoutStep = 1; render(); toast('Compra cancelada e cesta esvaziada.'); }));
  document.getElementById('clear-cart')?.addEventListener('click', () => confirmDialog({
    title: 'Esvaziar a cesta?', message: `Todos os ${cartCount()} itens serão tirados da cesta.`, confirmText: 'Esvaziar', danger: true,
  }, () => { STATE.cart = []; saveCart(); render(); toast('Cesta esvaziada.'); }));
  // Cancelar pedido / devolver itens
  document.querySelectorAll('[data-cancel-order]').forEach(b => b.addEventListener('click', () => openCancelOrder(Number(b.dataset.cancelOrder))));
  document.querySelectorAll('[data-return-order]').forEach(b => b.addEventListener('click', () => openReturnModal(Number(b.dataset.returnOrder))));
  // Avaliações
  document.querySelectorAll('[data-review-order]').forEach(b => b.addEventListener('click', () => openReviewModal(Number(b.dataset.reviewOrder))));
  document.getElementById('all-reviews')?.addEventListener('click', () => { STATE.allReviews = STATE.selectedProduct; render(); document.getElementById('reviews')?.scrollIntoView(); });
  document.getElementById('go-reviews')?.addEventListener('click', () => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }));
}

function addToCart(pid, qty) {
  const p = DB.products.find(pr => pr.id === pid);
  if (!p || !p.active || !sellerOk(p)) { toast('Este produto não está mais à venda', 'error'); return false; }
  const existing = STATE.cart.find(i => i.productId === pid);
  const already = existing ? existing.qty : 0;
  if (already + qty > p.stock + 1e-9) {
    const left = p.stock - already;
    toast(left > 0 ? `Só tem mais ${qtyLabel(p, left)} de "${esc(p.name)}"` : `Não tem mais "${esc(p.name)}" disponível`, 'error');
    return false;
  }
  if (existing) { existing.qty = Math.round((existing.qty + qty) * 100) / 100; }
  else { STATE.cart.push({ productId: pid, name: p.name, price: p.price, qty }); }
  saveCart(); toast(`${esc(p.name)} na cesta!`, 'success');
  return true;
}
function adjustCart(pid, delta) {
  const item = STATE.cart.find(i => i.productId === pid);
  if (!item) { if (delta > 0) addToCart(pid, delta); return; }
  const p = productById(pid);
  if (delta > 0 && p && item.qty + delta > p.stock + 1e-9) { toast(`Só tem ${qtyLabel(p, p.stock)} de "${esc(p.name)}"`, 'error'); return; }
  item.qty = Math.round((item.qty + delta) * 100) / 100;
  if (item.qty <= 0) STATE.cart = STATE.cart.filter(i => i.productId !== pid);
  saveCart();
}
function confirmOrder() {
  if (!STATE.co || STATE.checkoutStep !== 3 || !STATE.cart.length) { STATE.checkoutStep = 1; render(); return; }
  // Confere estoque antes de fechar o pedido
  const short = STATE.cart.find(i => { const p = DB.products.find(x => x.id === i.productId); return !p || !p.active || !sellerOk(p) || p.stock < i.qty; });
  if (short) { toast(`Estoque insuficiente para "${esc(short.name)}". Ajuste a quantidade no carrinho.`, 'error'); return; }
  STATE.cart.forEach(i => { const p = DB.products.find(x => x.id === i.productId); p.stock -= i.qty; });
  const id = DB.nextOrderId++;
  const c = STATE.co;
  const items = STATE.cart.map(i => ({ productId: i.productId, producerId: productById(i.productId)?.producerId, name: i.name, qty: i.qty, price: i.price }));
  DB.orders.push({
    id, consumerId: STATE.user.id, consumerName: STATE.user.name,
    items, total: round2(cartTotal()), status: 'processando',
    date: todayISO(), // data local (o toISOString usava o horário de Londres)
    producerId: items[0]?.producerId,
    address: { name: c.name, phone: c.phone, cep: c.cep, street: c.street, num: c.num, district: c.district, city: c.city, uf: c.uf },
    payment: { method: c.pay, ...(c.pay === 'card' && c.last4 ? { last4: c.last4 } : {}) },
  });
  saveDB();
  STATE.cart = []; saveCart();
  delete c.last4; STATE.checkoutStep = 1;
  STATE.lastOrderId = id;
  STATE.view = 'order-success';
  render(); window.scrollTo(0, 0);
}

// ===================== CADASTRO E APROVAÇÃO DE PRODUTORES =====================
// Editor de lista de produtos (usado no pedido para vender e no reenvio)
function rowHtml(p = {}) {
  return `
  <div class="app-row">
    <input class="form-input" data-f="name" maxlength="60" placeholder="Ex.: Alface crespa" aria-label="Produto" value="${esc(p.name || '')}">
    <select class="form-input form-select" data-f="category" aria-label="Categoria">${FOOD_CATS.map(c => `<option ${p.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
    <select class="form-input form-select" data-f="unit" aria-label="Vendido por">${Object.keys(UNITS).map(u => `<option value="${u}" ${(p.unit || 'kg') === u ? 'selected' : ''}>${u}</option>`).join('')}</select>
    <input class="form-input tabular" data-f="stock" type="number" inputmode="numeric" min="0" step="1" placeholder="Qtd." aria-label="Quantidade disponível" value="${p.stock ?? ''}">
    <input class="form-input tabular" data-f="price" type="number" inputmode="decimal" min="0" step="0.01" placeholder="R$" aria-label="Preço em reais" value="${p.price ?? ''}">
    <button type="button" class="btn btn-ghost btn-sm text-danger" data-remove-row aria-label="Remover produto">✕</button>
  </div>`;
}
function rowsEditorHtml(rows) {
  return `
  <div class="app-head"><span>Produto</span><span>Categoria</span><span>Vendido por</span><span>Quantidade</span><span>Preço (R$)</span><span></span></div>
  <div id="app-rows">${(rows && rows.length ? rows : [{}, {}, {}]).map(rowHtml).join('')}</div>
  <button type="button" class="btn btn-secondary btn-sm mt-1" id="add-row">+ Adicionar produto</button>
  <div class="text-sm mt-2" id="rules-live" aria-live="polite"></div>`;
}
function readRows() {
  const rows = [], errors = [];
  document.querySelectorAll('#app-rows .app-row').forEach((el, i) => {
    const g = f => el.querySelector(`[data-f="${f}"]`).value.trim();
    const name = g('name'), stockS = g('stock'), priceS = g('price');
    if (!name && !stockS && !priceS) return; // linha vazia
    const stock = Number(stockS), price = Number(priceS.replace(',', '.'));
    if (!name) errors.push(`Linha ${i + 1}: falta o nome do produto`);
    else if (stockS === '' || !Number.isInteger(stock) || stock < 0) errors.push(`"${name}": informe a quantidade disponível (número inteiro)`);
    else if (!(price > 0)) errors.push(`"${name}": informe um preço maior que zero`);
    else rows.push({ name: name.slice(0, 60), category: g('category'), unit: g('unit'), stock, price: round2(price) });
  });
  return { rows, errors };
}
function bindRowsEditor() {
  const box = document.getElementById('app-rows');
  const live = document.getElementById('rules-live');
  const upd = () => {
    const r = DB.settings, { rows } = readRows();
    const enough = rows.filter(x => x.stock >= r.minStock).length;
    live.innerHTML = enough >= r.minProducts
      ? `<span class="text-accent">✓ ${enough} produto(s) com ${r.minStock} ou mais de estoque. Cumpre a regra.</span>`
      : `<span class="text-warn">! ${enough} de ${r.minProducts} produtos com pelo menos ${r.minStock} de estoque. Pode enviar, mas a aprovação fica mais difícil.</span>`;
  };
  document.getElementById('add-row').addEventListener('click', () => { box.insertAdjacentHTML('beforeend', rowHtml()); upd(); box.lastElementChild.querySelector('input').focus(); });
  box.addEventListener('click', e => { const b = e.target.closest('[data-remove-row]'); if (b) { b.closest('.app-row').remove(); upd(); } });
  box.addEventListener('input', upd);
  box.addEventListener('change', upd);
  upd();
}

// Formulário público "Quero vender no UaiShop"
function renderSignup() {
  if (STATE.signup === 'done') return `
  <section class="login-wrap"><div class="login-card" style="text-align:center">
    <div style="font-size:2.4rem">🌱</div>
    <div class="font-head font-700 text-xl mt-2">Pedido enviado!</div>
    <p class="text-sm text-fg2 mt-2">A administração do UaiShop vai conferir se você tem os produtos e a quantidade para vender. Entre com o seu usuário para acompanhar a resposta.</p>
    <button class="btn btn-primary w-full mt-4" id="signup-back">Ir para o login</button>
  </div></section>`;
  const r = DB.settings;
  return `
  <section class="login-wrap"><div class="login-card" style="max-width:780px">
    <button class="btn btn-ghost btn-sm mb-2" id="signup-back">← Voltar ao login</button>
    <div class="font-head font-700 text-xl">🌱 Quero vender no UaiShop</div>
    <p class="text-sm text-fg2 mt-1">Preencha seus dados e conte o que você tem para vender. A administração confere e aprova. Regra atual: pelo menos <strong>${r.minProducts} produtos</strong> com <strong>${r.minStock} ou mais</strong> de estoque cada.</p>
    <form id="signup-form" class="mt-3" novalidate>
      <div class="signup-grid">
        <div class="form-group"><label class="form-label" for="su-name">Nome completo</label><input class="form-input" id="su-name" autocomplete="name" maxlength="80"></div>
        <div class="form-group"><label class="form-label" for="su-email">E-mail</label><input class="form-input" id="su-email" type="email" autocomplete="email" maxlength="120"></div>
        <div class="form-group"><label class="form-label" for="su-user">Usuário (para entrar)</label><input class="form-input" id="su-user" autocapitalize="none" spellcheck="false" maxlength="30" placeholder="ex.: maria"></div>
        <div class="form-group"><label class="form-label" for="su-pass">Senha</label><input class="form-input" id="su-pass" type="password" autocomplete="new-password"></div>
        <div class="form-group"><label class="form-label" for="su-store">Nome do sítio ou da quitanda</label><input class="form-input" id="su-store" maxlength="60" placeholder="ex.: Horta da Maria"></div>
        <div class="form-group"><label class="form-label" for="su-city">Cidade</label><input class="form-input" id="su-city" maxlength="60"></div>
      </div>
      <div class="font-600 mt-4 mb-2">O que você tem para vender (e quanto tem disponível)</div>
      ${rowsEditorHtml([])}
      <div class="login-error hidden mt-3" id="su-error" role="alert"></div>
      <button type="submit" class="btn btn-primary btn-lg w-full mt-3" id="su-submit">Enviar pedido para vender</button>
    </form>
  </div></section>`;
}
function attachSignup() {
  document.getElementById('signup-back').addEventListener('click', () => { STATE.signup = null; render(); });
  const form = document.getElementById('signup-form');
  if (!form) return;
  bindRowsEditor();
  document.getElementById('su-name').focus();
  const err = document.getElementById('su-error');
  const fail = m => { err.textContent = m; err.classList.remove('hidden'); err.scrollIntoView({ block: 'nearest' }); };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const v = id => document.getElementById(id).value.trim();
    const name = v('su-name'), email = v('su-email').toLowerCase(), user = v('su-user').toLowerCase();
    const pass = document.getElementById('su-pass').value, store = v('su-store'), city = v('su-city');
    if (!name || !email || !user || !pass || !store || !city) return fail('Preencha todos os seus dados.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Digite um e-mail válido.');
    if (!/^[a-z0-9._-]{3,30}$/.test(user)) return fail('Usuário: de 3 a 30 letras, números, ponto, - ou _ (sem espaço).');
    if (pass.length < 3) return fail('A senha precisa ter pelo menos 3 caracteres.');
    if (findUserByLogin(email) || findUserByLogin(user)) return fail('Este e-mail ou usuário já está cadastrado.');
    const { rows, errors } = readRows();
    if (errors.length) return fail(errors[0]);
    if (!rows.length) return fail('Cadastre pelo menos 1 produto que você tem para vender.');
    const btn = document.getElementById('su-submit'); btn.disabled = true;
    try {
      DB.users.push({
        id: Math.max(...DB.users.map(u => u.id)) + 1, name, email, username: user, role: 'producer', active: true,
        approval: 'pendente', store, passwordHash: await hashPassword(email, pass),
        application: { date: todayISO(), city, products: rows },
      });
      saveDB();
      STATE.signup = 'done'; render();
    } catch (x) { fail('Não foi possível enviar neste navegador.'); btn.disabled = false; }
  });
}

// Cadastro de cliente (consumidor)
function passStrength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return pw.length < 6 ? ['text-danger', 'Muito curta (mínimo 6)'] : s <= 2 ? ['text-warn', 'Fraca: misture letras e números'] : s === 3 ? ['text-fg2', 'Boa'] : ['text-accent', 'Forte'];
}
function renderConsumerSignup() {
  return `
  <section class="login-wrap"><div class="login-card" style="max-width:560px">
    <button class="btn btn-ghost btn-sm mb-2" id="cs-back">← Voltar ao login</button>
    <div class="font-head font-700 text-xl">🧺 Criar conta para comprar</div>
    <p class="text-sm text-fg2 mt-1">É de graça. Com a conta você compra frutas, verduras e grãos direto dos produtores e acompanha seus pedidos.</p>
    <form id="cs-form" class="mt-3" novalidate>
      <div class="form-grid">
        <div class="form-group span-2"><label class="form-label" for="cs-name">Nome completo</label><input class="form-input" id="cs-name" autocomplete="name" maxlength="80"><div class="field-err" id="err-cs-name"></div></div>
        <div class="form-group"><label class="form-label" for="cs-email">E-mail</label><input class="form-input" id="cs-email" type="email" autocomplete="email" maxlength="120"><div class="field-err" id="err-cs-email"></div></div>
        <div class="form-group"><label class="form-label" for="cs-phone">Telefone / WhatsApp (opcional)</label><input class="form-input" id="cs-phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="16" placeholder="(31) 99999-9999"><div class="field-err" id="err-cs-phone"></div></div>
        <div class="form-group span-2"><label class="form-label" for="cs-user">Usuário (para entrar)</label><input class="form-input" id="cs-user" autocapitalize="none" spellcheck="false" autocomplete="username" maxlength="30" placeholder="ex.: ana.souza"><div class="text-xs text-fg3">De 3 a 30 letras ou números, sem espaço. Pode usar ponto, - ou _.</div><div class="field-err" id="err-cs-user"></div></div>
        <div class="form-group"><label class="form-label" for="cs-pass">Senha</label><div class="pass-wrap"><input class="form-input" id="cs-pass" type="password" autocomplete="new-password" style="padding-right:4.8rem"><button type="button" class="pass-toggle" id="cs-toggle">Mostrar</button></div><div class="text-xs" id="cs-strength" aria-live="polite"></div><div class="field-err" id="err-cs-pass"></div></div>
        <div class="form-group"><label class="form-label" for="cs-pass2">Repita a senha</label><input class="form-input" id="cs-pass2" type="password" autocomplete="new-password"><div class="field-err" id="err-cs-pass2"></div></div>
      </div>
      <label class="flex gap-2 mt-3 text-sm" style="align-items:flex-start;cursor:pointer"><input type="checkbox" id="cs-ok" style="accent-color:var(--primary);width:18px;height:18px;margin-top:.15rem;flex-shrink:0"> <span>Concordo que o UaiShop use meus dados só para entregar meus pedidos e falar comigo sobre eles.</span></label>
      <div class="field-err" id="err-cs-ok"></div>
      <div class="login-error hidden mt-3" id="cs-error" role="alert"></div>
      <button type="submit" class="btn btn-primary btn-lg w-full mt-3" id="cs-submit">Criar minha conta</button>
    </form>
    <p class="text-xs text-fg3 mt-3" style="text-align:center">Quer vender seus produtos? <button class="link-btn" id="cs-to-producer">Cadastre-se como produtor</button></p>
  </div></section>`;
}
function attachConsumerSignup() {
  document.getElementById('cs-back').addEventListener('click', () => { STATE.signup = null; render(); });
  document.getElementById('cs-to-producer').addEventListener('click', () => { STATE.signup = 'form'; render(); });
  const $ = id => document.getElementById(id);
  $('cs-name').focus();
  $('cs-phone').addEventListener('input', e => { const d = e.target.value.replace(/\D/g, '').slice(0, 11); e.target.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d; });
  $('cs-pass').addEventListener('input', () => { const pw = $('cs-pass').value, el = $('cs-strength'); if (!pw) { el.textContent = ''; return; } const [cls, txt] = passStrength(pw); el.className = 'text-xs ' + cls; el.textContent = 'Senha: ' + txt; });
  $('cs-toggle').addEventListener('click', e => { const show = $('cs-pass').type === 'password'; $('cs-pass').type = $('cs-pass2').type = show ? 'text' : 'password'; e.currentTarget.textContent = show ? 'Ocultar' : 'Mostrar'; });
  const setErr = (id, msg) => { $('err-' + id).textContent = msg || ''; const inp = $(id); if (inp) { inp.classList.toggle('invalid', !!msg); inp.setAttribute('aria-invalid', msg ? 'true' : 'false'); } return !msg; };
  $('cs-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('cs-name').value.trim(), email = $('cs-email').value.trim().toLowerCase();
    const phone = $('cs-phone').value.trim(), user = $('cs-user').value.trim().toLowerCase();
    const pass = $('cs-pass').value, pass2 = $('cs-pass2').value;
    let ok = true;
    ok = setErr('cs-name', name.length >= 3 && /\s/.test(name) ? '' : 'Digite nome e sobrenome') && ok;
    ok = setErr('cs-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? (findUserByLogin(email) ? 'Este e-mail já tem conta. Volte e entre com ele.' : '') : 'Digite um e-mail válido') && ok;
    ok = setErr('cs-phone', !phone || /^\(\d{2}\) \d{4,5}-\d{4}$/.test(phone) ? '' : 'Telefone incompleto (ou deixe em branco)') && ok;
    ok = setErr('cs-user', /^[a-z0-9._-]{3,30}$/.test(user) ? (findUserByLogin(user) ? 'Este usuário já existe. Escolha outro.' : '') : 'De 3 a 30 letras ou números, sem espaço') && ok;
    ok = setErr('cs-pass', pass.length >= 6 ? '' : 'A senha precisa ter pelo menos 6 caracteres') && ok;
    ok = setErr('cs-pass2', pass2 && pass2 === pass ? '' : 'As senhas não são iguais') && ok;
    ok = setErr('cs-ok', $('cs-ok').checked ? '' : 'Marque para continuar') && ok;
    if (!ok) { document.querySelector('#cs-form .invalid')?.focus(); return; }
    const btn = $('cs-submit'); btn.disabled = true;
    try {
      const u = { id: Math.max(...DB.users.map(x => x.id)) + 1, name: name.slice(0, 80), email, username: user, role: 'consumer', active: true, passwordHash: await hashPassword(email, pass), createdAt: todayISO(), ...(phone ? { phone } : {}) };
      DB.users.push(u); saveDB();
      STATE.signup = null;
      loginAs(u);
      toast(`Conta criada! Bem-vindo(a), ${esc(name.split(' ')[0])}.`, 'success');
    } catch (err) {
      const box = $('cs-error'); box.textContent = 'Não foi possível criar a conta neste navegador.'; box.classList.remove('hidden'); btn.disabled = false;
    }
  });
}

// Confere se o produtor tem produtos e quantidade suficientes
function readiness(u) {
  const r = DB.settings || { minProducts: 3, minStock: 5 };
  const live = !u.approval || u.approval === 'aprovado' || u.approval === 'suspenso';
  const list = live ? DB.products.filter(p => p.producerId === u.id && p.active) : (u.application?.products || []);
  const enough = list.filter(p => Number(p.stock) >= r.minStock);
  const low = list.filter(p => Number(p.stock) < r.minStock);
  return { r, list, enough, low, ok: enough.length >= r.minProducts, live };
}
function readinessHtml(u) {
  const x = readiness(u), r = x.r;
  return `
  <div class="after-note ${x.ok ? 'okbox' : 'warnbox'}">
    <div class="font-600">${x.ok ? '✓ Tem produtos e quantidade para vender' : '⚠ Ainda não cumpre as regras para vender'}</div>
    <ul class="check-list">
      <li class="${x.list.length >= r.minProducts ? 'ok' : 'no'}">${x.list.length} produto(s) ${x.live ? 'à venda' : 'informados'} — mínimo ${r.minProducts}</li>
      <li class="${x.ok ? 'ok' : 'no'}">${x.enough.length} com ${r.minStock} ou mais de estoque — mínimo ${r.minProducts}</li>
      ${x.low.length ? `<li class="warn">Pouca quantidade: ${x.low.map(p => `${esc(p.name)} (${qtyLabel(p, p.stock)})`).join(', ')}</li>` : ''}
    </ul>
  </div>`;
}
function declaredTable(products) {
  if (!products.length) return '<p class="text-sm text-fg2 mt-2">Nenhum produto informado.</p>';
  return `<div class="table-wrap mt-2"><table>
    <thead><tr><th>Produto</th><th>Categoria</th><th class="num">Quantidade</th><th class="num">Preço</th></tr></thead>
    <tbody>${products.map(p => `<tr><td class="font-500">${EMOJI_MAP[p.category] || ''} ${esc(p.name)}</td><td class="text-sm">${esc(p.category)}</td><td class="num ${Number(p.stock) < (DB.settings?.minStock ?? 5) ? 'text-warn' : ''}">${qtyLabel(p, p.stock)}</td><td class="num">${fmt(p.price)}${unitTag(p)}</td></tr>`).join('')}</tbody>
  </table></div>`;
}
function approveProducer(u) {
  const app = u.application || { products: [] };
  if (!app.importedAt) {
    let nextId = Math.max(DB.nextProductId || 0, ...DB.products.map(p => p.id + 1));
    app.products.forEach(p => DB.products.push({
      id: nextId++, name: p.name, category: p.category, unit: p.unit, price: p.price, stock: p.stock,
      producerId: u.id, store: u.store, rating: 0, reviews: 0, description: `${p.name} de ${u.store}.`, active: true,
    }));
    DB.nextProductId = nextId;
    app.importedAt = todayISO();
  }
  u.approval = 'aprovado'; u.approvedAt = todayISO(); delete u.rejectNote;
  saveDB();
}

// Painel do admin: pedidos para vender + regras
function renderProducerApplications() {
  const pend = DB.users.filter(u => u.role === 'producer' && u.approval === 'pendente');
  const rej = DB.users.filter(u => u.role === 'producer' && u.approval === 'recusado');
  const r = DB.settings;
  return `
  <div class="card mb-4">
    <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:.6rem">
      <div class="font-head font-700 text-lg">Quem pode ser produtor ${pend.length ? `<span class="badge badge-warn">${pend.length} aguardando</span>` : ''}</div>
    </div>
    <p class="text-sm text-fg2 mt-1">Confira se a pessoa tem os produtos e a quantidade para vender antes de liberar a loja dela.</p>
    <div class="flex gap-3 mt-3" style="flex-wrap:wrap;align-items:flex-end">
      <div class="form-group"><label class="form-label" for="rule-min-products">Mínimo de produtos</label><input class="form-input tabular" type="number" min="1" max="50" step="1" id="rule-min-products" value="${r.minProducts}" style="width:7rem;font-size:16px"></div>
      <div class="form-group"><label class="form-label" for="rule-min-stock">Estoque mínimo por produto</label><input class="form-input tabular" type="number" min="1" max="10000" step="1" id="rule-min-stock" value="${r.minStock}" style="width:7rem;font-size:16px"></div>
      <button class="btn btn-secondary btn-sm" id="save-rules">Salvar regras</button>
    </div>
    ${pend.length ? pend.map(u => `
    <div class="card card-sm mt-3">
      <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:.6rem">
        <div><div class="font-head font-700">${esc(u.store)}</div><div class="text-sm text-fg2">${esc(u.name)} · ${esc(u.email)}${u.application?.city ? ' · ' + esc(u.application.city) : ''}</div></div>
        <span class="text-xs text-fg3">Pedido enviado em ${u.application?.date ? fmtDate(u.application.date) : '—'}</span>
      </div>
      ${readinessHtml(u)}
      ${declaredTable(u.application?.products || [])}
      <div class="flex gap-2 mt-3" style="justify-content:flex-end;flex-wrap:wrap">
        <button class="btn btn-secondary btn-sm text-danger" data-reject-producer="${u.id}">Recusar</button>
        <button class="btn btn-accent btn-sm" data-approve-producer="${u.id}">✓ Aprovar como produtor</button>
      </div>
    </div>`).join('') : '<p class="text-sm text-fg3 mt-3">Nenhum pedido esperando aprovação.</p>'}
    ${rej.length ? `<details class="mt-3"><summary class="font-600 text-sm">Pedidos recusados (${rej.length})</summary>
      ${rej.map(u => `<div class="text-sm mt-2"><strong>${esc(u.store)}</strong> — ${esc(u.name)}<br><span class="text-fg2">Motivo: ${esc(u.rejectNote || '—')}</span></div>`).join('')}</details>` : ''}
  </div>`;
}
function attachProducerApproval() {
  document.getElementById('save-rules')?.addEventListener('click', () => {
    const mp = Math.floor(Number(document.getElementById('rule-min-products').value));
    const ms = Math.floor(Number(document.getElementById('rule-min-stock').value));
    if (!(mp >= 1 && mp <= 50) || !(ms >= 1 && ms <= 10000)) { toast('Use números inteiros maiores que zero', 'error'); return; }
    DB.settings.minProducts = mp; DB.settings.minStock = ms; saveDB(); render();
    toast('Regras salvas', 'success');
  });
  const byId = v => DB.users.find(u => u.id === Number(v) && u.role === 'producer');
  document.querySelectorAll('[data-approve-producer]').forEach(b => b.addEventListener('click', () => {
    const u = byId(b.dataset.approveProducer); if (!u) return;
    const x = readiness(u);
    confirmDialog({
      title: `Aprovar ${esc(u.store)}?`,
      message: x.ok
        ? `Os ${x.list.length} produtos informados entram na loja com as quantidades e preços do pedido.`
        : `<strong class="text-warn">Atenção:</strong> este produtor tem só ${x.enough.length} produto(s) com ${x.r.minStock} ou mais de estoque, e a regra pede ${x.r.minProducts}. Aprovar mesmo assim?`,
      confirmText: x.ok ? 'Aprovar' : 'Aprovar mesmo assim',
    }, () => { approveProducer(u); render(); toast(`${esc(u.store)} aprovado! Os produtos já estão na loja.`, 'success'); });
  }));
  document.querySelectorAll('[data-reject-producer]').forEach(b => b.addEventListener('click', () => {
    const u = byId(b.dataset.rejectProducer); if (!u) return;
    confirmDialog({
      title: `Recusar ${esc(u.store)}?`, message: 'A pessoa vai ver o motivo e pode corrigir e enviar de novo.',
      confirmText: 'Recusar', danger: true,
      extraHtml: `<div class="form-group mt-3"><label class="form-label" for="dlg-note">Motivo</label><textarea class="form-input" id="dlg-note" maxlength="300" placeholder="Ex.: pouca quantidade de goiaba; precisa de pelo menos ${DB.settings.minProducts} produtos"></textarea></div>`,
    }, () => {
      const note = document.getElementById('dlg-note').value.trim();
      if (!note) { toast('Escreva o motivo', 'error'); return false; }
      u.approval = 'recusado'; u.rejectNote = note.slice(0, 300); u.decidedAt = todayISO(); saveDB(); render();
      toast('Pedido recusado');
    });
  }));
  document.querySelectorAll('[data-suspend]').forEach(b => b.addEventListener('click', () => {
    const u = byId(b.dataset.suspend); if (!u) return;
    const suspending = u.approval !== 'suspenso';
    confirmDialog({
      title: suspending ? `Suspender as vendas de ${esc(u.store)}?` : `Reativar as vendas de ${esc(u.store)}?`,
      message: suspending ? 'Os produtos saem da loja até você reativar. Os pedidos já feitos continuam.' : 'Os produtos voltam a aparecer na loja.',
      confirmText: suspending ? 'Suspender' : 'Reativar', danger: suspending,
    }, () => { u.approval = suspending ? 'suspenso' : 'aprovado'; saveDB(); render(); toast(suspending ? 'Vendas suspensas' : 'Vendas reativadas', 'success'); });
  }));
}

// Tela do produtor que ainda não pode vender
function renderProducerStatus(u) {
  const st = {
    pendente: ['badge-warn', 'Em análise', 'Seu pedido para vender foi enviado. A administração vai conferir seus produtos e quantidades.'],
    recusado: ['badge-danger', 'Recusado', `Motivo: ${esc(u.rejectNote || 'não informado')}. Você pode corrigir e enviar de novo.`],
    suspenso: ['badge-danger', 'Vendas suspensas', 'Seus produtos estão fora da loja por enquanto. Fale com a administração do UaiShop.'],
  }[u.approval] || ['badge-neutral', u.approval, ''];
  const canEdit = u.approval === 'pendente' || u.approval === 'recusado';
  return `
  <div class="cart-wrap">
    <div class="card">
      <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:.6rem">
        <div class="font-head font-700 text-xl">${esc(u.store || u.name)}</div>
        <span class="badge ${st[0]}">${st[1]}</span>
      </div>
      <p class="text-sm text-fg2 mt-2">${st[2]}</p>
      ${readinessHtml(u)}
      ${canEdit ? declaredTable(u.application?.products || []) : ''}
      ${canEdit ? `<button class="btn btn-primary mt-3" id="resubmit-app">${u.approval === 'recusado' ? 'Corrigir e enviar de novo' : 'Editar meus produtos'}</button>` : ''}
    </div>
  </div>`;
}
function openResubmit() {
  const u = STATE.user;
  showModal(`
  <div class="modal-title">Meus produtos para vender <button class="btn btn-ghost btn-icon" id="dlg-x" aria-label="Fechar">✕</button></div>
  ${rowsEditorHtml(u.application?.products || [])}
  <div class="flex gap-2 mt-3" style="justify-content:flex-end;flex-wrap:wrap">
    <button class="btn btn-secondary" id="dlg-cancel">Voltar</button>
    <button class="btn btn-primary" id="app-save">Enviar para análise</button>
  </div>`, () => {
    bindRowsEditor();
    document.getElementById('dlg-x').addEventListener('click', closeModal);
    document.getElementById('dlg-cancel').addEventListener('click', closeModal);
    document.getElementById('app-save').addEventListener('click', () => {
      const { rows, errors } = readRows();
      if (errors.length) { toast(errors[0], 'error'); return; }
      if (!rows.length) { toast('Cadastre pelo menos 1 produto', 'error'); return; }
      u.application = Object.assign(u.application || {}, { products: rows, date: todayISO() });
      u.approval = 'pendente'; delete u.rejectNote;
      saveDB(); closeModal(); render();
      toast('Enviado! Aguarde a análise.', 'success');
    });
  });
}

// ===================== CANCELAMENTO E DEVOLUÇÃO =====================
const RETURN_DAYS = 7; // prazo de arrependimento para compras on-line (CDC, art. 49)
const CANCEL_REASONS = ['Desisti da compra', 'Comprei o produto errado', 'Encontrei mais barato', 'Demora para sair', 'Outro motivo'];
const RETURN_REASONS = ['Produto estragado ou passado', 'Veio produto errado', 'Quantidade menor que a comprada', 'Desisti da compra', 'Outro motivo'];
const RETURN_STATUS = { solicitada: ['badge-warn', 'Em análise'], aprovada: ['badge-accent', 'Aprovada'], recusada: ['badge-danger', 'Recusada'] };
function isoOf(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function todayISO() { return isoOf(new Date()); }
function addDays(iso, n) { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return isoOf(d); }
const round2 = n => Math.round(n * 100) / 100;
function returnedQty(o, pid, statuses = ['solicitada', 'aprovada']) {
  return (o.returns || []).filter(r => statuses.includes(r.status))
    .reduce((s, r) => s + r.items.filter(i => i.productId === pid).reduce((t, i) => t + i.qty, 0), 0);
}
function restockedQty(o, pid) {
  return (o.returns || []).filter(r => r.status === 'aprovada' && r.restocked)
    .reduce((s, r) => s + r.items.filter(i => i.productId === pid).reduce((t, i) => t + i.qty, 0), 0);
}
function netTotal(o) { return o.status === 'cancelado' ? 0 : Math.max(0, o.total - (o.refunded || 0)); }
function changeStock(pid, delta) { const p = DB.products.find(x => x.id === pid); if (p) p.stock = Math.max(0, (Number(p.stock) || 0) + delta); }
function setOrderStatus(o, s, reason) {
  if (!o || o.status === s) return;
  if (s === 'cancelado') {
    // Itens voltam ao estoque (menos os que já voltaram por devolução)
    o.items.forEach(i => changeStock(i.productId, i.qty - restockedQty(o, i.productId)));
    o.cancelledAt = todayISO(); o.cancelReason = reason || 'Cancelado pela loja'; o.refunded = o.total;
    (o.returns || []).forEach(r => { if (r.status === 'solicitada') { r.status = 'recusada'; r.note = 'Pedido cancelado por inteiro'; r.decidedAt = todayISO(); } });
  } else if (o.status === 'cancelado') {
    // Reativar um pedido cancelado tira os itens do estoque de novo
    o.items.forEach(i => changeStock(i.productId, -(i.qty - restockedQty(o, i.productId))));
    delete o.cancelledAt; delete o.cancelReason;
    o.refunded = round2((o.returns || []).filter(r => r.status === 'aprovada').reduce((t, r) => t + r.refund, 0));
  }
  if (s === 'entregue') o.deliveredAt = todayISO();
  o.status = s;
  saveDB();
}
function returnDeadline(o) { return addDays(o.deliveredAt || o.date, RETURN_DAYS); }
function canReturn(o) {
  return o.status === 'entregue' && todayISO() <= returnDeadline(o)
    && !(o.returns || []).some(r => r.status === 'solicitada')
    && o.items.some(i => i.qty - returnedQty(o, i.productId) > 0);
}

// Janela de confirmação feita na própria página (o confirm() do navegador não funciona aqui)
function confirmDialog({ title, message, confirmText = 'Confirmar', cancelText = 'Voltar', danger = false, extraHtml = '', secondary = null }, onConfirm) {
  showModal(`
  <div class="modal-title">${title} <button class="btn btn-ghost btn-icon" id="dlg-x" aria-label="Fechar">✕</button></div>
  <p class="text-sm text-fg2">${message}</p>
  ${extraHtml}
  <div class="flex gap-2 mt-4" style="justify-content:flex-end;flex-wrap:wrap">
    <button class="btn btn-secondary" id="dlg-cancel">${cancelText}</button>
    ${secondary ? `<button class="btn btn-secondary" id="dlg-second">${secondary.text}</button>` : ''}
    <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="dlg-ok">${confirmText}</button>
  </div>`, () => {
    document.getElementById('dlg-x').addEventListener('click', closeModal);
    document.getElementById('dlg-cancel').addEventListener('click', closeModal);
    document.getElementById('dlg-second')?.addEventListener('click', () => { closeModal(); secondary.onClick(); });
    document.getElementById('dlg-ok').addEventListener('click', () => { if (onConfirm() !== false) closeModal(); });
  });
}

// --- Visão do consumidor ---
function returnLine(o, r) {
  const [cls, label] = RETURN_STATUS[r.status] || ['badge-neutral', r.status];
  return `
  <div class="after-note">
    <div class="flex justify-between items-center gap-2" style="flex-wrap:wrap"><span class="font-600">↩ Devolução pedida em ${fmtDate(r.date)}</span><span class="badge ${cls}">${label}</span></div>
    <div class="text-sm mt-1">${r.items.map(i => `${esc(i.name)} ×${fmtQty(i.qty)}`).join(', ')} — ${fmt(r.refund)}</div>
    <div class="text-xs text-fg2 mt-1">Motivo: ${esc(r.reason)}${r.comment ? ' · “' + esc(r.comment) + '”' : ''}</div>
    ${r.status === 'aprovada' ? `<div class="text-xs text-accent mt-1">Reembolso de ${fmt(r.refund)} aprovado.</div>` : ''}
    ${r.status === 'recusada' && r.note ? `<div class="text-xs text-danger mt-1">Resposta da loja: ${esc(r.note)}</div>` : ''}
  </div>`;
}
function orderAfterSale(o) {
  const parts = [];
  if (o.status === 'cancelado') {
    parts.push(`<div class="after-note danger">Pedido cancelado${o.cancelledAt ? ' em ' + fmtDate(o.cancelledAt) : ''}${o.cancelReason ? ' — ' + esc(o.cancelReason) : ''}. Valor estornado: <strong>${fmt(o.refunded || o.total)}</strong>.</div>`);
  }
  (o.returns || []).forEach(r => parts.push(returnLine(o, r)));
  if (o.status === 'processando') {
    parts.push(`<div class="flex gap-2 mt-2 items-center" style="flex-wrap:wrap"><button class="btn btn-secondary btn-sm text-danger" data-cancel-order="${o.id}">Cancelar pedido</button><span class="text-xs text-fg3">Dá para cancelar enquanto o pedido não sai para entrega.</span></div>`);
  } else if (o.status === 'em trânsito') {
    parts.push(`<p class="text-xs text-fg3 mt-2">Já saiu para entrega e não pode mais ser cancelado. Depois de receber, você tem ${RETURN_DAYS} dias para devolver itens.</p>`);
  } else if (o.status === 'entregue') {
    if (canReturn(o)) parts.push(`<div class="flex gap-2 mt-2 items-center" style="flex-wrap:wrap"><button class="btn btn-secondary btn-sm" data-return-order="${o.id}">↩ Devolver itens</button><span class="text-xs text-fg3">Prazo até ${fmtDate(returnDeadline(o))}</span></div>`);
    else if (todayISO() > returnDeadline(o)) parts.push(`<p class="text-xs text-fg3 mt-2">Prazo de devolução encerrado em ${fmtDate(returnDeadline(o))}.</p>`);
  }
  return parts.join('');
}
function openCancelOrder(id) {
  const o = DB.orders.find(x => x.id === id);
  if (!o || o.status !== 'processando' || o.consumerId !== STATE.user.id) { toast('Este pedido não pode mais ser cancelado', 'error'); render(); return; }
  confirmDialog({
    title: `Cancelar o pedido #${o.id}?`,
    message: `Os itens voltam para a loja e o valor de <strong>${fmt(o.total)}</strong> é estornado na mesma forma de pagamento.`,
    confirmText: 'Cancelar pedido', cancelText: 'Manter pedido', danger: true,
    extraHtml: `<div class="form-group mt-3"><label class="form-label" for="dlg-reason">Por que você quer cancelar?</label><select class="form-input form-select" id="dlg-reason">${CANCEL_REASONS.map(r => `<option>${r}</option>`).join('')}</select></div>`,
  }, () => {
    setOrderStatus(o, 'cancelado', document.getElementById('dlg-reason').value);
    render();
    toast('Pedido cancelado. O estorno foi solicitado.', 'success');
  });
}
function openReturnModal(id) {
  const o = DB.orders.find(x => x.id === id);
  if (!o || o.consumerId !== STATE.user.id || !canReturn(o)) { toast('Este pedido não pode ser devolvido', 'error'); render(); return; }
  const rows = o.items.map(i => ({ i, max: i.qty - returnedQty(o, i.productId) })).filter(r => r.max > 0);
  showModal(`
  <div class="modal-title">Devolver itens — pedido #${o.id} <button class="btn btn-ghost btn-icon" id="dlg-x" aria-label="Fechar">✕</button></div>
  <p class="text-sm text-fg2 mb-3">Escolha quanto de cada item quer devolver. Prazo até ${fmtDate(returnDeadline(o))}.</p>
  <div style="display:grid;gap:.7rem">
    ${rows.map(({ i, max }) => `
    <div class="flex items-center justify-between gap-2">
      <div style="min-width:0"><div class="font-500 truncate">${esc(i.name)}</div><div class="text-xs text-fg3">${fmt(i.price)} cada · pode devolver até ${fmtQty(max)}</div></div>
      <input class="form-input tabular" type="number" inputmode="decimal" min="0" max="${max}" step="${unitStep(productById(i.productId))}" value="0" data-ret-pid="${i.productId}" data-price="${i.price}" data-max="${max}" style="width:5.5rem;font-size:16px" aria-label="Quantidade de ${esc(i.name)} para devolver">
    </div>`).join('')}
  </div>
  <div class="form-group mt-3"><label class="form-label" for="ret-reason">Motivo</label><select class="form-input form-select" id="ret-reason">${RETURN_REASONS.map(r => `<option>${r}</option>`).join('')}</select></div>
  <div class="form-group mt-2"><label class="form-label" for="ret-comment">Conte o que aconteceu (opcional)</label><textarea class="form-input" id="ret-comment" maxlength="300" placeholder="Ex.: a alface chegou murcha"></textarea></div>
  <div class="summary-row total mt-2"><span>Reembolso</span><span class="tabular text-primary" id="ret-total">${fmt(0)}</span></div>
  <div class="flex gap-2 mt-3" style="justify-content:flex-end;flex-wrap:wrap">
    <button class="btn btn-secondary" id="dlg-cancel">Voltar</button>
    <button class="btn btn-primary" id="ret-send">Pedir devolução</button>
  </div>`, () => {
    const inputs = [...document.querySelectorAll('[data-ret-pid]')];
    const read = () => inputs.map(inp => {
      const q = Math.min(Math.max(roundQty(Number(String(inp.value).replace(',', '.')) || 0, Number(inp.step) || 1), 0), Number(inp.dataset.max));
      return { pid: Number(inp.dataset.retPid), qty: q, price: Number(inp.dataset.price) };
    }).filter(x => x.qty > 0);
    const update = () => { document.getElementById('ret-total').textContent = fmt(read().reduce((s, x) => s + x.qty * x.price, 0)); };
    inputs.forEach(inp => inp.addEventListener('input', update));
    document.getElementById('dlg-x').addEventListener('click', closeModal);
    document.getElementById('dlg-cancel').addEventListener('click', closeModal);
    document.getElementById('ret-send').addEventListener('click', () => {
      const sel = read();
      if (!sel.length) { toast('Escolha pelo menos 1 item para devolver', 'error'); return; }
      if (!canReturn(o)) { toast('O prazo de devolução acabou', 'error'); closeModal(); render(); return; }
      const items = sel.map(x => { const it = o.items.find(i => i.productId === x.pid); return { productId: x.pid, producerId: it.producerId ?? DB.products.find(p => p.id === x.pid)?.producerId, name: it.name, qty: x.qty, price: x.price }; });
      o.returns = o.returns || [];
      o.returns.push({ id: Date.now(), date: todayISO(), items, reason: document.getElementById('ret-reason').value, comment: document.getElementById('ret-comment').value.trim().slice(0, 300), status: 'solicitada', refund: round2(items.reduce((s, i) => s + i.qty * i.price, 0)) });
      saveDB(); closeModal(); render();
      toast('Pedido de devolução enviado! A loja vai analisar.', 'success');
    });
  });
}

// --- Visão da loja e do admin ---
function itemProducer(i) { return i.producerId ?? DB.products.find(p => p.id === i.productId)?.producerId; }
function returnsFor(filter) {
  const out = [];
  DB.orders.forEach(o => (o.returns || []).forEach(r => { if (filter(o, r)) out.push({ o, r }); }));
  return out.sort((a, b) => (a.r.status === 'solicitada' ? 0 : 1) - (b.r.status === 'solicitada' ? 0 : 1) || b.r.date.localeCompare(a.r.date));
}
function renderReturnCards(list, emptyMsg) {
  if (!list.length) return `<div class="empty-state"><div class="empty-state-icon">↩</div><div class="empty-state-title">${emptyMsg}</div></div>`;
  return list.map(({ o, r }) => {
    const [cls, label] = RETURN_STATUS[r.status] || ['badge-neutral', r.status];
    const end = r.status === 'solicitada'
      ? `<div class="flex gap-1"><button class="btn btn-secondary btn-sm text-danger" data-reject-return="${o.id}:${r.id}">Recusar</button><button class="btn btn-accent btn-sm" data-approve-return="${o.id}:${r.id}">Aprovar</button></div>`
      : r.status === 'aprovada'
        ? `<span class="text-xs text-fg2">${r.restocked ? 'Itens voltaram ao estoque' : 'Itens descartados (não voltaram ao estoque)'}</span>`
        : (r.note ? `<span class="text-xs text-fg2">Recusada: ${esc(r.note)}</span>` : '');
    return `
    <div class="card card-sm mb-3">
      <div class="flex justify-between items-center gap-2" style="flex-wrap:wrap"><span class="font-600 font-head">Pedido #${o.id} · ${esc(o.consumerName)}</span><span class="badge ${cls}">${label}</span></div>
      <div class="text-xs text-fg2 mt-1">Pedida em ${fmtDate(r.date)}${r.decidedAt ? ' · respondida em ' + fmtDate(r.decidedAt) : ''}</div>
      <div class="text-sm mt-2">${r.items.map(i => `${esc(i.name)} ×${fmtQty(i.qty)}`).join(', ')}</div>
      <div class="text-sm mt-1">Motivo: <strong>${esc(r.reason)}</strong>${r.comment ? ' · “' + esc(r.comment) + '”' : ''}</div>
      <div class="flex justify-between items-center mt-2" style="flex-wrap:wrap;gap:.6rem"><span class="font-head font-700 tabular">Reembolso: ${fmt(r.refund)}</span>${end}</div>
    </div>`;
  }).join('');
}
function renderCancelledTable(orders) {
  if (!orders.length) return `<p class="text-sm text-fg2">Nenhum pedido cancelado.</p>`;
  return `<div class="card" style="padding:0;overflow:hidden"><div class="table-wrap"><table>
    <thead><tr><th>Pedido</th><th>Cliente</th><th>Cancelado em</th><th>Motivo</th><th class="num">Estornado</th></tr></thead>
    <tbody>${orders.map(o => `<tr><td class="font-600 tabular">#${o.id}</td><td>${esc(o.consumerName)}</td><td class="text-sm">${o.cancelledAt ? fmtDate(o.cancelledAt) : '—'}</td><td class="text-sm">${esc(o.cancelReason || '—')}</td><td class="num">${fmt(o.refunded || o.total)}</td></tr>`).join('')}</tbody>
  </table></div></div>`;
}
function pendingReturnsCount(filter) { return returnsFor(filter).filter(x => x.r.status === 'solicitada').length; }
const mineFilter = () => (o, r) => r.items.some(i => itemProducer(i) === STATE.producerId);
function renderProducerReturns() {
  const list = returnsFor(mineFilter());
  const cancelled = DB.orders.filter(o => o.status === 'cancelado' && o.items.some(i => itemProducer(i) === STATE.producerId));
  return `
  <div class="page-header"><div class="page-title">Devoluções e cancelamentos</div><div class="page-subtitle">Pedidos de devolução que envolvem os seus produtos</div></div>
  ${renderReturnCards(list, 'Nenhum pedido de devolução')}
  <div class="font-head font-700 text-lg mt-6 mb-2">Pedidos cancelados</div>
  ${renderCancelledTable(cancelled)}`;
}
function renderAdminReturns() {
  const list = returnsFor(() => true);
  const refunded = list.filter(x => x.r.status === 'aprovada').reduce((s, x) => s + x.r.refund, 0)
    + DB.orders.filter(o => o.status === 'cancelado').reduce((s, o) => s + (o.refunded || o.total), 0);
  return `
  <div class="page-header"><div class="page-title">Devoluções e cancelamentos</div><div class="page-subtitle">Toda a pós-venda da plataforma</div></div>
  <div class="stat-grid mb-4">
    <div class="stat-tile"><div class="stat-label">Devoluções em análise</div><div class="stat-value tabular text-warn">${list.filter(x => x.r.status === 'solicitada').length}</div></div>
    <div class="stat-tile"><div class="stat-label">Pedidos cancelados</div><div class="stat-value tabular">${DB.orders.filter(o => o.status === 'cancelado').length}</div></div>
    <div class="stat-tile"><div class="stat-label">Total devolvido aos clientes</div><div class="stat-value tabular">${fmt(refunded)}</div></div>
  </div>
  ${renderReturnCards(list, 'Nenhum pedido de devolução')}
  <div class="font-head font-700 text-lg mt-6 mb-2">Pedidos cancelados</div>
  ${renderCancelledTable(DB.orders.filter(o => o.status === 'cancelado'))}`;
}
function findReturn(key) {
  const [oid, rid] = key.split(':').map(Number);
  const o = DB.orders.find(x => x.id === oid);
  const r = o?.returns?.find(x => x.id === rid);
  return r && r.status === 'solicitada' ? { o, r } : null;
}
function attachReturnActions() {
  document.querySelectorAll('[data-approve-return]').forEach(b => b.addEventListener('click', () => {
    const f = findReturn(b.dataset.approveReturn); if (!f) return;
    const { o, r } = f;
    const spoiled = /estragado/i.test(r.reason);
    confirmDialog({
      title: 'Aprovar a devolução?',
      message: `O cliente recebe <strong>${fmt(r.refund)}</strong> de volta.`,
      confirmText: 'Aprovar devolução',
      extraHtml: `<label class="flex items-center gap-2 mt-3 text-sm" style="cursor:pointer"><input type="checkbox" id="dlg-restock" ${spoiled ? '' : 'checked'} style="accent-color:var(--primary);width:18px;height:18px"> Devolver os itens ao estoque</label><p class="text-xs text-fg3 mt-1">Desmarque se o produto veio estragado e vai para o descarte.</p>`,
    }, () => {
      const restock = document.getElementById('dlg-restock').checked;
      r.status = 'aprovada'; r.decidedAt = todayISO(); r.restocked = restock;
      if (restock) r.items.forEach(i => changeStock(i.productId, i.qty));
      o.refunded = round2((o.refunded || 0) + r.refund);
      saveDB(); render();
      toast('Devolução aprovada', 'success');
    });
  }));
  document.querySelectorAll('[data-reject-return]').forEach(b => b.addEventListener('click', () => {
    const f = findReturn(b.dataset.rejectReturn); if (!f) return;
    const { r } = f;
    confirmDialog({
      title: 'Recusar a devolução?',
      message: 'O cliente vai ver a sua explicação.',
      confirmText: 'Recusar', danger: true,
      extraHtml: `<div class="form-group mt-3"><label class="form-label" for="dlg-note">Motivo da recusa</label><textarea class="form-input" id="dlg-note" maxlength="300" placeholder="Ex.: o prazo de devolução já tinha acabado"></textarea></div>`,
    }, () => {
      const note = document.getElementById('dlg-note').value.trim();
      if (!note) { toast('Escreva o motivo da recusa', 'error'); return false; }
      r.status = 'recusada'; r.decidedAt = todayISO(); r.note = note.slice(0, 300);
      saveDB(); render();
      toast('Devolução recusada');
    });
  }));
}

// ===================== PRODUCER =====================
function renderProducer() {
  const me = STATE.user;
  if (me.approval && me.approval !== 'aprovado') return renderTopNav('producer') + renderProducerStatus(me);
  const myProducts = DB.products.filter(p => p.producerId === STATE.producerId);
  const myOrders = DB.orders.filter(o => o.items.some(i => itemProducer(i) === STATE.producerId));
  const min = DB.settings?.minStock ?? 5;
  const tabs = [
    { id: 'dashboard', icon: '🏠', label: 'Início' },
    { id: 'orders', icon: '🧾', label: 'Pedidos', count: myOrders.filter(o => o.status === 'processando').length },
    { id: 'products', icon: '🥬', label: 'Meus produtos', count: myProducts.filter(p => p.active && p.stock <= min).length },
    { id: 'returns', icon: '↩️', label: 'Devoluções', count: pendingReturnsCount(mineFilter()) },
    { id: 'reviews', icon: '⭐', label: 'Avaliações', count: lowUnanswered(STATE.producerId) },
    { id: 'settings', icon: '🏪', label: 'Minha loja' },
  ];
  // Só monta a tela aberta
  const views = {
    dashboard: () => renderProducerDashboard(myProducts, myOrders),
    orders: () => renderProducerOrders(myOrders),
    products: () => renderProducerProducts(myProducts),
    returns: renderProducerReturns,
    reviews: renderProducerReviews,
    settings: renderProducerSettings,
  };
  const content = (views[STATE.producerTab] || views.dashboard)();

  return renderTopNav('producer') + `
  <div class="app-layout">
    <nav class="sidenav">
      ${tabs.map(t => `<div class="sidenav-item ${STATE.producerTab===t.id?'active':''}" data-tab="${t.id}" title="${t.label}"><span class="sidenav-icon" aria-hidden="true">${t.icon}</span><span>${t.label}</span>${t.count ? `<span class="tab-count" aria-label="${t.count} pendente(s)">${t.count}</span>` : ''}</div>`).join('')}
    </nav>
    <main class="main-content">${content}</main>
  </div>`;
}

// --- Ajudantes do produtor ---
// Só os itens deste produtor dentro de um pedido (um pedido pode ter itens de várias lojas)
function myLines(o) { return o.items.filter(i => itemProducer(i) === STATE.producerId).map(i => ({ ...i, eff: i.qty - returnedQty(o, i.productId, ['aprovada']) })); }
function mySubtotal(o) { return myLines(o).reduce((s, i) => s + i.price * i.qty, 0); }
function myMonthSeries(n) {
  const now = new Date(), out = [];
  for (let k = n - 1; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1), key = isoOf(d).slice(0, 7);
    let net = 0, orders = 0;
    DB.orders.forEach(o => {
      if (o.status === 'cancelado' || o.date.slice(0, 7) !== key) return;
      const ls = myLines(o).filter(i => i.eff > 0); if (!ls.length) return;
      orders++; net += ls.reduce((s, i) => s + i.price * i.eff, 0);
    });
    out.push({ label: MONTHS[d.getMonth()] + '/' + String(d.getFullYear()).slice(2), net, orders });
  }
  return out;
}

function renderProducerDashboard(products, orders) {
  const me = DB.users.find(u => u.id === STATE.producerId) || STATE.user;
  const series = myMonthSeries(6), cur = series[5], prev = series[4];
  const min = DB.settings?.minStock ?? 5;
  const toShip = orders.filter(o => o.status === 'processando');
  const onWay = orders.filter(o => o.status === 'em trânsito');
  const low = products.filter(p => p.active && p.stock > 0 && p.stock <= min);
  const out = products.filter(p => p.active && p.stock <= 0);
  const stats = producerStats('all').find(s => s.user.id === STATE.producerId);
  const top = stats ? products.map(p => ({ p, b: stats.byProduct[p.id] })).filter(x => x.b).sort((a, b) => b.b.revenue - a.b.revenue).slice(0, 5) : [];
  const todo = [
    [toShip.length, 'pedido(s) para preparar e enviar', 'orders|processando', 'Ver pedidos'],
    [pendingReturnsCount(mineFilter()), 'devolução(ões) para responder', 'returns|', 'Responder'],
    [lowUnanswered(STATE.producerId), 'avaliação(ões) com nota baixa sem resposta', 'reviews|', 'Responder'],
    [out.length, 'produto(s) esgotado(s)', 'products|baixo', 'Repor estoque'],
    [low.length, `produto(s) com estoque baixo (até ${min})`, 'products|baixo', 'Repor estoque'],
  ].filter(t => t[0] > 0);
  const maxNet = Math.max(0, ...series.map(m => m.net));
  return `
  ${adminHead(`Olá, ${esc((me.name || '').split(' ')[0])}!`, `Resumo da ${esc(me.store || 'sua loja')}`, '<button class="btn btn-primary btn-sm" data-new-order>+ Registrar pedido</button>')}
  <div class="stat-grid">
    <div class="stat-tile"><div class="stat-label">Vendas do mês</div><div class="stat-value tabular">${fmt(cur.net)}</div>${deltaHtml(cur.net, prev.net)}</div>
    <div class="stat-tile"><div class="stat-label">Você recebe no mês</div><div class="stat-value tabular text-primary">${fmt(cur.net * (1 - COMMISSION))}</div><div class="stat-delta">já descontados os 8% do UaiShop</div></div>
    <div class="stat-tile"><div class="stat-label">Para enviar</div><div class="stat-value tabular ${toShip.length ? 'text-warn' : ''}">${toShip.length}</div><div class="stat-delta">${onWay.length} a caminho do cliente</div></div>
    <div class="stat-tile"><div class="stat-label">Nota da sua loja</div><div class="stat-value tabular">${(s => s.count ? avgStr(s.avg) + ' <span class="stars" style="font-size:1.1rem">★</span>' : '—')(storeRatingOf(STATE.producerId))}</div><div class="stat-delta">${storeRatingOf(STATE.producerId).count} avaliação(ões)</div></div>
  </div>
  <div class="admin-grid mt-4">
    <section class="card"><h2 class="card-title">Para fazer agora</h2>
      ${todo.length ? `<div class="att-list">${todo.map(([n, t, g, b]) => `<div class="att-item"><span class="att-num">${n}</span><span class="att-txt">${t}</span><button class="btn btn-secondary btn-sm" data-pgoto="${g}">${b} →</button></div>`).join('')}</div>` : '<p class="text-sm text-accent">✓ Tudo em dia. Nenhuma tarefa pendente.</p>'}
    </section>
    <section class="card"><h2 class="card-title">Suas vendas — últimos 6 meses</h2>
      <div class="vbars" role="img" aria-label="Suas vendas por mês">${series.map(m => `<div class="vbar"><div class="vbar-val">${m.net ? 'R$ ' + Math.round(m.net) : '—'}</div><div class="vbar-track"><div class="vbar-fill" style="height:${maxNet ? (m.net / maxNet * 100).toFixed(1) : 0}%"></div></div><div class="vbar-lbl">${m.label}</div></div>`).join('')}</div>
    </section>
  </div>
  <section class="card mt-4"><h2 class="card-title">Seus produtos que mais vendem</h2>
    ${top.length ? hbars(top.map(x => [`${pEmoji(x.p)} ${esc(x.p.name)}`, x.b.revenue]), v => fmt(v)) : '<p class="text-sm text-fg2">Quando você vender, os campeões de venda aparecem aqui.</p>'}
  </section>`;
}

function renderProducerProducts(products) {
  const f = STATE.pf || (STATE.pf = { q: '', show: 'todos' });
  const min = DB.settings?.minStock ?? 5;
  const filters = { todos: () => true, venda: p => p.active && p.stock > 0, baixo: p => p.stock <= min, ocultos: p => !p.active };
  const labels = { todos: 'Todos', venda: 'À venda', baixo: 'Estoque baixo', ocultos: 'Ocultos' };
  const q = f.q.trim().toLowerCase(), sold = soldByProduct();
  const list = products.filter(filters[f.show] || filters.todos).filter(p => !q || p.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name));
  return `
  ${adminHead('Meus produtos', `${products.length} cadastrado(s). Mude o estoque direto na tabela.`, '<button class="btn btn-primary btn-sm" id="add-product">+ Novo produto</button>')}
  <div class="pill-row">${Object.keys(labels).map(k => `<button class="category-chip ${f.show === k ? 'active' : ''}" data-pf-show="${k}">${labels[k]} <span class="pill-n">${products.filter(filters[k]).length}</span></button>`).join('')}</div>
  <div class="toolbar"><div class="search-input-wrap" style="flex:1;min-width:220px"><span class="search-icon" aria-hidden="true">🔍</span><input class="form-input search-input" type="search" id="pf-q" value="${esc(f.q)}" placeholder="Buscar nos meus produtos" aria-label="Buscar nos meus produtos"></div></div>
  ${!products.length ? `<div class="empty-state"><div class="empty-state-icon">🥬</div><div class="empty-state-title">Você ainda não tem produtos</div><div class="empty-state-desc">Cadastre o primeiro para começar a vender.</div></div>`
    : !list.length ? `<div class="empty-state"><div class="empty-state-title">Nada encontrado</div><div class="empty-state-desc">Mude a busca ou o filtro.</div></div>` : `
  <div class="card" style="padding:0;overflow:hidden"><div class="table-wrap"><table class="data-table">
    <thead><tr><th>Produto</th><th class="num">Preço</th><th>Estoque</th><th class="num">Vendido</th><th>Situação</th><th></th></tr></thead>
    <tbody>${list.map(p => {
      const st = !p.active ? ['badge-neutral', 'Oculto'] : p.stock <= 0 ? ['badge-danger', 'Esgotado'] : p.stock <= min ? ['badge-warn', 'Estoque baixo'] : ['badge-accent', 'À venda'];
      return `<tr>
        <td><span aria-hidden="true" style="font-size:1.2rem">${pEmoji(p)}</span> <span class="font-500">${esc(p.name)}</span><div class="text-xs text-fg3">${esc(p.category)}</div></td>
        <td class="num font-600">${fmt(p.price)}${unitTag(p)}</td>
        <td style="white-space:nowrap"><div class="stock-edit"><button data-stock-step="${p.id}:-1" aria-label="Tirar 1 do estoque de ${esc(p.name)}">−</button><input type="number" min="0" step="1" inputmode="numeric" value="${p.stock}" data-stock-input="${p.id}" aria-label="Estoque de ${esc(p.name)}"><button data-stock-step="${p.id}:1" aria-label="Pôr 1 no estoque de ${esc(p.name)}">+</button></div> <span class="text-xs text-fg3">${UNITS[p.unit] || 'un.'}</span></td>
        <td class="num">${sold[p.id] ? qtyLabel(p, sold[p.id]) : '—'}</td>
        <td><span class="badge ${st[0]}">${st[1]}</span></td>
        <td><div class="flex gap-1" style="justify-content:flex-end"><button class="btn btn-secondary btn-sm" data-edit="${p.id}">Editar</button><button class="btn btn-ghost btn-sm" data-toggle="${p.id}">${p.active ? 'Ocultar' : 'Mostrar'}</button><button class="btn btn-ghost btn-sm text-danger" data-delete="${p.id}" aria-label="Excluir ${esc(p.name)}">Excluir</button></div></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div></div>`}`;
}

function renderProducerOrders(orders) {
  const f = STATE.po || (STATE.po = 'processando');
  const labels = { processando: 'Para enviar', 'em trânsito': 'A caminho', entregue: 'Entregues', cancelado: 'Cancelados', todos: 'Todos' };
  const list = orders.filter(o => f === 'todos' || o.status === f).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  return `
  ${adminHead('Pedidos', 'Prepare, envie e acompanhe os pedidos dos seus produtos', '<button class="btn btn-primary btn-sm" data-new-order>+ Registrar pedido</button>')}
  <div class="pill-row">${Object.keys(labels).map(k => `<button class="category-chip ${f === k ? 'active' : ''}" data-po="${k}">${labels[k]} <span class="pill-n">${orders.filter(o => k === 'todos' || o.status === k).length}</span></button>`).join('')}</div>
  ${!list.length ? `<div class="empty-state"><div class="empty-state-icon">🧾</div><div class="empty-state-title">${f === 'processando' ? 'Nenhum pedido para enviar agora' : 'Nenhum pedido aqui'}</div></div>` : list.map(o => {
    const lines = myLines(o), others = o.items.length > lines.length;
    const next = o.status === 'processando' ? (o.pickup ? ['entregue', '✓ Cliente retirou'] : ['em trânsito', '🚚 Marcar como enviado']) : o.status === 'em trânsito' ? ['entregue', '✓ Marcar como entregue'] : null;
    return `
    <div class="card card-sm mb-3">
      <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:.4rem"><span class="font-600 font-head">Pedido #${o.id} · ${esc(o.consumerName)}</span>${statusBadgeHtml(o.status)}</div>
      <div class="text-xs text-fg2 mt-1">Feito em ${fmtDate(o.date)}${o.address?.city ? ' · entrega em ' + esc(o.address.city) : ''}${o.pickup ? ' · cliente retira' : ''}${o.phone ? ' · ' + esc(o.phone) : ''}${o.payment ? ' · ' + (PAY_LABEL[o.payment.method] || '') : ''}${o.source === 'produtor' ? ' · <span class="badge badge-info">registrado por você</span>' : ''}</div>
      ${o.note ? `<div class="text-xs mt-1">📝 ${esc(o.note)}</div>` : ''}
      <div class="table-wrap mt-2"><table class="data-table"><tbody>${lines.map(i => { const p = productById(i.productId); return `<tr><td>${pEmoji(p)} ${esc(i.name)}</td><td class="num">${qtyLabel(p, i.qty)}</td><td class="num">${fmt(i.price * i.qty)}</td></tr>`; }).join('')}</tbody></table></div>
      <div class="flex justify-between items-center mt-2" style="flex-wrap:wrap;gap:.6rem">
        <span class="text-sm">Seus itens: <strong class="tabular">${fmt(mySubtotal(o))}</strong>${others ? ' <span class="text-xs text-fg3">· o pedido também tem itens de outras lojas</span>' : ''}</span>
        <div class="flex gap-1" style="flex-wrap:wrap">
          ${o.status === 'processando' ? `<button class="btn btn-ghost btn-sm text-danger" data-p-cancel="${o.id}">Cancelar</button>` : ''}
          ${next ? `<button class="btn btn-accent btn-sm" data-p-next="${o.id}|${next[0]}">${next[1]}</button>` : ''}
        </div>
      </div>
      ${o.address && (o.status === 'processando' || o.status === 'em trânsito') ? `<details class="mt-2"><summary class="text-sm font-600">Endereço de entrega</summary><div class="text-sm mt-1">${addressText(o.address)}</div></details>` : ''}
    </div>`;
  }).join('')}`;
}

// Produtor registra um pedido feito por telefone, WhatsApp ou na banca
const PRODUCER_PAYS = ['dinheiro', 'pix', 'card', 'combinar'];
function openProducerOrderModal() {
  const prods = DB.products.filter(p => p.producerId === STATE.producerId && p.active && p.stock > 0).sort((a, b) => a.name.localeCompare(b.name));
  if (!prods.length) { toast('Você não tem produtos com estoque. Cadastre ou reponha o estoque primeiro.', 'error'); return; }
  const consumers = DB.users.filter(u => u.role === 'consumer' && u.active);
  const opts = prods.map(p => `<option value="${p.id}">${esc(p.name)} — ${fmt(p.price)}/${UNITS[p.unit] || 'un.'} (${p.stock} disp.)</option>`).join('');
  const row = () => `<div class="po-row"><select class="form-input form-select" data-po-prod aria-label="Produto">${opts}</select><input class="form-input tabular" type="number" min="0.5" step="0.5" inputmode="decimal" value="1" data-po-qty aria-label="Quantidade"><span class="po-sub tabular text-sm"></span><button type="button" class="btn btn-ghost btn-sm text-danger" data-po-del aria-label="Tirar este item">✕</button></div>`;
  showModal(`
  <div class="modal-title">Registrar um pedido <button class="btn btn-ghost btn-icon" id="dlg-x" aria-label="Fechar">✕</button></div>
  <p class="text-sm text-fg2 mb-3">Para vendas feitas por telefone, WhatsApp ou na banca. O estoque é descontado na hora.</p>
  <form id="po-form" novalidate>
    <fieldset class="po-section"><legend>1. Cliente</legend>
      <div class="po-choice">
        <label><input type="radio" name="po-who" value="fora" checked> Cliente de fora do site</label>
        ${consumers.length ? '<label><input type="radio" name="po-who" value="app"> Cliente cadastrado no UaiShop</label>' : ''}
      </div>
      <div id="po-who-fora" class="form-grid mt-2">
        <div class="form-group"><label class="form-label" for="po-name">Nome</label><input class="form-input" id="po-name" maxlength="80" placeholder="Ex.: Dona Lúcia"></div>
        <div class="form-group"><label class="form-label" for="po-phone">Telefone (opcional)</label><input class="form-input" id="po-phone" type="tel" inputmode="tel" maxlength="16" placeholder="(31) 99999-9999"></div>
      </div>
      ${consumers.length ? `<div id="po-who-app" class="mt-2 hidden"><label class="form-label" for="po-consumer">Escolha o cliente</label><select class="form-input form-select mt-1" id="po-consumer">${consumers.map(u => `<option value="${u.id}">${esc(u.name)} (${esc(u.username || u.email)})</option>`).join('')}</select><p class="text-xs text-fg3 mt-1">O pedido também aparece em "Meus pedidos" desse cliente.</p></div>` : ''}
    </fieldset>
    <fieldset class="po-section"><legend>2. Itens</legend>
      <div id="po-rows">${row()}</div>
      <button type="button" class="btn btn-secondary btn-sm mt-1" id="po-add">+ Adicionar item</button>
    </fieldset>
    <fieldset class="po-section"><legend>3. Entrega</legend>
      <div class="po-choice">
        <label><input type="radio" name="po-ship" value="retirada" checked> Cliente retira</label>
        <label><input type="radio" name="po-ship" value="entrega"> Entregar no endereço</label>
      </div>
      <div id="po-addr" class="form-grid mt-2 hidden">
        <div class="form-group span-2"><label class="form-label" for="po-street">Rua ou avenida</label><input class="form-input" id="po-street" maxlength="100"></div>
        <div class="form-group"><label class="form-label" for="po-num">Número</label><input class="form-input" id="po-num" maxlength="10" placeholder="Ex.: 42 ou S/N"></div>
        <div class="form-group"><label class="form-label" for="po-district">Bairro</label><input class="form-input" id="po-district" maxlength="60"></div>
        <div class="form-group"><label class="form-label" for="po-city">Cidade</label><input class="form-input" id="po-city" maxlength="60" value="${esc(DB.users.find(u => u.id === STATE.producerId)?.city || '')}"></div>
        <div class="form-group"><label class="form-label" for="po-uf">Estado</label><select class="form-input form-select" id="po-uf">${UFS.map(u => `<option ${u === 'MG' ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
      </div>
    </fieldset>
    <fieldset class="po-section"><legend>4. Pagamento e situação</legend>
      <div class="form-grid">
        <div class="form-group"><label class="form-label" for="po-pay">Forma de pagamento</label><select class="form-input form-select" id="po-pay">${PRODUCER_PAYS.map(k => `<option value="${k}">${PAY_LABEL[k]}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label" for="po-status">Situação</label><select class="form-input form-select" id="po-status"><option value="processando">Ainda vou entregar</option><option value="entregue">Já entreguei (venda na hora)</option></select></div>
        <div class="form-group span-2"><label class="form-label" for="po-note">Observação (opcional)</label><input class="form-input" id="po-note" maxlength="200" placeholder="Ex.: entregar depois das 17h"></div>
      </div>
    </fieldset>
    <div class="summary-row total"><span>Total</span><span class="tabular text-primary" id="po-total">${fmt(0)}</span></div>
    <div class="login-error hidden mt-2" id="po-err" role="alert"></div>
    <div class="flex gap-2 mt-3" style="justify-content:flex-end;flex-wrap:wrap"><button type="button" class="btn btn-secondary" id="dlg-cancel">Cancelar</button><button type="submit" class="btn btn-primary">Registrar pedido</button></div>
  </form>`, () => {
    const box = document.getElementById('po-rows');
    const v = id => document.getElementById(id).value.trim();
    const read = () => [...box.querySelectorAll('.po-row')].map(r => ({ p: productById(Number(r.querySelector('[data-po-prod]').value)), qty: Number(r.querySelector('[data-po-qty]').value), el: r }));
    const upd = () => {
      let t = 0;
      read().forEach(({ p, qty, el }) => { const ok = p && validQty(p, qty); el.querySelector('.po-sub').textContent = ok ? fmt(p.price * qty) : '—'; if (ok) t += p.price * qty; });
      document.getElementById('po-total').textContent = fmt(t);
    };
    const toggles = () => {
      const who = document.querySelector('input[name="po-who"]:checked').value;
      document.getElementById('po-who-fora').classList.toggle('hidden', who !== 'fora');
      document.getElementById('po-who-app')?.classList.toggle('hidden', who !== 'app');
      document.getElementById('po-addr').classList.toggle('hidden', document.querySelector('input[name="po-ship"]:checked').value !== 'entrega');
    };
    document.querySelectorAll('input[name="po-who"], input[name="po-ship"]').forEach(r => r.addEventListener('change', toggles));
    box.addEventListener('input', upd); box.addEventListener('change', upd);
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-po-del]'); if (!b) return;
      if (box.children.length > 1) { b.closest('.po-row').remove(); upd(); } else toast('O pedido precisa de pelo menos 1 item', 'error');
    });
    document.getElementById('po-add').addEventListener('click', () => { box.insertAdjacentHTML('beforeend', row()); upd(); box.lastElementChild.querySelector('select').focus(); });
    document.getElementById('po-phone').addEventListener('input', e => { const d = e.target.value.replace(/\D/g, '').slice(0, 11); e.target.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d; });
    document.getElementById('dlg-x').addEventListener('click', closeModal);
    document.getElementById('dlg-cancel').addEventListener('click', closeModal);
    upd();
    document.getElementById('po-form').addEventListener('submit', e => {
      e.preventDefault();
      const errEl = document.getElementById('po-err');
      const fail = m => { errEl.textContent = m; errEl.classList.remove('hidden'); errEl.scrollIntoView({ block: 'nearest' }); };
      // 1. Cliente
      let consumerId = null, consumerName = '', phone = '';
      if (document.querySelector('input[name="po-who"]:checked').value === 'app') {
        const u = DB.users.find(x => x.id === Number(document.getElementById('po-consumer').value) && x.role === 'consumer');
        if (!u) return fail('Escolha o cliente.');
        consumerId = u.id; consumerName = u.name;
      } else {
        consumerName = v('po-name'); phone = v('po-phone');
        if (consumerName.length < 2) return fail('Digite o nome do cliente.');
        if (phone && !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(phone)) return fail('Telefone incompleto. Use o formato (31) 99999-9999 ou deixe em branco.');
      }
      // 2. Itens (o mesmo produto em duas linhas é somado)
      const merged = new Map();
      for (const { p, qty } of read()) {
        if (!p || p.producerId !== STATE.producerId || !p.active) return fail('Escolha produtos da sua loja.');
        if (!validQty(p, qty)) return fail(`Quantidade inválida para ${p.name}. Produtos por kg aceitam meio em meio (ex.: 1,5); os outros, números inteiros.`);
        merged.set(p.id, Math.round(((merged.get(p.id) || 0) + qty) * 100) / 100);
      }
      if (!merged.size) return fail('Adicione pelo menos 1 item.');
      for (const [pid, qty] of merged) { const p = productById(pid); if (qty > p.stock) return fail(`Só tem ${qtyLabel(p, p.stock)} de ${p.name} no estoque.`); }
      // 3. Entrega
      let address = null;
      if (document.querySelector('input[name="po-ship"]:checked').value === 'entrega') {
        address = { name: consumerName, phone, cep: '', street: v('po-street'), num: v('po-num'), district: v('po-district'), city: v('po-city'), uf: document.getElementById('po-uf').value };
        if (!address.street || !address.num || !address.city) return fail('Preencha rua, número e cidade da entrega.');
      }
      // 4. Pagamento e situação
      const method = PRODUCER_PAYS.includes(v('po-pay')) ? v('po-pay') : 'combinar';
      const status = v('po-status') === 'entregue' ? 'entregue' : 'processando';
      const note = v('po-note').slice(0, 200), today = todayISO();
      const items = [...merged].map(([pid, qty]) => { const p = productById(pid); return { productId: pid, producerId: STATE.producerId, name: p.name, qty, price: p.price }; });
      items.forEach(i => changeStock(i.productId, -i.qty));
      const order = {
        id: DB.nextOrderId++, consumerId, consumerName, items,
        total: round2(items.reduce((s, i) => s + i.price * i.qty, 0)),
        status, date: today, producerId: STATE.producerId, payment: { method }, source: 'produtor',
        ...(address ? { address } : { pickup: true }), ...(phone ? { phone } : {}), ...(note ? { note } : {}),
        ...(status === 'entregue' ? { deliveredAt: today } : {}),
      };
      DB.orders.push(order); saveDB(); closeModal();
      STATE.producerTab = 'orders'; STATE.po = status; render(); window.scrollTo(0, 0);
      toast(`Pedido #${order.id} registrado! O estoque já foi descontado.`, 'success');
    });
  });
}

function renderProducerSettings() {
  const u = DB.users.find(x => x.id === STATE.producerId) || STATE.user;
  return `
  ${adminHead('Minha loja', 'Estas informações aparecem para os clientes')}
  <div class="card" style="max-width:640px">
    <form id="store-form" novalidate><div class="form-grid">
      <div class="form-group span-2"><label class="form-label" for="st-name">Nome da loja</label><input class="form-input" id="st-name" maxlength="60" value="${esc(u.store || '')}"></div>
      <div class="form-group"><label class="form-label" for="st-city">Cidade</label><input class="form-input" id="st-city" maxlength="60" value="${esc(u.city || u.application?.city || '')}"></div>
      <div class="form-group"><label class="form-label" for="st-phone">Telefone para contato</label><input class="form-input" id="st-phone" type="tel" maxlength="16" value="${esc(u.phone || '')}" placeholder="(31) 99999-9999"></div>
      <div class="form-group span-2"><label class="form-label" for="st-desc">Sobre a loja</label><textarea class="form-input" id="st-desc" maxlength="300" placeholder="Ex.: hortaliças sem agrotóxico, colhidas no dia da entrega">${esc(u.storeDesc || '')}</textarea></div>
    </div>
    <button type="submit" class="btn btn-primary mt-3">Salvar alterações</button></form>
  </div>
  <div class="card mt-4" style="max-width:640px"><h2 class="card-title">Sua conta</h2>
    <div class="text-sm" style="display:grid;gap:.2rem"><div><span class="text-fg2">Nome:</span> ${esc(u.name)}</div><div><span class="text-fg2">Usuário:</span> ${esc(u.username || '—')}</div><div><span class="text-fg2">E-mail:</span> ${esc(u.email)}</div></div>
    <p class="text-xs text-fg3 mt-2">Para mudar o e-mail ou a senha, fale com a administração do UaiShop.</p>
  </div>`;
}

function attachProducer() {
  document.getElementById('go-home')?.addEventListener('click', () => { STATE.producerTab = 'dashboard'; render(); });
  document.getElementById('toggle-theme')?.addEventListener('click', toggleTheme);
  document.querySelectorAll('.sidenav-item').forEach(item => {
    item.setAttribute('tabindex', '0'); item.setAttribute('role', 'button');
    item.addEventListener('click', () => { STATE.producerTab = item.dataset.tab; render(); window.scrollTo(0, 0); });
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); } });
  });
  document.getElementById('resubmit-app')?.addEventListener('click', openResubmit);
  attachReturnActions();
  attachReviewActions();
  document.querySelectorAll('[data-pgoto]').forEach(b => b.addEventListener('click', () => {
    const [tab, arg] = b.dataset.pgoto.split('|');
    STATE.producerTab = tab;
    if (tab === 'orders') STATE.po = arg || 'processando';
    if (tab === 'products') STATE.pf = { q: '', show: arg || 'todos' };
    if (tab === 'reviews') STATE.prf = 'baixas';
    render(); window.scrollTo(0, 0);
  }));
  // Produtos (só mexe nos produtos deste produtor)
  const mine = id => DB.products.find(p => p.id === id && p.producerId === STATE.producerId);
  document.getElementById('add-product')?.addEventListener('click', () => openProductModal(null));
  document.querySelectorAll('[data-pf-show]').forEach(b => b.addEventListener('click', () => { STATE.pf.show = b.dataset.pfShow; render(); }));
  const pq = document.getElementById('pf-q');
  if (pq) pq.addEventListener('input', () => { STATE.pf.q = pq.value; render(); const n = document.getElementById('pf-q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } });
  const setStock = (p, v) => {
    const n = roundQty(Number(String(v).replace(',', '.')), unitStep(p));
    if (!Number.isFinite(n) || n < 0) { toast('Digite um número inteiro, 0 ou mais', 'error'); render(); return; }
    p.stock = Math.min(n, 100000); saveDB(); render();
    toast(`Estoque de ${esc(p.name)}: ${qtyLabel(p, p.stock)}`, 'success');
  };
  document.querySelectorAll('[data-stock-step]').forEach(b => b.addEventListener('click', () => { const [id, d] = b.dataset.stockStep.split(':').map(Number); const p = mine(id); if (p) setStock(p, Math.max(0, p.stock + d)); }));
  document.querySelectorAll('[data-stock-input]').forEach(inp => inp.addEventListener('change', () => { const p = mine(Number(inp.dataset.stockInput)); if (p) setStock(p, inp.value); }));
  document.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openProductModal(Number(b.dataset.edit))));
  document.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
    const p = mine(Number(b.dataset.toggle));
    if (p) { p.active = !p.active; saveDB(); render(); toast(p.active ? `${esc(p.name)} voltou para a loja` : `${esc(p.name)} saiu da loja (oculto)`, 'success'); }
  }));
  document.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => {
    const p = mine(Number(b.dataset.delete)); if (!p) return;
    confirmDialog({ title: `Excluir ${esc(p.name)}?`, message: 'Ele sai da loja. Os pedidos antigos continuam no histórico. Se for só por um tempo, use "Ocultar".', confirmText: 'Excluir', danger: true }, () => { DB.products = DB.products.filter(x => x !== p); STATE.cart = STATE.cart.filter(i => i.productId !== p.id); saveCart(); saveDB(); render(); toast('Produto excluído', 'success'); });
  }));
  // Pedidos
  document.querySelectorAll('[data-new-order]').forEach(b => b.addEventListener('click', openProducerOrderModal));
  document.querySelectorAll('[data-po]').forEach(b => b.addEventListener('click', () => { STATE.po = b.dataset.po; render(); }));
  document.querySelectorAll('[data-p-next]').forEach(b => b.addEventListener('click', () => {
    const [id, st] = b.dataset.pNext.split('|');
    const o = DB.orders.find(x => x.id === Number(id));
    if (!o || !myLines(o).length) return;
    setOrderStatus(o, st); render();
    toast(st === 'entregue' ? `Pedido #${o.id} marcado como entregue` : `Pedido #${o.id} enviado! O cliente já pode acompanhar.`, 'success');
  }));
  document.querySelectorAll('[data-p-cancel]').forEach(b => b.addEventListener('click', () => {
    const o = DB.orders.find(x => x.id === Number(b.dataset.pCancel));
    if (!o || o.status !== 'processando' || !myLines(o).length) return;
    confirmDialog({
      title: `Cancelar o pedido #${o.id}?`, message: 'O cliente recebe o dinheiro de volta e os itens voltam ao estoque.',
      confirmText: 'Cancelar pedido', cancelText: 'Voltar', danger: true,
      extraHtml: `<div class="form-group mt-3"><label class="form-label" for="dlg-reason">Motivo (o cliente vai ver)</label><select class="form-input form-select" id="dlg-reason"><option>Produto em falta</option><option>Não conseguimos entregar no endereço</option><option>Problema na colheita</option><option>Outro motivo</option></select></div>`,
    }, () => { setOrderStatus(o, 'cancelado', 'Cancelado pela loja: ' + document.getElementById('dlg-reason').value); render(); toast('Pedido cancelado', 'success'); });
  }));
  // Minha loja
  document.getElementById('store-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const u = DB.users.find(x => x.id === STATE.producerId); if (!u) return;
    const name = document.getElementById('st-name').value.trim();
    const phone = document.getElementById('st-phone').value.trim();
    if (name.length < 3) { toast('O nome da loja precisa ter pelo menos 3 letras', 'error'); return; }
    if (DB.users.some(x => x !== u && x.role === 'producer' && (x.store || '').toLowerCase() === name.toLowerCase())) { toast('Já existe uma loja com esse nome', 'error'); return; }
    if (phone && !/^[\d\s()+-]{8,16}$/.test(phone)) { toast('Telefone inválido', 'error'); return; }
    u.store = name.slice(0, 60); u.city = document.getElementById('st-city').value.trim().slice(0, 60);
    u.phone = phone; u.storeDesc = document.getElementById('st-desc').value.trim().slice(0, 300);
    DB.products.forEach(p => { if (p.producerId === u.id) p.store = u.store; });
    saveDB(); render(); toast('Loja atualizada!', 'success');
  });
}

function openProductModal(editId) {
  const p = editId ? DB.products.find(pr => pr.id === editId && pr.producerId === STATE.producerId) : null;
  if (editId && !p) return;
  showModal(`
  <div class="modal-title">${p ? 'Editar produto' : 'Novo produto'} <button class="btn btn-ghost btn-icon" id="dlg-x" aria-label="Fechar">✕</button></div>
  <form id="mp-form" novalidate><div class="form-grid">
    <div class="form-group span-2"><label class="form-label" for="mp-name">Nome do produto</label><input class="form-input" id="mp-name" maxlength="60" value="${esc(p?.name || '')}" placeholder="Ex.: Alface crespa"></div>
    <div class="form-group"><label class="form-label" for="mp-cat">Categoria</label><select class="form-input form-select" id="mp-cat">${FOOD_CATS.map(c => `<option ${p?.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label" for="mp-unit">Vendido por</label><select class="form-input form-select" id="mp-unit">${Object.keys(UNITS).map(u => `<option value="${u}" ${(p?.unit || 'kg') === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label" for="mp-price">Preço (R$)</label><input class="form-input" type="number" inputmode="decimal" min="0" step="0.01" id="mp-price" value="${p?.price ?? ''}" placeholder="0,00"></div>
    <div class="form-group"><label class="form-label" for="mp-stock">Quantidade em estoque</label><input class="form-input" type="number" inputmode="numeric" min="0" step="1" id="mp-stock" value="${p?.stock ?? ''}" placeholder="0"></div>
    <div class="form-group span-2"><label class="form-label" for="mp-desc">Descrição (opcional)</label><textarea class="form-input" id="mp-desc" maxlength="300" placeholder="Ex.: colhida no dia, sem agrotóxico">${esc(p?.description || '')}</textarea></div>
    <div class="form-group span-2"><label class="form-label" for="mp-photo">Foto (opcional)</label>
      <div class="flex items-center gap-2" style="flex-wrap:wrap"><div class="photo-prev" id="mp-prev">${pVisual(p || { category: FOOD_CATS[0] })}</div><input type="file" id="mp-photo" accept="image/*" class="text-sm" style="max-width:100%"><button type="button" class="btn btn-ghost btn-sm text-danger ${p?.photo ? '' : 'hidden'}" id="mp-photo-del">Tirar a foto</button></div>
      <div class="text-xs text-fg3">Tire a foto com boa luz. Ela é diminuída sozinha para ocupar pouco espaço.</div></div>
  </div>
  <div class="flex gap-2 mt-4" style="justify-content:flex-end;flex-wrap:wrap"><button type="button" class="btn btn-secondary" id="dlg-cancel">Cancelar</button><button type="submit" class="btn btn-primary">${p ? 'Salvar alterações' : 'Cadastrar produto'}</button></div></form>`, () => {
    document.getElementById('dlg-x').addEventListener('click', closeModal);
    document.getElementById('dlg-cancel').addEventListener('click', closeModal);
    document.getElementById('mp-name').focus();
    // Foto: diminui para no máximo 480 px e salva como JPEG
    let photo = p?.photo;
    const prev = document.getElementById('mp-prev'), delBtn = document.getElementById('mp-photo-del');
    document.getElementById('mp-photo').addEventListener('change', e => {
      const file = e.target.files && e.target.files[0]; if (!file) return;
      if (!file.type.startsWith('image/')) { toast('Escolha um arquivo de imagem (foto)', 'error'); e.target.value = ''; return; }
      if (file.size > 15 * 1024 * 1024) { toast('Foto muito grande (máximo 15 MB)', 'error'); e.target.value = ''; return; }
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const max = 480, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        photo = c.toDataURL('image/jpeg', 0.72); URL.revokeObjectURL(url);
        prev.innerHTML = `<img src="${photo}" alt="">`; delBtn.classList.remove('hidden');
      };
      img.onerror = () => { URL.revokeObjectURL(url); toast('Não foi possível abrir essa imagem', 'error'); };
      img.src = url;
    });
    delBtn.addEventListener('click', () => { photo = undefined; document.getElementById('mp-photo').value = ''; prev.innerHTML = pEmoji(p || { category: document.getElementById('mp-cat').value }); delBtn.classList.add('hidden'); });
    document.getElementById('mp-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('mp-name').value.trim();
      const cat = document.getElementById('mp-cat').value;
      const unit = document.getElementById('mp-unit').value;
      const price = Number(document.getElementById('mp-price').value);
      const stockS = document.getElementById('mp-stock').value, stock = Number(stockS);
      const desc = document.getElementById('mp-desc').value.trim().slice(0, 300);
      if (name.length < 2) { toast('Digite o nome do produto', 'error'); return; }
      if (!(price > 0)) { toast('Digite um preço maior que zero', 'error'); return; }
      if (stockS === '' || !Number.isInteger(stock) || stock < 0) { toast('Digite a quantidade em estoque (número inteiro)', 'error'); return; }
      if (DB.products.some(x => x !== p && x.producerId === STATE.producerId && x.name.toLowerCase() === name.toLowerCase())) { toast('Você já tem um produto com esse nome', 'error'); return; }
      if (p) { Object.assign(p, { name, category: cat, price: round2(price), stock, unit, description: desc, emoji: p.category === cat ? p.emoji : undefined, photo }); toast('Produto atualizado!', 'success'); }
      else {
        const nextId = Math.max(DB.nextProductId || 0, ...DB.products.map(x => x.id + 1));
        DB.products.push({ id: nextId, name, category: cat, price: round2(price), stock, producerId: STATE.producerId, store: DB.users.find(u => u.id === STATE.producerId)?.store || 'Minha loja', rating: 0, reviews: 0, description: desc, unit, active: true, ...(photo ? { photo } : {}) });
        DB.nextProductId = nextId + 1;
        toast('Produto cadastrado! Ele já aparece na loja.', 'success');
      }
      saveDB(); closeModal(); render();
    });
  });
}

// ===================== ADMIN =====================
function renderAdmin() {
  const tabs = [
    { id: 'overview', icon: '📊', label: 'Visão geral', group: 'Painel' },
    { id: 'orders', icon: '🧾', label: 'Pedidos', group: 'Operação', count: DB.orders.filter(o => o.status === 'processando').length },
    { id: 'returns', icon: '↩️', label: 'Devoluções', group: 'Operação', count: pendingReturnsCount(() => true) },
    { id: 'products', icon: '🥬', label: 'Produtos', group: 'Operação' },
    { id: 'reviews', icon: '⭐', label: 'Avaliações', group: 'Operação' },
    { id: 'producers', icon: '👩‍🌾', label: 'Produtores', group: 'Pessoas', count: DB.users.filter(u => u.role === 'producer' && u.approval === 'pendente').length },
    { id: 'users', icon: '👥', label: 'Usuários', group: 'Pessoas' },
    { id: 'reports', icon: '📈', label: 'Relatórios', group: 'Análise' },
  ];
  // Só monta a tela aberta (antes todas eram montadas a cada clique)
  const views = { overview: renderAdminOverview, producers: renderAdminProducers, users: renderAdminUsers, products: renderAdminProducts, reviews: renderAdminReviews, orders: renderAdminOrders, returns: renderAdminReturns, reports: renderAdminReports };
  const content = (views[STATE.adminTab] || renderAdminOverview)();
  return renderTopNav('admin') + `
  <div class="app-layout">
    <nav class="sidenav">
      ${tabs.map((t,i)=>`${i===0||tabs[i-1].group!==t.group?`<div class="sidenav-section">${t.group}</div>`:''}<div class="sidenav-item ${STATE.adminTab===t.id?'active':''}" data-tab="${t.id}" title="${t.label}"><span class="sidenav-icon" aria-hidden="true">${t.icon}</span><span>${t.label}</span>${t.count ? `<span class="tab-count" aria-label="${t.count} pendente(s)">${t.count}</span>` : ''}</div>`).join('')}
    </nav>
    <main class="main-content">${content}</main>
  </div>`;
}

// ===================== ADMIN: BASE COMUM =====================
const ORDER_STATUSES = ['processando', 'em trânsito', 'entregue', 'cancelado'];
const STATUS_BADGE = { processando: 'badge-warn', 'em trânsito': 'badge-info', entregue: 'badge-accent', cancelado: 'badge-danger' };
const STATUS_LABEL = { processando: 'Processando', 'em trânsito': 'Em trânsito', entregue: 'Entregue', cancelado: 'Cancelado' };
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
STATE.adm = { orderQ: '', orderStatus: 'todos', prodQ: '', prodCat: 'todas', prodLow: false, userQ: '', userRole: 'todos' };
function statusBadgeHtml(s) { return `<span class="badge ${STATUS_BADGE[s] || 'badge-neutral'}">${STATUS_LABEL[s] || esc(s)}</span>`; }
function adminHead(title, sub, actions = '') {
  return `<div class="admin-head"><div><h1 class="page-title">${title}</h1>${sub ? `<div class="page-subtitle">${sub}</div>` : ''}</div>${actions ? `<div class="admin-actions">${actions}</div>` : ''}</div>`;
}
function searchBox(id, key, placeholder) {
  return `<div class="search-input-wrap" style="flex:1;min-width:220px"><span class="search-icon" aria-hidden="true">🔍</span><input class="form-input search-input" type="search" id="${id}" data-adm="${key}" value="${esc(STATE.adm[key])}" placeholder="${placeholder}" aria-label="${placeholder}"></div>`;
}
function pills(key, options) {
  return `<div class="pill-row">${options.map(([k, l, n]) => `<button class="category-chip ${STATE.adm[key] === k ? 'active' : ''}" data-adm-pill="${key}:${k}">${l} <span class="pill-n">${n}</span></button>`).join('')}</div>`;
}
// Totais por mês calculados dos pedidos reais
function monthSeries(n) {
  const now = new Date(), out = [];
  for (let k = n - 1; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
    const key = isoOf(d).slice(0, 7);
    const os = DB.orders.filter(o => o.date.slice(0, 7) === key);
    const valid = os.filter(o => o.status !== 'cancelado');
    out.push({
      key, label: MONTHS[d.getMonth()] + '/' + String(d.getFullYear()).slice(2),
      orders: valid.length, cancelled: os.length - valid.length,
      gross: valid.reduce((s, o) => s + o.total, 0),
      refunds: valid.reduce((s, o) => s + (o.refunded || 0), 0),
      net: os.reduce((s, o) => s + netTotal(o), 0),
    });
  }
  return out;
}
function deltaHtml(cur, prev) {
  if (!prev) return `<div class="stat-delta">${cur ? 'sem vendas no mês passado' : 'sem vendas ainda'}</div>`;
  const pct = (cur - prev) / prev * 100;
  return `<div class="stat-delta ${pct >= 0 ? 'up' : 'down'}">${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(0)}% vs mês passado</div>`;
}
function soldByProduct() {
  const m = {};
  DB.orders.forEach(o => { if (o.status === 'cancelado') return; o.items.forEach(i => { const eff = i.qty - returnedQty(o, i.productId, ['aprovada']); if (eff > 0) m[i.productId] = (m[i.productId] || 0) + eff; }); });
  return m;
}
function revenueByCategory() {
  const m = {};
  DB.orders.forEach(o => { if (o.status === 'cancelado') return; o.items.forEach(i => {
    const eff = i.qty - returnedQty(o, i.productId, ['aprovada']); if (eff <= 0) return;
    const c = DB.products.find(p => p.id === i.productId)?.category || 'Outros';
    m[c] = (m[c] || 0) + eff * i.price;
  }); });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
function hbars(rows, fmtVal) {
  const max = Math.max(0, ...rows.map(r => r[1]));
  return rows.map(([label, v]) => `<div class="hbar"><span class="hbar-lbl">${label}</span><div class="hbar-track"><span style="width:${max ? (v / max * 100).toFixed(1) : 0}%"></span></div><span class="hbar-val">${fmtVal(v)}</span></div>`).join('');
}
// Planilha: o download é bloqueado aqui, então copiamos o texto (separado por ; para o Excel em português)
function csvCell(v) { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function toCsv(rows) { return rows.map(r => r.map(csvCell).join(';')).join('\n'); }
const n2 = v => Number(v || 0).toFixed(2).replace('.', ',');
function copyText(text, label) {
  const fallback = () => showModal(`<div class="modal-title">${label} <button class="btn btn-ghost btn-icon" onclick="closeModal()" aria-label="Fechar">✕</button></div><p class="text-sm text-fg2 mb-2">Selecione tudo e copie (Ctrl+C). Depois cole no Excel ou no Planilhas Google.</p><textarea class="form-input" readonly style="min-height:220px;font-family:ui-monospace,monospace;font-size:.78rem">${esc(text)}</textarea>`, () => document.querySelector('#modal-container textarea').select());
  try { navigator.clipboard.writeText(text).then(() => toast(`${label} copiada! Cole no Excel ou no Planilhas Google.`, 'success'), fallback); } catch (e) { fallback(); }
}

// Janela com os detalhes de um pedido
function openOrderDetail(id) {
  const o = DB.orders.find(x => x.id === id); if (!o) return;
  const storeOf = i => DB.users.find(u => u.id === itemProducer(i))?.store || '—';
  showModal(`
  <div class="modal-title">Pedido #${o.id} <button class="btn btn-ghost btn-icon" id="dlg-x" aria-label="Fechar">✕</button></div>
  <div class="flex items-center gap-2" style="flex-wrap:wrap">${statusBadgeHtml(o.status)}<span class="text-sm text-fg2">${esc(o.consumerName)} · feito em ${fmtDate(o.date)}</span></div>
  <div class="table-wrap mt-3"><table class="data-table">
    <thead><tr><th>Item</th><th>Loja</th><th class="num">Qtd.</th><th class="num">Valor</th></tr></thead>
    <tbody>${o.items.map(i => `<tr><td>${esc(i.name)}</td><td class="text-sm text-fg2">${esc(storeOf(i))}</td><td class="num">${fmtQty(i.qty)}</td><td class="num">${fmt(i.price * i.qty)}</td></tr>`).join('')}</tbody>
  </table></div>
  <div class="mt-2">
    <div class="summary-row"><span>Total do pedido</span><span class="tabular">${fmt(o.total)}</span></div>
    ${o.refunded ? `<div class="summary-row"><span>Devolvido ao cliente</span><span class="tabular text-danger">− ${fmt(o.refunded)}</span></div>` : ''}
    <div class="summary-row total"><span>Valor líquido</span><span class="tabular">${fmt(netTotal(o))}</span></div>
  </div>
  <ul class="timeline mt-3">
    <li>Pedido feito — ${fmtDate(o.date)}${o.source === 'produtor' ? ' (registrado pela loja)' : ''}</li>
    ${o.deliveredAt ? `<li>Entregue — ${fmtDate(o.deliveredAt)}</li>` : ''}
    ${o.cancelledAt ? `<li>Cancelado — ${fmtDate(o.cancelledAt)}${o.cancelReason ? ' (' + esc(o.cancelReason) + ')' : ''}</li>` : ''}
  </ul>
  ${(o.returns || []).map(r => returnLine(o, r)).join('')}
  <div class="flex gap-2 mt-4 items-center" style="flex-wrap:wrap;justify-content:flex-end">
    <label class="text-sm text-fg2" for="od-status">Situação</label>
    <select class="form-input form-select" id="od-status" style="width:auto">${ORDER_STATUSES.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}</select>
    <button class="btn btn-primary" id="od-save">Salvar</button>
  </div>`, () => {
    document.getElementById('dlg-x').addEventListener('click', closeModal);
    document.getElementById('od-save').addEventListener('click', () => {
      const v = document.getElementById('od-status').value;
      if (v !== o.status) { setOrderStatus(o, v, 'Cancelado pela administração'); toast(v === 'cancelado' ? 'Pedido cancelado e itens devolvidos ao estoque' : 'Situação atualizada', 'success'); }
      closeModal(); render();
    });
  });
}
function ordersTable(list, full) {
  if (!list.length) return `<div class="empty-state"><div class="empty-state-title">Nenhum pedido encontrado</div><div class="empty-state-desc">Tente outra busca ou situação.</div></div>`;
  return `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Pedido</th><th>Data</th><th>Cliente</th><th class="num">Itens</th><th class="num">Total</th><th>Situação</th>${full ? '<th>Pós-venda</th><th>Mudar situação</th>' : ''}<th></th></tr></thead>
    <tbody>${list.map(o => {
      const pend = (o.returns || []).some(r => r.status === 'solicitada');
      const after = o.status === 'cancelado' ? `<span class="text-xs text-danger">${esc(o.cancelReason || 'Cancelado')}</span>`
        : pend ? '<span class="badge badge-warn">Devolução em análise</span>'
        : o.refunded ? `<span class="text-xs text-fg2">Devolvido ${fmt(o.refunded)}</span>` : '<span class="text-xs text-fg3">—</span>';
      return `<tr>
        <td class="font-600 tabular">#${o.id}</td>
        <td class="text-sm tabular" style="white-space:nowrap">${fmtDate(o.date)}</td>
        <td>${esc(o.consumerName)}</td>
        <td class="num">${o.items.length}</td>
        <td class="num font-600">${fmt(o.total)}</td>
        <td>${statusBadgeHtml(o.status)}</td>
        ${full ? `<td>${after}</td><td><select class="form-input form-select" data-admin-order="${o.id}" aria-label="Mudar situação do pedido ${o.id}" style="padding:.3rem 2rem .3rem .6rem;width:auto;font-size:.8rem">${ORDER_STATUSES.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}</select></td>` : ''}
        <td><button class="btn btn-ghost btn-sm" data-order-view="${o.id}">Detalhes</button></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ===================== ADMIN: VISÃO GERAL =====================
function renderAdminOverview() {
  const now = new Date();
  const series = monthSeries(6);
  const cur = series[series.length - 1], prev = series[series.length - 2];
  const valid = DB.orders.filter(o => o.status !== 'cancelado');
  const allNet = DB.orders.reduce((s, o) => s + netTotal(o), 0);
  const minStock = DB.settings?.minStock ?? 5;
  const att = [
    [DB.orders.filter(o => o.status === 'processando').length, 'pedido(s) aguardando envio', 'orders|processando', 'Ver pedidos'],
    [pendingReturnsCount(() => true), 'devolução(ões) para analisar', 'returns|', 'Analisar'],
    [DB.users.filter(u => u.role === 'producer' && u.approval === 'pendente').length, 'produtor(es) aguardando aprovação', 'producers|', 'Avaliar'],
    [DB.products.filter(p => p.active && sellerOk(p) && p.stock <= minStock).length, `produto(s) com estoque baixo (até ${minStock})`, 'products|low', 'Ver produtos'],
  ].filter(a => a[0] > 0);
  const maxNet = Math.max(0, ...series.map(m => m.net));
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const cats = revenueByCategory().map(([c, v]) => [`${EMOJI_MAP[c] || ''} ${esc(c)}`, v]);
  const recent = [...DB.orders].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 5);
  return `
  ${adminHead('Visão geral', dateStr.charAt(0).toUpperCase() + dateStr.slice(1))}
  <div class="stat-grid">
    <div class="stat-tile"><div class="stat-label">Faturamento do mês</div><div class="stat-value tabular">${fmt(cur.net)}</div>${deltaHtml(cur.net, prev.net)}</div>
    <div class="stat-tile"><div class="stat-label">Pedidos do mês</div><div class="stat-value tabular">${cur.orders}</div>${deltaHtml(cur.orders, prev.orders)}</div>
    <div class="stat-tile"><div class="stat-label">Ticket médio</div><div class="stat-value tabular">${fmt(valid.length ? allNet / valid.length : 0)}</div><div class="stat-delta">por pedido, todo o período</div></div>
    <div class="stat-tile"><div class="stat-label">Comissão do mês (8%)</div><div class="stat-value tabular text-primary">${fmt(cur.net * COMMISSION)}</div><div class="stat-delta">receita do UaiShop</div></div>
  </div>
  <div class="admin-grid mt-4">
    <section class="card">
      <h2 class="card-title">Precisa da sua atenção</h2>
      ${att.length ? `<div class="att-list">${att.map(([n, txt, go, btn]) => `<div class="att-item"><span class="att-num">${n}</span><span class="att-txt">${txt}</span><button class="btn btn-secondary btn-sm" data-goto="${go}">${btn} →</button></div>`).join('')}</div>` : `<p class="text-sm text-accent">✓ Tudo em dia. Nada pendente agora.</p>`}
    </section>
    <section class="card">
      <h2 class="card-title">Faturamento líquido — últimos 6 meses</h2>
      <div class="vbars" role="img" aria-label="Faturamento líquido por mês">${series.map(m => `<div class="vbar"><div class="vbar-val">${m.net ? 'R$ ' + Math.round(m.net) : '—'}</div><div class="vbar-track"><div class="vbar-fill" style="height:${maxNet ? (m.net / maxNet * 100).toFixed(1) : 0}%"></div></div><div class="vbar-lbl">${m.label}</div></div>`).join('')}</div>
    </section>
  </div>
  <div class="admin-grid mt-4">
    <section class="card"><h2 class="card-title">Pedidos por situação</h2>${hbars(ORDER_STATUSES.map(s => [statusBadgeHtml(s), DB.orders.filter(o => o.status === s).length]), v => v)}</section>
    <section class="card"><h2 class="card-title">Vendas por categoria</h2>${cats.length ? hbars(cats, v => fmt(v)) : '<p class="text-sm text-fg2">Sem vendas ainda.</p>'}</section>
  </div>
  <section class="card mt-4" style="padding:0;overflow:hidden">
    <div class="flex justify-between items-center" style="padding:1.1rem 1.4rem .4rem"><h2 class="card-title" style="margin:0">Últimos pedidos</h2><button class="btn btn-ghost btn-sm" data-goto="orders|todos">Ver todos →</button></div>
    ${ordersTable(recent, false)}
  </section>`;
}

// ===================== ADMIN: USUÁRIOS =====================
function renderAdminUsers() {
  const f = STATE.adm, q = f.userQ.trim().toLowerCase();
  const roleLabels = { consumer: 'Consumidor', producer: 'Produtor', admin: 'Administrador' };
  const roleBadge = { consumer: 'badge-info', producer: 'badge-accent', admin: 'badge-warn' };
  const apr = { pendente: ['badge-warn', 'Em análise'], recusado: ['badge-danger', 'Recusado'], suspenso: ['badge-danger', 'Suspenso'], aprovado: ['badge-accent', 'Aprovado'] };
  const list = DB.users.filter(u => (f.userRole === 'todos' || u.role === f.userRole)
    && (!q || [u.name, u.email, u.username, u.store].some(v => (v || '').toLowerCase().includes(q))));
  const n = r => DB.users.filter(u => u.role === r).length;
  return `
  ${adminHead('Usuários', `${DB.users.length} conta(s) cadastrada(s)`, `<button class="btn btn-primary btn-sm" id="add-user">+ Novo usuário</button>`)}
  ${pills('userRole', [['todos', 'Todos', DB.users.length], ['consumer', 'Consumidores', n('consumer')], ['producer', 'Produtores', n('producer')], ['admin', 'Administradores', n('admin')]])}
  <div class="toolbar">${searchBox('adm-user-q', 'userQ', 'Buscar por nome, e-mail, usuário ou loja')}<span class="text-sm text-fg2">${list.length} resultado(s)</span></div>
  <div class="card" style="padding:0;overflow:hidden">${list.length ? `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Nome</th><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Detalhe</th><th>Conta</th><th></th></tr></thead>
    <tbody>${list.map(u => {
      const a = apr[u.approval || 'aprovado'] || apr.aprovado;
      const detail = u.role === 'producer' ? `<span class="badge ${a[0]}">${a[1]}</span> <span class="text-xs text-fg2">${esc(u.store || '')}</span>`
        : u.role === 'consumer' ? `<span class="text-xs text-fg2">${DB.orders.filter(o => o.consumerId === u.id).length} pedido(s)</span>` : '<span class="text-xs text-fg3">—</span>';
      return `<tr>
        <td class="font-600">${esc(u.name)}${STATE.user && u.id === STATE.user.id ? ' <span class="text-xs text-fg3">(você)</span>' : ''}</td>
        <td class="text-sm tabular">${esc(u.username || '—')}</td>
        <td class="text-sm text-fg2">${esc(u.email)}</td>
        <td><span class="badge ${roleBadge[u.role]}">${roleLabels[u.role]}</span></td>
        <td>${detail}</td>
        <td><span class="badge ${u.active ? 'badge-accent' : 'badge-neutral'}">${u.active ? 'Ativa' : 'Desativada'}</span></td>
        <td><div class="flex gap-1" style="justify-content:flex-end"><button class="btn btn-secondary btn-sm" data-edit-user="${u.id}">Editar</button><button class="btn btn-ghost btn-sm" data-toggle-user="${u.id}">${u.active ? 'Desativar' : 'Ativar'}</button></div></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>` : `<div class="empty-state"><div class="empty-state-title">Nenhum usuário encontrado</div><div class="empty-state-desc">Mude a busca ou o filtro.</div></div>`}</div>`;
}

// ===================== ADMIN: RELATÓRIO POR PRODUTOR =====================
const COMMISSION = 0.08;
function producerStats(period) {
  const now = new Date();
  const since = period === '30d' ? Date.now() - 30 * 864e5
    : period === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1).getTime() : 0;
  const map = new Map(DB.users.filter(u => u.role === 'producer' && u.approval !== 'pendente' && u.approval !== 'recusado').map(u => [u.id, {
    user: u, products: DB.products.filter(p => p.producerId === u.id),
    orders: new Set(), qty: 0, revenue: 0, byProduct: {}, lastSale: null,
  }]));
  DB.orders.forEach(o => {
    if (o.status === 'cancelado') return;
    if (new Date(o.date + 'T00:00:00').getTime() < since) return;
    o.items.forEach(i => {
      const pid = i.producerId ?? DB.products.find(x => x.id === i.productId)?.producerId;
      const s = map.get(pid);
      if (!s) return;
      // Desconta o que foi devolvido com devolução aprovada
      const eff = i.qty - returnedQty(o, i.productId, ['aprovada']);
      if (eff <= 0) return;
      const value = i.price * eff;
      s.orders.add(o.id); s.qty += eff; s.revenue += value;
      const b = s.byProduct[i.productId] || (s.byProduct[i.productId] = { qty: 0, revenue: 0 });
      b.qty += eff; b.revenue += value;
      if (!s.lastSale || o.date > s.lastSale) s.lastSale = o.date;
    });
  });
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}
function qtyLabel(p, q) { return `${fmtQty(q)} ${UNITS[p?.unit] || 'un.'}`; }

function renderAdminProducers() {
  const period = STATE.adminPeriod || 'all';
  const periods = { all: 'Todo o período', '30d': 'Últimos 30 dias', month: 'Este mês' };
  const stats = producerStats(period);
  const totRev = stats.reduce((s, x) => s + x.revenue, 0);
  const totQty = stats.reduce((s, x) => s + x.qty, 0);
  const card = s => {
    const u = s.user;
    const active = s.products.filter(p => p.active).length;
    const stock = s.products.reduce((t, p) => t + (Number(p.stock) || 0), 0);
    const share = totRev ? (s.revenue / totRev) * 100 : 0;
    const ticket = s.orders.size ? s.revenue / s.orders.size : 0;
    const rows = s.products.map(p => ({ p, b: s.byProduct[p.id] || { qty: 0, revenue: 0 } }))
      .sort((a, b) => b.b.revenue - a.b.revenue || a.p.name.localeCompare(b.p.name));
    const top = rows.find(r => r.b.qty > 0);
    const lowStock = s.products.filter(p => p.active && p.stock <= 10).length;
    return `
    <div class="card mt-4">
      <div class="flex justify-between items-center" style="flex-wrap:wrap;gap:.6rem">
        <div>
          <div class="font-head font-700 text-lg">${esc(u.store || u.name)}</div>
          <div class="text-sm text-fg2">${esc(u.name)} · ${esc(u.email)}</div>
        </div>
        <div class="flex gap-1 items-center" style="flex-wrap:wrap">
          <span class="badge ${u.approval === 'suspenso' ? 'badge-danger' : !u.active ? 'badge-neutral' : 'badge-accent'}">${u.approval === 'suspenso' ? 'Vendas suspensas' : !u.active ? 'Conta desativada' : 'Aprovado'}</span>
          <button class="btn btn-secondary btn-sm" data-suspend="${u.id}">${u.approval === 'suspenso' ? 'Reativar vendas' : 'Suspender vendas'}</button>
        </div>
      </div>
      <div class="prod-stats">
        <div><div class="mini-label">Produtos cadastrados</div><div class="mini-value">${s.products.length}</div><div class="mini-sub">${active} à venda</div></div>
        <div><div class="mini-label">Em estoque</div><div class="mini-value">${stock}</div><div class="mini-sub ${lowStock ? 'text-warn' : ''}">${lowStock ? lowStock + ' com estoque baixo' : 'somando todos os itens'}</div></div>
        <div><div class="mini-label">Pedidos</div><div class="mini-value">${s.orders.size}</div><div class="mini-sub">${s.lastSale ? 'última venda ' + fmtDate(s.lastSale) : 'sem vendas'}</div></div>
        <div><div class="mini-label">Itens vendidos</div><div class="mini-value">${String(s.qty).replace('.', ',')}</div><div class="mini-sub">kg, maços, unidades…</div></div>
        <div><div class="mini-label">Faturamento</div><div class="mini-value">${fmt(s.revenue)}</div><div class="mini-sub">ticket médio ${fmt(ticket)}</div></div>
        <div><div class="mini-label">Comissão UaiShop (8%)</div><div class="mini-value text-primary">${fmt(s.revenue * COMMISSION)}</div><div class="mini-sub">a repassar ${fmt(s.revenue * (1 - COMMISSION))}</div></div>
      </div>
      <div class="share"><div class="share-bar" role="img" aria-label="${share.toFixed(0)}% do faturamento"><span style="width:${share.toFixed(1)}%"></span></div><span class="text-xs text-fg2" style="white-space:nowrap">${share.toFixed(0)}% do faturamento total</span></div>
      ${top ? `<p class="text-sm mt-2">Mais vendido: <strong>${pEmoji(top.p)} ${esc(top.p.name)}</strong> — ${qtyLabel(top.p, top.b.qty)}, ${fmt(top.b.revenue)}</p>` : ''}
      ${readinessHtml(u)}
      <details class="mt-2">
        <summary class="font-600 text-sm">Ver os ${s.products.length} produtos, preços e vendas</summary>
        ${s.products.length ? `<div class="table-wrap mt-2"><table>
          <thead><tr><th>Produto</th><th class="num">Preço atual</th><th class="num">Preço médio vendido</th><th class="num">Estoque</th><th class="num">Vendido</th><th class="num">Faturamento</th><th>Status</th></tr></thead>
          <tbody>${rows.map(({ p, b }) => `<tr>
            <td><span>${pEmoji(p)}</span> <span class="font-500">${esc(p.name)}</span></td>
            <td class="num">${fmt(p.price)}${unitTag(p)}</td>
            <td class="num">${b.qty ? fmt(b.revenue / b.qty) : '—'}</td>
            <td class="num ${p.stock <= 10 ? 'text-warn' : ''}">${qtyLabel(p, p.stock)}</td>
            <td class="num">${b.qty ? qtyLabel(p, b.qty) : '—'}</td>
            <td class="num font-600">${fmt(b.revenue)}</td>
            <td><span class="badge ${p.active ? 'badge-accent' : 'badge-neutral'}">${p.active ? 'À venda' : 'Oculto'}</span></td>
          </tr>`).join('')}</tbody>
        </table></div>` : `<p class="text-sm text-fg2 mt-2">Este produtor ainda não cadastrou produtos.</p>`}
      </details>
    </div>`;
  };
  return `
  <div class="page-header flex justify-between items-center" style="flex-wrap:wrap;gap:.8rem">
    <div><div class="page-title">Produtores</div><div class="page-subtitle">O que cada produtor cadastrou, vendeu e faturou</div></div>
    <label class="flex items-center gap-1 text-sm text-fg2">Período
      <select class="form-input form-select" id="admin-period" style="width:auto">
        ${Object.entries(periods).map(([k, v]) => `<option value="${k}" ${period === k ? 'selected' : ''}>${v}</option>`).join('')}
      </select>
    </label>
  </div>
  ${renderProducerApplications()}
  <div class="stat-grid">
    <div class="stat-tile"><div class="stat-label">Produtores</div><div class="stat-value tabular">${stats.length}</div><div class="stat-delta">${stats.filter(s => s.revenue > 0).length} com vendas no período</div></div>
    <div class="stat-tile"><div class="stat-label">Itens vendidos</div><div class="stat-value tabular">${String(totQty).replace('.', ',')}</div><div class="stat-delta">${periods[period].toLowerCase()}</div></div>
    <div class="stat-tile"><div class="stat-label">Faturamento dos produtores</div><div class="stat-value tabular">${fmt(totRev)}</div></div>
    <div class="stat-tile"><div class="stat-label">Comissão UaiShop (8%)</div><div class="stat-value tabular text-primary">${fmt(totRev * COMMISSION)}</div></div>
  </div>
  ${stats.length ? stats.map(card).join('') : `<div class="empty-state"><div class="empty-state-icon">👩‍🌾</div><div class="empty-state-title">Nenhum produtor cadastrado</div></div>`}
  <p class="text-xs text-fg3 mt-3">Pedidos cancelados não entram na conta. "Preço médio vendido" é o valor cobrado nas vendas, que pode ser diferente do preço atual se o produtor mudou o preço. Pedidos de exemplo com valores fictícios.</p>`;
}

// ===================== ADMIN: PRODUTOS =====================
function adminFilteredProducts() {
  const f = STATE.adm, q = f.prodQ.trim().toLowerCase(), min = DB.settings?.minStock ?? 5;
  return DB.products.filter(p => (f.prodCat === 'todas' || p.category === f.prodCat) && (!f.prodLow || p.stock <= min)
    && (!q || p.name.toLowerCase().includes(q) || (p.store || '').toLowerCase().includes(q)))
    .sort((a, b) => FOOD_CATS.indexOf(a.category) - FOOD_CATS.indexOf(b.category) || a.name.localeCompare(b.name));
}
function renderAdminProducts() {
  const f = STATE.adm, list = adminFilteredProducts(), sold = soldByProduct(), min = DB.settings?.minStock ?? 5;
  const lowCount = DB.products.filter(p => p.stock <= min).length;
  return `
  ${adminHead('Produtos', `${DB.products.filter(p => p.active && sellerOk(p)).length} à venda de ${DB.products.length} cadastrados`, `<button class="btn btn-secondary btn-sm" id="copy-products-csv">Copiar planilha</button>`)}
  <div class="toolbar">
    ${searchBox('adm-prod-q', 'prodQ', 'Buscar produto ou loja')}
    <select class="form-input form-select" data-adm="prodCat" aria-label="Categoria" style="width:auto"><option value="todas">Todas as categorias</option>${FOOD_CATS.map(c => `<option ${f.prodCat === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
    <label class="flex items-center gap-1 text-sm" style="cursor:pointer"><input type="checkbox" data-adm="prodLow" ${f.prodLow ? 'checked' : ''} style="accent-color:var(--primary);width:18px;height:18px"> Só estoque baixo (${lowCount})</label>
  </div>
  <div class="card" style="padding:0;overflow:hidden">${list.length ? `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Produto</th><th>Loja</th><th>Categoria</th><th class="num">Preço</th><th class="num">Estoque</th><th class="num">Vendido</th><th>Situação</th><th></th></tr></thead>
    <tbody>${list.map(p => {
      const st = !p.active ? ['badge-neutral', 'Oculto'] : !sellerOk(p) ? ['badge-danger', 'Loja bloqueada'] : p.stock === 0 ? ['badge-danger', 'Esgotado'] : ['badge-accent', 'À venda'];
      return `<tr>
        <td><span aria-hidden="true">${pEmoji(p)}</span> <span class="font-500">${esc(p.name)}</span></td>
        <td class="text-sm text-fg2">${esc(p.store || '—')}</td>
        <td class="text-sm">${esc(p.category)}</td>
        <td class="num">${fmt(p.price)}${unitTag(p)}</td>
        <td class="num ${p.stock <= min ? 'text-warn font-600' : ''}">${qtyLabel(p, p.stock)}</td>
        <td class="num">${sold[p.id] ? qtyLabel(p, sold[p.id]) : '—'}</td>
        <td><span class="badge ${st[0]}">${st[1]}</span></td>
        <td><div class="flex gap-1" style="justify-content:flex-end"><button class="btn btn-secondary btn-sm" data-admin-toggle="${p.id}">${p.active ? 'Ocultar' : 'Mostrar'}</button><button class="btn btn-ghost btn-sm text-danger" data-admin-del="${p.id}" aria-label="Remover ${esc(p.name)}">Remover</button></div></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>` : `<div class="empty-state"><div class="empty-state-title">Nenhum produto encontrado</div><div class="empty-state-desc">Mude a busca ou os filtros.</div></div>`}</div>`;
}

// ===================== ADMIN: PEDIDOS =====================
function adminFilteredOrders() {
  const f = STATE.adm, q = f.orderQ.trim().toLowerCase();
  return [...DB.orders].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .filter(o => (f.orderStatus === 'todos' || o.status === f.orderStatus)
      && (!q || String(o.id).includes(q) || o.consumerName.toLowerCase().includes(q) || o.items.some(i => i.name.toLowerCase().includes(q))));
}
function renderAdminOrders() {
  const list = adminFilteredOrders();
  return `
  ${adminHead('Pedidos', `${DB.orders.length} pedido(s) no total`, `<button class="btn btn-secondary btn-sm" id="copy-orders-csv">Copiar planilha</button>`)}
  ${pills('orderStatus', [['todos', 'Todos', DB.orders.length], ...ORDER_STATUSES.map(s => [s, STATUS_LABEL[s], DB.orders.filter(o => o.status === s).length])])}
  <div class="toolbar">${searchBox('adm-order-q', 'orderQ', 'Buscar por número, cliente ou produto')}<span class="text-sm text-fg2">${list.length} resultado(s)</span></div>
  <div class="card" style="padding:0;overflow:hidden">${ordersTable(list, true)}</div>`;
}

// ===================== ADMIN: RELATÓRIOS =====================
function renderAdminReports() {
  const series = monthSeries(6);
  const valid = DB.orders.filter(o => o.status !== 'cancelado');
  const gross = valid.reduce((s, o) => s + o.total, 0);
  const refunds = valid.reduce((s, o) => s + (o.refunded || 0), 0);
  const net = gross - refunds;
  const cancelled = DB.orders.length - valid.length;
  const stores = producerStats('all');
  const tot = k => series.reduce((s, m) => s + m[k], 0);
  return `
  ${adminHead('Relatórios', 'Números calculados a partir dos pedidos da plataforma', `<button class="btn btn-secondary btn-sm" id="copy-report-csv">Copiar planilha</button>`)}
  <div class="stat-grid">
    <div class="stat-tile"><div class="stat-label">Faturamento líquido</div><div class="stat-value tabular">${fmt(net)}</div><div class="stat-delta">bruto ${fmt(gross)} − devoluções ${fmt(refunds)}</div></div>
    <div class="stat-tile"><div class="stat-label">Comissão UaiShop (8%)</div><div class="stat-value tabular text-primary">${fmt(net * COMMISSION)}</div><div class="stat-delta">sobre o líquido</div></div>
    <div class="stat-tile"><div class="stat-label">Ticket médio</div><div class="stat-value tabular">${fmt(valid.length ? net / valid.length : 0)}</div><div class="stat-delta">${valid.length} pedido(s) válidos</div></div>
    <div class="stat-tile"><div class="stat-label">Cancelamentos</div><div class="stat-value tabular">${cancelled}</div><div class="stat-delta">${DB.orders.length ? (cancelled / DB.orders.length * 100).toFixed(0) : 0}% dos pedidos</div></div>
  </div>
  <section class="card mt-4" style="padding:0;overflow:hidden">
    <div style="padding:1.1rem 1.4rem .4rem"><h2 class="card-title" style="margin:0">Mês a mês</h2></div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>Mês</th><th class="num">Pedidos</th><th class="num">Bruto</th><th class="num">Devoluções</th><th class="num">Líquido</th><th class="num">Comissão</th><th class="num">Cancelados</th></tr></thead>
      <tbody>${series.slice().reverse().map(m => `<tr><td class="font-600">${m.label}</td><td class="num">${m.orders}</td><td class="num">${fmt(m.gross)}</td><td class="num">${m.refunds ? '− ' + fmt(m.refunds) : '—'}</td><td class="num font-600">${fmt(m.net)}</td><td class="num text-primary">${fmt(m.net * COMMISSION)}</td><td class="num">${m.cancelled || '—'}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Total (6 meses)</td><td class="num">${tot('orders')}</td><td class="num">${fmt(tot('gross'))}</td><td class="num">${tot('refunds') ? '− ' + fmt(tot('refunds')) : '—'}</td><td class="num">${fmt(tot('net'))}</td><td class="num">${fmt(tot('net') * COMMISSION)}</td><td class="num">${tot('cancelled') || '—'}</td></tr></tfoot>
    </table></div>
  </section>
  <section class="card mt-4" style="padding:0;overflow:hidden">
    <div style="padding:1.1rem 1.4rem .4rem"><h2 class="card-title" style="margin:0">Por produtor</h2></div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>Loja</th><th class="num">Pedidos</th><th class="num">Itens vendidos</th><th class="num">Faturamento</th><th class="num">Comissão</th><th class="num">A repassar</th></tr></thead>
      <tbody>${stores.map(s => `<tr><td class="font-600">${esc(s.user.store || s.user.name)}</td><td class="num">${s.orders.size}</td><td class="num">${String(s.qty).replace('.', ',')}</td><td class="num font-600">${fmt(s.revenue)}</td><td class="num text-primary">${fmt(s.revenue * COMMISSION)}</td><td class="num">${fmt(s.revenue * (1 - COMMISSION))}</td></tr>`).join('')}</tbody>
    </table></div>
  </section>
  <p class="text-xs text-fg3 mt-3">Líquido = vendas menos pedidos cancelados e devoluções aprovadas. A comissão de 8% é calculada sobre o líquido.</p>`;
}

function attachAdmin() {
  document.getElementById('go-home')?.addEventListener('click', () => { STATE.adminTab='overview'; render(); });
  document.getElementById('go-landing')?.addEventListener('click', () => { STATE.role=null; render(); });
  document.getElementById('toggle-theme')?.addEventListener('click', toggleTheme);
  document.querySelectorAll('.sidenav-item').forEach(item => item.addEventListener('click', () => { STATE.adminTab = item.dataset.tab; render(); }));
  document.getElementById('add-user')?.addEventListener('click', () => openUserModal(null));
  document.getElementById('admin-period')?.addEventListener('change', e => { STATE.adminPeriod = e.target.value; render(); });
  attachReturnActions();
  attachProducerApproval();
  attachReviewActions();
  // Filtros, busca, atalhos e planilhas
  document.querySelectorAll('[data-adm]').forEach(el => {
    const isText = el.type === 'search' || el.type === 'text';
    el.addEventListener(isText ? 'input' : 'change', () => {
      STATE.adm[el.dataset.adm] = el.type === 'checkbox' ? el.checked : el.value;
      const id = el.id; render();
      if (isText && id) { const n = document.getElementById(id); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }
    });
  });
  document.querySelectorAll('[data-adm-pill]').forEach(b => b.addEventListener('click', () => { const [k, v] = b.dataset.admPill.split(':'); STATE.adm[k] = v; render(); }));
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => {
    const [tab, arg] = b.dataset.goto.split('|');
    STATE.adminTab = tab;
    if (tab === 'orders') { STATE.adm.orderStatus = arg || 'todos'; STATE.adm.orderQ = ''; }
    if (tab === 'products') { STATE.adm.prodLow = arg === 'low'; STATE.adm.prodCat = 'todas'; STATE.adm.prodQ = ''; }
    render(); window.scrollTo(0, 0);
  }));
  document.querySelectorAll('[data-order-view]').forEach(b => b.addEventListener('click', () => openOrderDetail(Number(b.dataset.orderView))));
  document.querySelectorAll('.sidenav-item').forEach(item => {
    item.setAttribute('tabindex', '0'); item.setAttribute('role', 'button');
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); } });
  });
  document.getElementById('copy-orders-csv')?.addEventListener('click', () => copyText(toCsv([
    ['Pedido', 'Data', 'Cliente', 'Itens', 'Total', 'Devolvido', 'Líquido', 'Situação'],
    ...adminFilteredOrders().map(o => [o.id, fmtDate(o.date), o.consumerName, o.items.map(i => `${i.name} x${fmtQty(i.qty)}`).join(', '), n2(o.total), n2(o.refunded), n2(netTotal(o)), STATUS_LABEL[o.status] || o.status]),
  ]), 'Planilha de pedidos'));
  document.getElementById('copy-products-csv')?.addEventListener('click', () => { const sold = soldByProduct(); copyText(toCsv([
    ['Produto', 'Loja', 'Categoria', 'Preço', 'Unidade', 'Estoque', 'Vendido', 'Situação'],
    ...adminFilteredProducts().map(p => [p.name, p.store, p.category, n2(p.price), p.unit || 'unidade', p.stock, sold[p.id] || 0, !p.active ? 'Oculto' : !sellerOk(p) ? 'Loja bloqueada' : p.stock === 0 ? 'Esgotado' : 'À venda']),
  ]), 'Planilha de produtos'); });
  document.getElementById('copy-report-csv')?.addEventListener('click', () => copyText(toCsv([
    ['Mês', 'Pedidos', 'Bruto', 'Devoluções', 'Líquido', 'Comissão', 'Cancelados'],
    ...monthSeries(6).map(m => [m.label, m.orders, n2(m.gross), n2(m.refunds), n2(m.net), n2(m.net * COMMISSION), m.cancelled]),
  ]), 'Planilha do relatório'));
  document.querySelectorAll('[data-edit-user]').forEach(b => b.addEventListener('click', () => openUserModal(Number(b.dataset.editUser))));
  document.querySelectorAll('[data-toggle-user]').forEach(b => b.addEventListener('click', () => {
    const u = DB.users.find(us=>us.id===Number(b.dataset.toggleUser));
    if (u && u.id === STATE.user.id) { toast('Você não pode desativar a própria conta', 'error'); return; }
    if (u) { u.active=!u.active; saveDB(); render(); toast(`Usuário ${u.active?'ativado':'desativado'}`, 'success'); }
  }));
  document.querySelectorAll('[data-admin-toggle]').forEach(b => b.addEventListener('click', () => {
    const p = DB.products.find(pr=>pr.id===Number(b.dataset.adminToggle));
    if (p) { p.active=!p.active; saveDB(); render(); toast(`Produto ${p.active?'ativado':'oculto'}`, 'success'); }
  }));
  document.querySelectorAll('[data-admin-del]').forEach(b => b.addEventListener('click', () => {
    confirmDialog({ title: 'Remover este produto da plataforma?', message: 'Ele sai da loja. Os pedidos antigos continuam no histórico.', confirmText: 'Remover', danger: true }, () => { DB.products = DB.products.filter(p=>p.id!==Number(b.dataset.adminDel)); saveDB(); render(); toast('Produto removido', 'success'); });
  }));
  document.querySelectorAll('[data-admin-order]').forEach(sel => sel.addEventListener('change', () => {
    const o = DB.orders.find(or=>or.id===Number(sel.dataset.adminOrder));
    if (o) { const prev = o.status; setOrderStatus(o, sel.value, 'Cancelado pela administração'); render(); toast(sel.value === 'cancelado' && prev !== 'cancelado' ? 'Pedido cancelado e itens devolvidos ao estoque' : 'Status atualizado', 'success'); }
  }));
}

function openUserModal(editId) {
  const u = editId ? DB.users.find(us=>us.id===editId) : null;
  showModal(`
  <div class="modal-title">${u?'Editar':'Novo'} Usuário <button class="btn btn-ghost btn-icon" onclick="closeModal()">✕</button></div>
  <div style="display:grid;gap:.9rem">
    <div class="form-group"><label class="form-label">Nome</label><input class="form-input" id="mu-name" value="${u?.name||''}"></div>
    <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" id="mu-email" value="${u?.email||''}"></div>
    <div class="form-group"><label class="form-label">Perfil</label>
      <select class="form-input form-select" id="mu-role">
        <option value="consumer" ${u?.role==='consumer'?'selected':''}>Consumidor</option>
        <option value="producer" ${u?.role==='producer'?'selected':''}>Produtor</option>
        <option value="admin" ${u?.role==='admin'?'selected':''}>Admin</option>
      </select>
    </div>
    <div class="form-group"><label class="form-label">Usuário (para entrar)</label><input class="form-input" id="mu-login" autocapitalize="none" spellcheck="false" value="${esc(u?.username || '')}" placeholder="ex.: maria"></div>
    <div class="form-group"><label class="form-label">Senha</label><input class="form-input" type="password" id="mu-pass" autocomplete="new-password" placeholder="${u ? 'Deixe em branco para manter a atual' : 'Mínimo de 3 caracteres'}"></div>
    ${!u?`<div class="form-group"><label class="form-label">Nome da Loja</label><input class="form-input" id="mu-store" placeholder="Apenas para Produtor"></div>`:''}
    <button class="btn btn-primary" id="save-user">Salvar Usuário</button>
  </div>`, () => {
    document.getElementById('save-user').addEventListener('click', async () => {
      const name = document.getElementById('mu-name').value.trim();
      const email = document.getElementById('mu-email').value.trim().toLowerCase();
      const pass = document.getElementById('mu-pass').value;
      const username = document.getElementById('mu-login').value.trim().toLowerCase();
      if (username && !/^[a-z0-9._-]{3,30}$/.test(username)) { toast('Usuário: 3 a 30 letras, números, ponto, - ou _', 'error'); return; }
      if (username && DB.users.some(x => x !== u && ((x.username || '').toLowerCase() === username || x.email.toLowerCase() === username))) { toast('Este usuário já existe', 'error'); return; }
      const role = document.getElementById('mu-role').value;
      const store = document.getElementById('mu-store')?.value.trim();
      if (!name || !email) { toast('Preencha nome e email', 'error'); return; }
      if (DB.users.some(x => x !== u && x.email.toLowerCase() === email)) { toast('Este e-mail já está em uso', 'error'); return; }
      const emailChanged = u && u.email.toLowerCase() !== email;
      if ((!u || emailChanged) && !pass) { toast(u ? 'Ao trocar o e-mail, defina uma nova senha' : 'Defina uma senha', 'error'); return; }
      if (pass && pass.length < 3) { toast('A senha precisa ter pelo menos 3 caracteres', 'error'); return; }
      const passwordHash = pass ? await hashPassword(email, pass) : u.passwordHash;
      if (u) { Object.assign(u, { name, email, role, passwordHash, username: username || undefined }); toast('Usuário atualizado!', 'success'); }
      else {
        const maxId = Math.max(...DB.users.map(us=>us.id));
        DB.users.push({ id: maxId+1, name, email, role, passwordHash, ...(username ? { username } : {}), active: true, ...(role==='producer'&&store?{store}:{}) });
        toast('Usuário criado!', 'success');
      }
      saveDB(); closeModal(); render();
    });
  });
}

// ===================== THEME =====================
function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme');
  root.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
}

// ===================== INIT =====================
restoreSession();
render();
