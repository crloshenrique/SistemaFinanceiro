const SUPABASE_URL = 'https://mauuoodifakjeqkwjwkw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXVvb2RpZmFramVxa3dqd2t3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDExNTksImV4cCI6MjA5MjAxNzE1OX0.CRI33uQWhN85DQSvXg3gLgdIEQg4NZV0sJSyd1fPEhA';
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let navegacaoAtualId = 0;
//Adicionar, editar ou remover categorias do serviço:
// Lista de categorias para serviços - Adicione novas aqui facilmente
const CATEGORIAS_SERVICOS = [
    'Informática',
    'Manutenção',
    'Design',
    'Escritório',
    'Comercial',
    'Outros'
];

let ultimaOpcaoSelecionada = null;

// --- NAVEGAÇÃO E INTERFACE ---

function navegar(pagina) {
     atualizarMenuAtivo(pagina);
    navegacaoAtualId++;
    fecharTodosSubmenus();
    const mainContent = document.getElementById('main-content');
    
    // RESET DE CLASSE: Remove classes específicas de outras páginas (como 'content-dashboard')
    mainContent.className = 'content'; 
    
    ultimaOpcaoSelecionada = null;
    
    const titulos = {
        'adicionar': 'Selecione o que deseja adicionar',
        'editar': 'Selecione o que deseja editar',
        'apagar': 'Selecione o que deseja apagar'
    };

    if (titulos[pagina]) {
        mainContent.innerHTML = `
            <div class="selection-container">
                <h2 class="selection-title">${titulos[pagina]}</h2>
                <div class="options-group">
                    ${['entrega', 'serviço', 'conta'].map(tipo => `
                        <div class="option-item">
                            <input type="radio" id="${tipo}" name="tipo-controle" value="${tipo}" 
                                   onclick="gerenciarCliqueRadio(this)">
                            <label for="${tipo}" class="option-label">
                                <div class="check-box"><img src="imagens/certo.png" class="check-icon"></div>
                                <span class="option-text">${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</span>
                            </label>
                        </div>
                    `).join('')}
                </div>
                
                <div id="area-prosseguir" class="action-area">
                    <button class="btn-prosseguir" onclick="validarEProsseguir()">Prosseguir</button>
                </div>
            </div>
        `;
    } else if (pagina === 'home') {
        renderizarHome();
    } else if (pagina === 'dashboard') {
        renderizarDashboard(); // Nova página
    } else if (pagina === 'entregas') {
        renderizarEntregas(); // <--- Adicione aqui
        return; // Para interromper a execução do resto da função navegar
    } else if (pagina === 'servicos') { // <-- Adicione este bloco
        renderizarServicos();
        return;
    } else if (pagina === 'financas') {
        renderizarFinancas();
    }
}

// Lógica para marcar/desmarcar e expandir/recolher
function gerenciarCliqueRadio(radio) {
    const area = document.getElementById('area-prosseguir');
    
    if (ultimaOpcaoSelecionada === radio) {
        radio.checked = false;
        ultimaOpcaoSelecionada = null;
        area.classList.remove('visible');
    } else {
        ultimaOpcaoSelecionada = radio;
        area.classList.add('visible');
    }
}

function validarEProsseguir() {
    const selecionado = document.querySelector('input[name="tipo-controle"]:checked');
    const tituloTexto = document.querySelector('.selection-title').innerText.toLowerCase();
    const acao = tituloTexto.includes('editar') ? 'editar' : (tituloTexto.includes('apagar') ? 'apagar' : 'adicionar');

    if (selecionado) {
        if (selecionado.value === 'entrega') {
            if (acao === 'editar') carregarListaEdicao();
            else if (acao === 'apagar') carregarListaApagar();
            else montarFormularioEntrega();
        } 
        else if (selecionado.value === 'serviço') {
            if (acao === 'adicionar') montarFormularioServico();
            else if (acao === 'editar') carregarListaEdicaoServico();
            else if (acao === 'apagar') carregarListaApagarServico();
        }
        // --- ADICIONE ESTE NOVO BLOCO AQUI ---
        else if (selecionado.value === 'conta') {
            if (acao === 'adicionar') montarFormularioConta();
            else if (acao === 'editar') carregarListaEdicaoContas(); // Chamar a nova função aqui
            else if (acao === 'apagar') carregarListaApagarContas();
        }
        // -------------------------------------
    }
}

async function carregarListaEdicao() {
    const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="loader-container">
                <div class="spinner"></div>
            </div>
        `;
    // Alteramos o .order para 'id' ou 'created_at' para pegar os últimos inseridos de fato
    const { data: entregas, error } = await _supabase
        .from('entregas')
        .select('*')
        .order('id', { ascending: false }) // 'id' garante que o último cadastrado venha primeiro
        .limit(5); 

    if (error) {
        mostrarNotificacao("Erro ao carregar dados", "erro");
        return;
    }

    mainContent.innerHTML = `
        <div class="selection-container" style="min-width: 600px;">
            <h2 class="selection-title">Selecione para editar</h2>
            <table class="edit-table">
                <thead>
                    <tr>
                        <th>Valor</th>
                        <th>Quantidade</th>
                        <th>Origem</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    ${entregas.map(item => `
                        <tr class="edit-row" onclick="abrirEdicaoEntrega(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                            <td>R$${item.valor.toFixed(2).replace('.', ',')}</td>
                            <td>${item.quantidade}</td>
                            <td>${item.origem.charAt(0).toUpperCase() + item.origem.slice(1)}</td>
                            <td>${new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function abrirEdicaoEntrega(item) {
    const mainContent = document.getElementById('main-content');
    
    // Formata a data para o input (AAAA-MM-DD)
    const dataFormatada = item.data.split('T')[0];

    mainContent.innerHTML = `
        <div class="selection-container">
            <h2 class="selection-title">Editar entrega</h2>
            <form id="form-editar-entrega" class="form-container">
                <input type="hidden" id="edit-id" value="${item.id}">
                <div class="form-row">
                    <div class="input-group">
                        <label>Quantidade</label>
                        <input type="number" id="qtd-entrega" value="${item.quantidade}" class="custom-input input-focus-indigo">
                    </div>
                    <div class="input-group">
                        <label>Data</label>
                        <input type="date" id="data-entrega" value="${dataFormatada}" class="custom-input input-focus-indigo">
                    </div>
                </div>
                <div class="form-row">
                    <div class="input-group">
                        <label>Valor (R$)</label>
                        <input type="text" id="valor-entrega" value="${item.valor.toFixed(2).replace('.', ',')}" class="custom-input input-focus-indigo">
                    </div>
                    <div class="input-group">
                        <label>Origem</label>
                        <select id="origem-entrega" class="custom-select input-focus-indigo">
                            <option value="Açaiteria" ${item.origem === 'Açaiteria' ? 'selected' : ''}>Açaiteria</option>
                            <option value="Aplicativos" ${item.origem === 'Aplicativos' ? 'selected' : ''}>Aplicativos</option>
                            <option value="Unter Tech" ${item.origem === 'Unter Tech' ? 'selected' : ''}>Unter Tech</option>
                        </select>
                    </div>
                </div>
                <button type="button" class="btn-salvar" onclick="atualizarEntrega()">Salvar</button>
            </form>
        </div>
    `;
}
// --- FORMULÁRIOS ---

function montarFormularioEntrega() {
    const mainContent = document.getElementById('main-content');
    // Removido o cálculo da variável 'hoje' para o campo iniciar limpo

    mainContent.innerHTML = `
        <div class="selection-container">
            <h2 class="selection-title">Adicionar entrega</h2>
            <form id="form-entrega" class="form-container">
                
                <div class="form-row">
                    <div class="input-group">
                        <label>Quantidade</label>
                        <input type="number" id="qtd-entrega" placeholder="Ex: 10" class="custom-input input-focus-indigo">
                    </div>
                    <div class="input-group">
                        <label>Data</label>
                        <input type="date" id="data-entrega" class="custom-input input-focus-indigo">
                    </div>
                </div>

                <div class="form-row">
                    <div class="input-group">
                        <label>Valor (R$)</label>
                        <input type="text" id="valor-entrega" placeholder="0,00" class="custom-input input-focus-indigo">
                    </div>
                    <div class="input-group">
                        <label>Origem</label>
                        <select id="origem-entrega" class="custom-select input-focus-indigo">
                            <option selected disabled>Selecione</option>
                            <option value="Açaiteria">Açaiteria</option>
                            <option value="Aplicativos">Aplicativos</option>
                            <option value="Unter Tech">Unter Tech</option>
                        </select>
                    </div>
                </div>

<button type="button" id="btn-salvar-entrega" class="btn-salvar" onclick="salvarEntrega()">Salvar</button>
            </form>
        </div>
    `;
}

// --- MENUS E SIDEBAR ---

function toggleSubmenu(event, id) {
    event.preventDefault();
    const submenu = document.getElementById(id);
    document.querySelectorAll('.submenu').forEach(sub => {
        if (sub.id !== id) sub.classList.remove('open');
    });
    submenu.classList.toggle('open');
}

function fecharTodosSubmenus() {
    document.querySelectorAll('.submenu').forEach(sub => {
        sub.classList.remove('open');
    });
}

function atualizarMenuAtivo(pagina) {
    const links = document.querySelectorAll('.menu-item');
    links.forEach(l => l.classList.remove('active'));

    const paginasControle = ['adicionar', 'editar', 'apagar'];

    if (paginasControle.includes(pagina)) {
        // Marca o Controle como ativo
        const controle = document.querySelector('[onclick*="toggleSubmenu"]');
        if (controle) controle.classList.add('active');
    } else {
        // Marca o item normal correspondente
        links.forEach(link => {
            const onclick = link.getAttribute('onclick') || '';
            if (onclick.includes(`'${pagina}'`)) {
                link.classList.add('active');
            }
        });
    }
}

// Inicializadores
atualizarMenuAtivo();
const sidebar = document.querySelector('.sidebar');
sidebar.addEventListener('mouseleave', fecharTodosSubmenus);

function mostrarNotificacao(mensagem, tipo) {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${tipo === 'sucesso' ? 'toast-success' : 'toast-error'}`;
    toast.innerText = mensagem;
    document.body.appendChild(toast);

    // Força um reflow para a animação funcionar
    setTimeout(() => toast.classList.add('visible'), 10);

    // Remove após 3 segundos
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

async function salvarEntrega() {
    const btn = document.getElementById('btn-salvar-entrega');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const qtd = document.getElementById('qtd-entrega').value.trim();
    const valorRaw = document.getElementById('valor-entrega').value.trim();
    const dataRef = document.getElementById('data-entrega').value;
    const origem = document.getElementById('origem-entrega').value;

    // 1. Validação de campos vazios
    if (!qtd || !valorRaw || !dataRef || !origem || origem === "Selecione") {
        mostrarNotificacao("Preencha todos os campos!", "erro");
        btn.disabled = false;
        btn.textContent = 'Salvar';
        return;
    }

    // 2. Validação Rigorosa de Números (Regex)
    const regexNumero = /^\d+([,.]\d+)?$/;
    if (!regexNumero.test(valorRaw)) {
        mostrarNotificacao("Insira valores válidos!", "erro");
        btn.disabled = false;
        btn.textContent = 'Salvar';
        return;
    }

    // 3. Execução do salvamento
    const { error } = await _supabase
        .from('entregas')
        .insert([
            { 
                quantidade: parseInt(qtd),
                data: dataRef,
                valor: parseFloat(valorRaw.replace(',', '.')),
                origem: origem
            }
        ]);

    if (error) {
        mostrarNotificacao("Erro ao conectar com o banco!", "erro");
        console.error(error);
        btn.disabled = false;
        btn.textContent = 'Salvar';
    } else {
    mostrarNotificacao("Entrega adicionada!", "sucesso");
    setTimeout(() => {
        const form = document.getElementById('form-entrega');
        if (form) form.reset();
        btn.disabled = false;
        btn.textContent = 'Salvar';
    }, 500);
}
}

// Estilos para as notificações (Toast) - ALINHAMENTO REAL COM O CONTEÚDO
const style = document.createElement('style');
style.textContent = `
    .toast-notification {
        position: fixed;
        top: -100px;
        /* Centraliza na tela e adiciona 40px (metade do margin-left de 80px da main) */
        left: calc(50% + 40px); 
        transform: translateX(-50%);
        padding: 12px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        font-size: 14px;
        z-index: 9999;
        transition: top 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .toast-notification.visible {
        top: 20px;
    }
    .toast-success { background-color: #22c55e; }
    .toast-error { background-color: #ef4444; }
`;
document.head.appendChild(style);

async function atualizarEntrega() {
    const id = document.getElementById('edit-id').value;
    const qtd = document.getElementById('qtd-entrega').value.trim();
    const valorRaw = document.getElementById('valor-entrega').value.trim();
    const dataRef = document.getElementById('data-entrega').value;
    const origem = document.getElementById('origem-entrega').value;

    // 1. Validação de campos vazios
    if (!qtd || !valorRaw || !dataRef || !origem) {
        mostrarNotificacao("Preencha todos os campos!", "erro");
        return;
    }

    // 2. Validação Rigorosa de Números (Regex)
    const regexNumero = /^\d+([,.]\d+)?$/;

    if (!regexNumero.test(valorRaw)) {
        mostrarNotificacao("Insira valores válidos!", "erro");
        return;
    }

    // 3. Envia a atualização para o Supabase
    const { error } = await _supabase
        .from('entregas')
        .update({ 
            quantidade: parseInt(qtd),
            data: dataRef,
            valor: parseFloat(valorRaw.replace(',', '.')),
            origem: origem
        })
        .eq('id', id);

    if (error) {
        mostrarNotificacao("Erro ao atualizar no banco!", "erro");
        console.error(error);
    } else {
        mostrarNotificacao("Entrega atualizada!", "sucesso");
        
        setTimeout(() => {
            carregarListaEdicao();
        }, 800);
    }
}

async function carregarListaApagar() {
    const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="loader-container">
                <div class="spinner"></div>
            </div>
        `;
    const { data: entregas, error } = await _supabase
        .from('entregas')
        .select('*')
        .order('id', { ascending: false })
        .limit(5); 

    if (error) {
        mostrarNotificacao("Erro ao carregar dados", "erro");
        return;
    }

    mainContent.innerHTML = `
        <div class="selection-container" style="min-width: 600px;">
            <h2 class="selection-title">Clique na lixeira para apagar</h2>
            <table class="edit-table">
                <thead>
                    <tr>
                        <th>Valor</th>
                        <th>Quantidade</th>
                        <th>Origem</th>
                        <th>Data</th>
                        <th style="width: 50px;"></th> 
                    </tr>
                </thead>
                <tbody>
                    ${entregas.map(item => `
                        <tr class="edit-row">
                            <td>R$${item.valor.toFixed(2).replace('.', ',')}</td>
                            <td>${item.quantidade}</td>
                            <td>${item.origem.charAt(0).toUpperCase() + item.origem.slice(1)}</td>
                            <td>${new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                            <td style="text-align: center; padding: 0 10px;">
                                <img src="imagens/lixeira.png" 
                                     alt="Apagar" 
                                     style="max-height: 22px; width: auto; vertical-align: middle; cursor: pointer; transition: filter 0.2s;" 
                                     onclick="confirmarEApagar(this, ${item.id})">
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Função de placeholder para o clique, como solicitado
function prepararExclusaoEntrega(id) {
    console.log("ID selecionado para exclusão:", id);
    // Por enquanto não faz nada, apenas mantém o comportamento de clique
}

async function confirmarEApagar(elemento, id) {
    // Segundo clique: se já estiver marcado para confirmar
    if (elemento.dataset.confirmar === "true") {
        clearTimeout(window.lixeiraTimer);
        
        const { error } = await _supabase
            .from('entregas')
            .delete()
            .eq('id', id);

        if (error) {
            mostrarNotificacao("Erro ao apagar!", "erro");
            resetarLixeira(elemento);
        } else {
            mostrarNotificacao("Entrega apagada!", "sucesso");
            carregarListaApagar(); 
        }
    } else {
        // Primeiro clique: limpa qualquer outra lixeira aberta
        document.querySelectorAll('.edit-table img').forEach(img => resetarLixeira(img));

        // Ativa estado de confirmação e cor vermelha
        elemento.dataset.confirmar = "true";
        elemento.style.filter = "invert(15%) sepia(95%) saturate(6932%) hue-rotate(358deg) brightness(95%) contrast(112%)";
        
        // Dispara o balanço visual apenas uma vez
        elemento.classList.add('lixeira-aviso');
        
        // Remove a classe após a animação acabar (0.5s) para o ícone parar quieto
        setTimeout(() => {
            elemento.classList.remove('lixeira-aviso');
        }, 500);

        // Inicia o contador de 3s para resetar se não houver confirmação
        window.lixeiraTimer = setTimeout(() => {
            resetarLixeira(elemento);
        }, 3000);
    }
}

function resetarLixeira(elemento) {
    if (!elemento) return;
    elemento.style.filter = "none";
    elemento.classList.remove('lixeira-aviso');
    delete elemento.dataset.confirmar;
    if (window.lixeiraTimer) clearTimeout(window.lixeiraTimer);
}

const styleLixeira = document.createElement('style');
styleLixeira.textContent = `
    @keyframes balançoUnico {
        0% { transform: scale(1) rotate(0deg); }
        25% { transform: scale(1.2) rotate(7deg); }
        50% { transform: scale(1.2) rotate(-7deg); }
        75% { transform: scale(1.2) rotate(7deg); }
        100% { transform: scale(1) rotate(0deg); }
    }
    .lixeira-aviso {
        animation: balançoUnico 0.5s ease-in-out;
    }
`;
document.head.appendChild(styleLixeira);

function montarFormularioServico() {
    const mainContent = document.getElementById('main-content');

    mainContent.innerHTML = `
        <div class="selection-container" style="max-width: 550px; min-width: auto;">
            <h2 class="selection-title">Adicionar serviço</h2>
            <form id="form-servico" class="form-container">
                
                <div class="form-row">
                    <div class="input-group">
                        <label>Descrição</label>
                        <input type="text" id="descricao-servico" placeholder="Ex: troca de conector de carga" class="custom-input input-focus-indigo">
                    </div>
                </div>

                <div class="form-row" style="display: flex; gap: 15px; width: 100%; box-sizing: border-box;">
                    <div class="input-group" style="width: calc(30% - 10px); flex: none;">
                        <label>Gasto (R$)</label>
                        <input type="text" id="gasto-servico" placeholder="0,00" class="custom-input input-focus-indigo" style="width: 100%;">
                    </div>
                    <div class="input-group" style="width: calc(30% - 10px); flex: none;">
                        <label>Valor (R$)</label>
                        <input type="text" id="valor-servico" placeholder="0,00" class="custom-input input-focus-indigo" style="width: 100%;">
                    </div>
                    <div class="input-group" style="width: calc(40% - 10px); flex: none;">
                        <label>Data</label>
                        <input type="date" id="data-servico" class="custom-input input-focus-indigo" style="width: 100%;">
                    </div>
                </div>

                <div class="input-group" style="margin-bottom: 0;">
                    <label style="color: white; opacity: 0.8; margin-bottom: 0;">Categoria</label>
                    
                    <div style="background-color: #6c7b91; padding: 15px; border-radius: 8px; display: flex; flex-wrap: wrap; gap: 10px;">
                        ${CATEGORIAS_SERVICOS.map(cat => `
                            <div class="option-item" style="width: auto;">
                                <input type="radio" id="cat-${cat}" name="categoria-servico" value="${cat}" style="display:none">
                                <label for="cat-${cat}" class="option-label" style="height: 34px; border: none; cursor: pointer; transition: all 0.2s;">
                                    <span class="option-text" style="padding: 0 18px; border-left: none; border-radius: 6px; font-size: 14px;">${cat}</span>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <button type="button" id="btn-salvar-servico" class="btn-salvar" onclick="salvarServico()" style="margin-top: 20px;">Salvar</button>
            </form>
        </div>

        <style>
            input[name="categoria-servico"]:checked + .option-label {
                transform: scale(1.05);
            }
            input[name="categoria-servico"]:checked + .option-label .option-text {
                color: #6366f1 !important;
                font-weight: 600;
            }
            .option-label:hover {
                background-color: rgba(255,255,255,0.9);
            }
        </style>
    `;
}

async function salvarServico() {
    const btn = document.getElementById('btn-salvar-servico');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const descricao = document.getElementById('descricao-servico').value.trim();
    const gastoRaw = document.getElementById('gasto-servico').value.trim();
    const valorRaw = document.getElementById('valor-servico').value.trim();
    const dataRef = document.getElementById('data-servico').value;
    const categoriaSelecionada = document.querySelector('input[name="categoria-servico"]:checked');

    if (!descricao || !gastoRaw || !valorRaw || !dataRef || !categoriaSelecionada) {
        mostrarNotificacao("Preencha todos os campos!", "erro");
        btn.disabled = false;
        btn.textContent = 'Salvar';
        return;
    }

    const regexNumero = /^\d+([,.]\d+)?$/;
    if (!regexNumero.test(gastoRaw) || !regexNumero.test(valorRaw)) {
        mostrarNotificacao("Insira valores válidos!", "erro");
        btn.disabled = false;
        btn.textContent = 'Salvar';
        return;
    }

    const { error } = await _supabase
        .from('servicos')
        .insert([
            { 
                descricao: descricao,
                gasto: parseFloat(gastoRaw.replace(',', '.')),
                valor: parseFloat(valorRaw.replace(',', '.')),
                data: dataRef,
                categoria: categoriaSelecionada.value
            }
        ]);

    if (error) {
        mostrarNotificacao("Erro ao conectar com o banco!", "erro");
        btn.disabled = false;
        btn.textContent = 'Salvar';
    } else {
        mostrarNotificacao("Serviço adicionado!", "sucesso");
        setTimeout(() => {
            const form = document.getElementById('form-servico');
            if (form) form.reset();
            document.querySelectorAll('input[name="categoria-servico"]').forEach(r => r.checked = false);
            btn.disabled = false;
            btn.textContent = 'Salvar';
        }, 1000);
    }
}

async function carregarListaEdicaoServico() {
    const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="loader-container">
                <div class="spinner"></div>
            </div>
        `;
    const { data: servicos, error } = await _supabase
        .from('servicos')
        .select('*')
        .order('id', { ascending: false })
        .limit(5); // Alterado de 10 para 5 para manter o padrão

    if (error) {
        mostrarNotificacao("Erro ao carregar serviços", "erro");
        return;
    }

    mainContent.innerHTML = `
        <div class="selection-container" style="min-width: 900px;">
            <h2 class="selection-title">Selecione o serviço para editar</h2>
            <table class="edit-table">
                <thead>
                    <tr>
                        <th style="width: 40%;">Descrição</th> 
                        <th style="width: 10%;">Gasto</th>
                        <th style="width: 10%;">Valor</th>
                        <th style="width: 15%;">Categoria</th> 
                        <th style="width: 15%;">Data</th>
                    </tr>
                </thead>
                <tbody>
                    ${servicos.map(item => `
                        <tr class="edit-row" onclick="abrirEdicaoServico(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                            <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px;">
                                ${item.descricao}
                            </td>
                            <td>R$${item.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td>R$${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td>${item.categoria}</td>
                            <td>${new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Função para abrir o formulário preenchido
function abrirEdicaoServico(item) {
    const mainContent = document.getElementById('main-content');
    const dataFormatada = item.data.split('T')[0];

    mainContent.innerHTML = `
        <div class="selection-container" style="max-width: 550px; min-width: auto;">
            <h2 class="selection-title">Editar serviço</h2>
            <form id="form-editar-servico" class="form-container">
                <input type="hidden" id="edit-servico-id" value="${item.id}">
                
                <div class="form-row">
                    <div class="input-group">
                        <label>Descrição</label>
                        <input type="text" id="descricao-servico" value="${item.descricao}" class="custom-input input-focus-indigo">
                    </div>
                </div>

                <div class="form-row" style="display: flex; gap: 15px; width: 100%; box-sizing: border-box;">
                    <div class="input-group" style="width: calc(30% - 10px); flex: none;">
                        <label>Gasto (R$)</label>
                        <input type="text" id="gasto-servico" value="${item.gasto.toFixed(2).replace('.', ',')}" class="custom-input input-focus-indigo" style="width: 100%;">
                    </div>
                    <div class="input-group" style="width: calc(30% - 10px); flex: none;">
                        <label>Valor (R$)</label>
                        <input type="text" id="valor-servico" value="${item.valor.toFixed(2).replace('.', ',')}" class="custom-input input-focus-indigo" style="width: 100%;">
                    </div>
                    <div class="input-group" style="width: calc(40% - 10px); flex: none;">
                        <label>Data</label>
                        <input type="date" id="data-servico" value="${dataFormatada}" class="custom-input input-focus-indigo" style="width: 100%;">
                    </div>
                </div>

                <div class="input-group" style="margin-bottom: 0;"> 
                    <label style="color: white; opacity: 0.8; margin-bottom: 0;">Categoria</label>
                    <div style="background-color: #6c7b91; padding: 15px; border-radius: 8px; display: flex; flex-wrap: wrap; gap: 10px;">
                        ${CATEGORIAS_SERVICOS.map(cat => `
                            <div class="option-item" style="width: auto;">
                                <input type="radio" id="cat-${cat}" name="categoria-servico" value="${cat}" 
                                    ${item.categoria === cat ? 'checked' : ''} style="display:none">
                                <label for="cat-${cat}" class="option-label" style="height: 34px; border: none; cursor: pointer; transition: all 0.2s;">
                                    <span class="option-text" style="padding: 0 18px; border-left: none; border-radius: 6px; font-size: 14px;">${cat}</span>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <button type="button" class="btn-salvar" onclick="atualizarServico()" style="margin-top: 20px;">Salvar</button>
            </form>
        </div>

        <style>
            input[name="categoria-servico"]:checked + .option-label { transform: scale(1.05); }
            input[name="categoria-servico"]:checked + .option-label .option-text { color: #6366f1 !important; font-weight: 600; }
        </style>
    `;
}

async function atualizarServico() {
    const id = document.getElementById('edit-servico-id').value;
    const descricao = document.getElementById('descricao-servico').value.trim();
    const gastoRaw = document.getElementById('gasto-servico').value.trim();
    const valorRaw = document.getElementById('valor-servico').value.trim();
    const dataRef = document.getElementById('data-servico').value;
    const categoriaSelecionada = document.querySelector('input[name="categoria-servico"]:checked');

    if (!descricao || !gastoRaw || !valorRaw || !dataRef || !categoriaSelecionada) {
        mostrarNotificacao("Preencha todos os campos!", "erro");
        return;
    }

    const regexNumero = /^\d+([,.]\d+)?$/;

    if (!regexNumero.test(gastoRaw) || !regexNumero.test(valorRaw)) {
        mostrarNotificacao("Insira valores válidos!", "erro");
        return;
    }

    const { error } = await _supabase
        .from('servicos')
        .update({ 
            descricao: descricao,
            gasto: parseFloat(gastoRaw.replace(',', '.')),
            valor: parseFloat(valorRaw.replace(',', '.')),
            data: dataRef,
            categoria: categoriaSelecionada.value
        })
        .eq('id', id);

    if (error) {
        mostrarNotificacao("Erro ao atualizar serviço!", "erro");
    } else {
        mostrarNotificacao("Serviço atualizado!", "sucesso");
        setTimeout(() => carregarListaEdicaoServico(), 800);
    }
}

async function carregarListaApagarServico() {
    const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="loader-container">
                <div class="spinner"></div>
            </div>
        `;
    const { data: servicos, error } = await _supabase
        .from('servicos')
        .select('*')
        .order('id', { ascending: false })
        .limit(5); 

    if (error) {
        mostrarNotificacao("Erro ao carregar serviços", "erro");
        return;
    }

    mainContent.innerHTML = `
        <div class="selection-container" style="min-width: 900px;">
            <h2 class="selection-title">Clique na lixeira para apagar</h2>
            <table class="edit-table"> <thead>
                    <tr>
                        <th style="width: 40%;">Descrição</th> 
                        <th style="width: 12%;">Gasto</th>
                        <th style="width: 12%;">Valor</th>
                        <th style="width: 18%;">Categoria</th> 
                        <th style="width: 15%;">Data</th>
                        <th style="width: 50px;"></th> 
                    </tr>
                </thead>
                <tbody>
                    ${servicos.map(item => `
                        <tr class="edit-row">
                            <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 350px;">
                                ${item.descricao}
                            </td>
                            <td>R$${item.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td>R$${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td>${item.categoria}</td>
                            <td>${new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                            <td style="text-align: center; padding: 0 14px; width: 50px;">
                                <img src="imagens/lixeira.png" 
                                     alt="Apagar" 
                                     style="max-height: 22px; width: auto; vertical-align: middle; cursor: pointer; transition: filter 0.2s;" 
                                     onclick="confirmarEApagarServico(this, ${item.id})">
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function confirmarEApagarServico(elemento, id) {
    // Segundo clique: Confirmação real
    if (elemento.dataset.confirmar === "true") {
        clearTimeout(window.lixeiraTimer);
        
        const { error } = await _supabase
            .from('servicos')
            .delete()
            .eq('id', id);

        if (error) {
            mostrarNotificacao("Erro ao apagar serviço!", "erro");
            resetarLixeira(elemento);
        } else {
            mostrarNotificacao("Serviço apagado!", "sucesso");
            carregarListaApagarServico(); 
        }
    } else {
        // Primeiro clique: Prepara para confirmar
        document.querySelectorAll('.edit-table img').forEach(img => resetarLixeira(img));

        elemento.dataset.confirmar = "true";
        // Aplica o filtro vermelho
        elemento.style.filter = "invert(15%) sepia(95%) saturate(6932%) hue-rotate(358deg) brightness(95%) contrast(112%)";
        
        // Ativa a animação de balanço (definida no seu styleLixeira)
        elemento.classList.add('lixeira-aviso');
        
        setTimeout(() => {
            elemento.classList.remove('lixeira-aviso');
        }, 500);

        // Reset automático após 3 segundos se não confirmar
        window.lixeiraTimer = setTimeout(() => {
            resetarLixeira(elemento);
        }, 3000);
    }
}

function montarFormularioConta() {
    const mainContent = document.getElementById('main-content');

    mainContent.innerHTML = `
        <div class="container-flex-contas">
            <div class="selection-container form-conta-principal">
                <h2 class="selection-title">Adicionar conta</h2>
                <form id="form-conta" class="form-container">
                    <div class="form-row">
                        <div class="input-group">
                            <label>Descrição</label>
                            <input type="text" id="descricao-conta" placeholder="Ex: Empréstimo consignado" class="custom-input input-focus-indigo">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="input-group">
                            <label>Credor</label>
                            <input type="text" id="credor-conta" placeholder="Ex: Nubank" class="custom-input input-focus-indigo">
                        </div>
                        <div class="input-group">
                            <label>Parcelas</label>
                            <input type="text" id="parcelas-input" placeholder="Ex: 12" class="custom-input input-focus-indigo" maxlength="4">
                        </div>
                    </div>
                    <button type="button" id="btn-prosseguir-conta" class="btn-salvar" onclick="gerarParcelas()">Prosseguir</button>
                </form>
            </div>

            <div id="container-parcelas-lista" class="selection-container lista-parcelas-contas" style="display: none;">
                <h2 class="selection-title">Parcelas</h2>
                
                <div id="corpo-parcelas" class="scroll-vazado"></div>

                <button type="button" id="btn-salvar-conta" class="btn-salvar" style="width: 100%; margin-top: 15px;" onclick="salvarConta()">Salvar</button>
            </div>
        </div>
    `;
}

function gerarParcelas() {
    const btn = document.getElementById('btn-prosseguir-conta');
    const descricao = document.getElementById('descricao-conta').value.trim();
    const credor = document.getElementById('credor-conta').value.trim();
    const inputParcelas = document.getElementById('parcelas-input');
    const containerParcelas = document.getElementById('container-parcelas-lista');
    const corpo = document.getElementById('corpo-parcelas');
    
    const valorParcelaRaw = inputParcelas.value.trim();
    const regexInteiro = /^\d+$/;

    if (!descricao || !credor || !valorParcelaRaw) {
        mostrarNotificacao("Preencha todos os campos!", "erro");
        return;
    }

    if (!regexInteiro.test(valorParcelaRaw) || parseInt(valorParcelaRaw) <= 0) {
        mostrarNotificacao("Insira valores válidos!", "erro");
        return;
    }

    const qtd = parseInt(valorParcelaRaw);
    corpo.innerHTML = '';

    for (let i = 1; i <= qtd; i++) {
        const linha = document.createElement('div');
        linha.className = 'linha-parcela-vazada';
        linha.innerHTML = `
            <div class="num-parcela-field">${i}x</div>
            <input type="text" class="custom-input input-focus-indigo" placeholder="R$" style="width: 100px;">
            <input type="date" class="custom-input input-focus-indigo" style="width: 135px;">
        `;
        corpo.appendChild(linha);
    }

    containerParcelas.style.display = 'block';
    document.querySelector('.container-flex-contas').style.justifyContent = 'center';
}

async function salvarConta() {
    const btn = document.getElementById('btn-salvar-conta');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const descricao = document.getElementById('descricao-conta').value.trim();
    const credor = document.getElementById('credor-conta').value.trim();
    const totalParcelas = document.getElementById('parcelas-input').value.trim();
    const linhasParcelas = document.querySelectorAll('.linha-parcela-vazada');
    
    if (!descricao || !credor || !totalParcelas) {
        mostrarNotificacao("Preencha todos os campos!", "erro");
        btn.disabled = false;
        btn.textContent = 'Salvar';
        return;
    }

    const regexNumero = /^\d+([,.]\d+)?$/;
    const dadosParcelas = [];

    for (let i = 0; i < linhasParcelas.length; i++) {
        const inputs = linhasParcelas[i].querySelectorAll('input');
        const valorRaw = inputs[0].value.trim();
        const dataVencimento = inputs[1].value;

        if (!valorRaw || !dataVencimento) {
            mostrarNotificacao("Preencha todos os campos!", "erro");
            btn.disabled = false;
            btn.textContent = 'Salvar';
            return;
        }

        if (!regexNumero.test(valorRaw)) {
            mostrarNotificacao("Insira valores válidos!", "erro");
            btn.disabled = false;
            btn.textContent = 'Salvar';
            return;
        }

        dadosParcelas.push({
            valor: parseFloat(valorRaw.replace(',', '.')),
            data: dataVencimento,
            numero_parcela: i + 1,
            status: false
        });
    }

    const { data: contaCriada, error: erroConta } = await _supabase
        .from('contas')
        .insert([{ 
            descricao: descricao, 
            credor: credor, 
            total_parcelas: parseInt(totalParcelas) 
        }])
        .select();

    if (erroConta) {
        mostrarNotificacao("Erro ao conectar com o banco!", "erro");
        btn.disabled = false;
        btn.textContent = 'Salvar';
        return;
    }

    const contaId = contaCriada[0].id;
    dadosParcelas.forEach(p => p.conta_id = contaId);

    const { error: erroParcelas } = await _supabase
        .from('contas_parcelas')
        .insert(dadosParcelas);

    if (erroParcelas) {
        mostrarNotificacao("Erro ao salvar parcelas!", "erro");
        btn.disabled = false;
        btn.textContent = 'Salvar';
    } else {
        mostrarNotificacao("Conta adicionada!", "sucesso");

        setTimeout(() => {
            const form = document.getElementById('form-conta');
            if (form) form.reset();

            const containerParcelas = document.getElementById('container-parcelas-lista');
            if (containerParcelas) containerParcelas.style.display = 'none';

            const corpo = document.getElementById('corpo-parcelas');
            if (corpo) corpo.innerHTML = '';

            const flexContainer = document.querySelector('.container-flex-contas');
            if (flexContainer) flexContainer.style.justifyContent = 'flex-start';

            btn.disabled = false;
            btn.textContent = 'Salvar';
        }, 1000);
    }
}

async function carregarListaEdicaoContas() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="loader-container">
            <div class="spinner"></div>
        </div>
    `;

    const { data: contas, error } = await _supabase
        .from('contas')
        .select(`
            *,
            contas_parcelas (id, status, valor)
        `)
        .order('id', { ascending: false });

    if (error) {
        mostrarNotificacao("Erro ao carregar contas", "erro");
        return;
    }

    mainContent.innerHTML = `
        <div class="selection-container" style="background: transparent; padding: 0; min-width: 100%; align-self: flex-start; margin-top: 40px;">
            <h2 class="selection-title-alinhado">Selecione a conta para editar</h2>
            ${contas.length === 0
                ? '<p style="color: #64748b; font-size: 15px; text-align: center; width: 100%;">Nenhuma conta encontrada.</p>'
                : `<div class="cards-grid">
                    ${contas.map(conta => {
                        const valorRestante = conta.contas_parcelas
                            .filter(p => p.status === false)
                            .reduce((acc, p) => acc + p.valor, 0);

                        const valorFormatado = valorRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00A0/g, '');

                        const pagas = conta.contas_parcelas.filter(p => p.status === true).length;
                        const total = conta.total_parcelas;
                        const porcentagem = total > 0 ? (pagas / total) * 100 : 0;

                        return `
                            <div class="card-conta-edit" onclick="abrirEdicaoConta(${JSON.stringify(conta).replace(/"/g, '&quot;')})">
                                <div class="card-header-credor">
                                    <span class="nome-credor">${conta.credor}</span>
                                    <div class="valor-total-restante">${valorFormatado}</div>
                                </div>
                                
                                <div class="card-body">
                                    <span class="label-card">Descrição</span>
                                    <p class="desc-card">${conta.descricao}</p>
                                </div>

                                <div class="card-footer-parcelas">
                                    <span class="label-card">Parcelas</span>
                                    <div class="progresso-container">
                                        <div class="progresso-barra" style="width: ${porcentagem}%"></div>
                                    </div>
                                    <div class="progresso-texto">
                                        ${pagas}/${total}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>`
            }
        </div>
    `;
}

async function abrirEdicaoConta(conta) {
    // Primeiro, montamos a estrutura visual idêntica ao 'Adicionar'
    montarFormularioConta();
    
    // Ajustamos o título e adicionamos um campo oculto para o ID
    document.querySelector('.selection-title').innerText = "Editar conta";
    const form = document.getElementById('form-conta');
    form.innerHTML += `<input type="hidden" id="edit-conta-id" value="${conta.id}">`;

    // Preenche os campos principais
    document.getElementById('descricao-conta').value = conta.descricao;
    document.getElementById('credor-conta').value = conta.credor;
    document.getElementById('parcelas-input').value = conta.total_parcelas;
    document.getElementById('parcelas-input').readOnly = true; // Evita bugar a estrutura de parcelas já existente

    // Busca as parcelas detalhadas desta conta
    const { data: parcelas } = await _supabase
        .from('contas_parcelas')
        .select('*')
        .eq('conta_id', conta.id)
        .order('numero_parcela', { ascending: true });

    // Renderiza as parcelas na segunda tabela
    const containerParcelas = document.getElementById('container-parcelas-lista');
    const corpo = document.getElementById('corpo-parcelas');
    corpo.innerHTML = '';

    parcelas.forEach(p => {
        const linha = document.createElement('div');
        linha.className = 'linha-parcela-vazada';
        linha.innerHTML = `
            <div class="num-parcela-field">${p.numero_parcela}x</div>
            <input type="text" class="custom-input input-focus-indigo" value="${p.valor.toFixed(2).replace('.', ',')}" style="width: 100px;">
            <input type="date" class="custom-input input-focus-indigo" value="${p.data}" style="width: 135px;">
            <input type="hidden" class="parcela-id" value="${p.id}">
        `;
        corpo.appendChild(linha);
    });

    containerParcelas.style.display = 'block';
    
    // Altera o comportamento do botão de salvar para "atualizar"
    const btnAdicionar = containerParcelas.querySelector('button');
    btnAdicionar.innerText = "Salvar";
    btnAdicionar.onclick = atualizarContaExistente;
}

async function atualizarContaExistente() {
    const idConta = document.getElementById('edit-conta-id').value;
    const descricao = document.getElementById('descricao-conta').value.trim();
    const credor = document.getElementById('credor-conta').value.trim();
    const linhasParcelas = document.querySelectorAll('.linha-parcela-vazada');

    if (!descricao || !credor) {
        mostrarNotificacao("Preencha todos os campos!", "erro");
        return;
    }

    // 1. Atualiza os dados da conta (Pai) usando UPDATE em vez de INSERT
    const { error: erroConta } = await _supabase
        .from('contas')
        .update({ 
            descricao: descricao, 
            credor: credor 
        })
        .eq('id', idConta);

    if (erroConta) {
        mostrarNotificacao("Erro ao atualizar dados da conta", "erro");
        return;
    }

    // 2. Atualiza os valores e datas de cada parcela
    for (const linha of linhasParcelas) {
        const idParcela = linha.querySelector('.parcela-id').value;
        const valorRaw = linha.querySelector('input[type="text"]').value.trim();
        const dataVencimento = linha.querySelector('input[type="date"]').value;

        const valorNumerico = parseFloat(valorRaw.replace(',', '.'));

        await _supabase
            .from('contas_parcelas')
            .update({ 
                valor: valorNumerico, 
                data: dataVencimento 
            })
            .eq('id', idParcela);
    }

    // 3. Sucesso e Retorno
    mostrarNotificacao("Conta atualizada!", "sucesso");

    setTimeout(() => {
        navegar('editar'); // Recarrega a lista de cards
    }, 1500);
}

async function carregarListaApagarContas() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="loader-container">
            <div class="spinner"></div>
        </div>
    `;

    const { data: contas, error } = await _supabase
        .from('contas')
        .select(`
            *,
            contas_parcelas (status, valor)
        `)
        .order('id', { ascending: false });

    if (error) {
        mostrarNotificacao("Erro ao carregar contas", "erro");
        return;
    }

    mainContent.innerHTML = `
        <div class="selection-container" style="min-width: 900px;">
            <h2 class="selection-title">Clique na lixeira para apagar</h2>
            <table class="edit-table">
                <thead>
                    <tr>
                        <th style="width: 150px;">Credor</th>
                        <th style="width: auto;">Descrição</th>
                        <th style="width: 140px;">Restante</th>
                        <th style="width: 80px;">Parcelas</th>
                        <th style="width: 50px;"></th> 
                    </tr>
                </thead>
                <tbody>
                    ${contas.map(conta => {
                        const valorRestante = conta.contas_parcelas
                            .filter(p => p.status === false)
                            .reduce((acc, p) => acc + p.valor, 0);
                        
                        const valorFormatado = valorRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        const pagas = conta.contas_parcelas.filter(p => p.status === true).length;

                        return `
                            <tr class="edit-row">
                                <td style="font-weight: 600;">${conta.credor}</td>
                                <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 350px;">
                                    ${conta.descricao}
                                </td>
                                <td>${valorFormatado}</td>
                                <td style="text-align: left;">${pagas}/${conta.total_parcelas}</td>
                                <td style="text-align: center; padding: 0 10px;">
                                    <img src="imagens/lixeira.png" 
                                         alt="Apagar" 
                                         style="max-height: 22px; width: auto; vertical-align: middle; cursor: pointer; transition: filter 0.2s;" 
                                         onclick="confirmarEApagarConta(this, ${conta.id})">
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function confirmarEApagarConta(elemento, id) {
    // Segundo clique: Confirmação real
    if (elemento.dataset.confirmar === "true") {
        clearTimeout(window.lixeiraTimer);
        
        const { error } = await _supabase
            .from('contas')
            .delete()
            .eq('id', id);

        if (error) {
            mostrarNotificacao("Erro ao apagar conta!", "erro");
            resetarLixeira(elemento);
        } else {
            mostrarNotificacao("Conta apagada!", "sucesso");
            carregarListaApagarContas(); 
        }
    } else {
        // Primeiro clique: Prepara para confirmar (Fica vermelho e balança)
        document.querySelectorAll('.edit-table img').forEach(img => resetarLixeira(img));

        elemento.dataset.confirmar = "true";
        elemento.style.filter = "invert(15%) sepia(95%) saturate(6932%) hue-rotate(358deg) brightness(95%) contrast(112%)";
        elemento.classList.add('lixeira-aviso');
        
        setTimeout(() => {
            elemento.classList.remove('lixeira-aviso');
        }, 500);

        window.lixeiraTimer = setTimeout(() => {
            resetarLixeira(elemento);
        }, 3000);
    }
}

function renderizarEntregas() {
    const mainContent = document.getElementById('main-content');
    
    // Referência do tempo real (HOJE)
    const dataHoje = new Date();
    const dHoje = dataHoje.getDate();
    const mHoje = dataHoje.getMonth();
    const aHoje = dataHoje.getFullYear();

    const filtroMes = document.getElementById('filtro-mes');
    const filtroAno = document.getElementById('filtro-ano');
    const filtroOrigem = document.getElementById('filtro-origem');

    // Mês e Ano selecionados nos filtros
    const mesSelecionado = filtroMes ? parseInt(filtroMes.value) : mHoje;
    const anoSelecionado = filtroAno ? parseInt(filtroAno.value) : aHoje;
    const origemAtual = filtroOrigem ? filtroOrigem.value : "Açaiteria";

    const mesesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const mesesCompletos = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const diasSemana = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
    const origens = ["Todos", "Açaiteria", "Aplicativos", "Unter Tech"];

    // 1. HTML DOS FILTROS
    let htmlFiltros = `
    <div style="width: 100%; display: flex; justify-content: center;">
        <div class="filtros-container">
            <div class="filtro-item">
                <label>Mês</label>
                <select id="filtro-mes" onchange="renderizarEntregas()">
                    ${mesesAbrev.map((m, i) => `<option value="${i}" ${i === mesSelecionado ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
            </div>
            <div class="filtro-item">
                <label>Ano</label>
                <select id="filtro-ano" onchange="renderizarEntregas()">
                    ${[2026, 2027, 2028, 2029, 2030].map(a => `<option value="${a}" ${a === anoSelecionado ? 'selected' : ''}>${a}</option>`).join('')}
                </select>
            </div>
            <div class="filtro-item">
                <label>Origem</label>
                <select id="filtro-origem" onchange="atualizarDadosCalendario()">
                    ${origens.map(o => `<option value="${o}" ${o === origemAtual ? 'selected' : ''}>${o}</option>`).join('')}
                </select>
            </div>
        </div>
    </div>`;

    // 2. HTML DO CALENDÁRIO
    let htmlCalendario = `<div class="calendario-container">`;
    diasSemana.forEach(dia => {
        htmlCalendario += `<div class="dia-semana-card">${dia}</div>`;
    });

    const primeiroDiaMes = new Date(anoSelecionado, mesSelecionado, 1).getDay();
    const diasNoMes = new Date(anoSelecionado, mesSelecionado + 1, 0).getDate();

    for (let i = 0; i < primeiroDiaMes; i++) {
        htmlCalendario += `<div class="dia-mes-card vazio"></div>`;
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const diaFormatado = dia < 10 ? `0${dia}` : dia;
        const mesMinusculo = mesesAbrev[mesSelecionado].toLowerCase();
        const dataExibicao = `${diaFormatado}/${mesMinusculo}`;
        
        // BORDA FIXA: Só no dia real de hoje
        const estiloHoje = (dia === dHoje && mesSelecionado === mHoje && anoSelecionado === aHoje) 
            ? 'style="border: 1px solid #6366f1;"' 
            : '';
        
        htmlCalendario += `
            <div class="dia-mes-card" ${estiloHoje}>
                <span class="data-texto">${dataExibicao}</span>
                <div class="divisor-card"></div>
                <span class="qtd-entregas" style="color: #64748b;">0</span>
            </div>`;
    }
    htmlCalendario += `</div>`;

    // 3. HTML DOS CARDS DE LUCRO (GRID ANUAL)
    let htmlTotalEntregas = `<div class="entregas-mensal-grid">`;
    mesesCompletos.forEach((mes, i) => {
        
        // BORDA FIXA: No mês real de hoje (se o ano for o atual)
        const estiloMesAtualReal = (i === mHoje && anoSelecionado === aHoje) 
            ? 'style="border: 1px solid #6366f1;"' 
            : '';

        htmlTotalEntregas += `
            <div class="card-entregas-total" ${estiloMesAtualReal}>
                <div class="card-entregas-total-header">${mes}</div>
                <div class="card-entregas-total-quant">0</div>
            </div>`;
    });
    htmlTotalEntregas += `</div>`;

    mainContent.innerHTML = `
        <div style="display: flex; flex-direction: column; width: 100%; align-items: center; gap: 10px;">
            ${htmlFiltros}
            <div class="layout-entregas">
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px; padding-left: 16px;">
                        <div style="width: 4px; height: 20px; background-color: #6366f1; border-radius: 2px;"></div>
                        <h3 style="font-size: 16px; font-weight: 600; color: #475569; margin: 0;">${mesesCompletos[mesSelecionado]}</h3>
                    </div>
                    ${htmlCalendario}
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 4px; height: 20px; background-color: #6366f1; border-radius: 2px;"></div>
                        <h3 style="font-size: 16px; font-weight: 600; color: #475569; margin: 0;">${anoSelecionado}</h3>
                    </div>
                    ${htmlTotalEntregas}
                </div>
            </div>
        </div>
    `;

    atualizarDadosCalendario();
}

async function atualizarDadosCalendario(pularBuscaAnual = false) {
    const mesSelect = document.getElementById('filtro-mes').value;
    const anoSelect = document.getElementById('filtro-ano').value;
    const origem = document.getElementById('filtro-origem').value;

    const mesNum = parseInt(mesSelect);
    const anoNum = parseInt(anoSelect);

    const ultimoDia = new Date(anoNum, mesNum + 1, 0).getDate();
    const mesFormatado = String(mesNum + 1).padStart(2, '0');
    const dataInicio = `${anoNum}-${mesFormatado}-01`;
    const dataFim = `${anoNum}-${mesFormatado}-${ultimoDia}T23:59:59`;

    // 1. RESET IMEDIATO (Mais específico para o calendário)
    document.querySelectorAll('.dia-mes-card .qtd-entregas').forEach(span => {
        span.innerText = '0';
        span.style.color = '#64748b'; 
    });

    if (!pularBuscaAnual) {
        document.querySelectorAll('.card-entregas-total-quant').forEach(card => {
            card.innerText = '0';
            card.style.color = '#64748b';
        });
    }

    // 2. BUSCA MENSAL
    let queryMensal = _supabase
        .from('entregas') 
        .select('data, quantidade')
        .gte('data', dataInicio)
        .lte('data', dataFim);

    if (origem !== "Todos") {
        queryMensal = queryMensal.eq('origem', origem);
    }

    let promessaAnual = null;
    if (!pularBuscaAnual) {
        let queryAnual = _supabase
            .from('resumo_entregas_contagem')
            .select('mes_referencia, total_entregas') 
            .gte('mes_referencia', `${anoNum}-01-01`)
            .lte('mes_referencia', `${anoNum}-12-31`);

        if (origem !== "Todos") {
            queryAnual = queryAnual.eq('origem', origem);
        }
        promessaAnual = queryAnual;
    }

    const [resMensal, resAnual] = await Promise.all([
        queryMensal,
        promessaAnual 
    ]);

    // 4. PREENCHIMENTO DO CALENDÁRIO (Lógica corrigida)
    if (!resMensal.error && resMensal.data) {
        // Criamos um mapa para somar as quantidades por dia primeiro
        const totaisPorDia = {};
        
        resMensal.data.forEach(entrega => {
            const dia = parseInt(entrega.data.split('-')[2]);
            totaisPorDia[dia] = (totaisPorDia[dia] || 0) + (entrega.quantidade || 0);
        });

        // Agora aplicamos os totais aos cards, evitando o acúmulo de texto
        const cards = document.querySelectorAll('.dia-mes-card:not(.vazio)');
        cards.forEach(card => {
            const textoData = card.querySelector('.data-texto').innerText;
            const diaDoCard = parseInt(textoData.split('/')[0]);
            const spanQtd = card.querySelector('.qtd-entregas');
            
            if (totaisPorDia[diaDoCard]) {
                const total = totaisPorDia[diaDoCard];
                spanQtd.innerText = total;
                spanQtd.style.color = '#6366f1'; // Cor de destaque (Roxo)
            } else {
                spanQtd.innerText = '0';
                spanQtd.style.color = '#64748b';
            }
        });
    }

    // 5. PREENCHIMENTO DO HISTÓRICO ANUAL
    const cardsAnuaisValores = document.querySelectorAll('.card-entregas-total-quant');

    if (pularBuscaAnual) {
        cardsAnuaisValores.forEach((card, i) => {
            card.style.color = (i === mesNum) ? '#6366f1' : '#64748b';
        });
    } else if (resAnual && !resAnual.error && resAnual.data) {
        const totaisMeses = new Array(12).fill(0);
        
        resAnual.data.forEach(item => {
            const dataObjeto = new Date(item.mes_referencia);
            const mesItem = dataObjeto.getUTCMonth(); 
            totaisMeses[mesItem] += parseInt(item.total_entregas || 0);
        });

        totaisMeses.forEach((total, i) => {
            if (cardsAnuaisValores[i]) {
                cardsAnuaisValores[i].innerText = total;
                cardsAnuaisValores[i].style.color = (i === mesNum) ? '#6366f1' : '#64748b';
            }
        });
    }
}

// Variável global para fácil alteração
let metaDoMes = 2000;

async function renderizarFinancas() {
    const mainContent = document.getElementById('main-content');
    
    const dataHoje = new Date();
    const mesAtual = dataHoje.getMonth() + 1;
    const anoAtual = dataHoje.getFullYear();

    mainContent.innerHTML = `
        <div class="financas-page-wrapper" style="display: flex; flex-direction: column; width: 100%; align-items: center;">

            <div class="filtros-container" style="
                margin-bottom: 20px; /* Margem fixa para evitar deslocamento */
                margin-top: 0px;
                position: relative;
                z-index: 10;
                display: flex;
                flex-direction: row;
                gap: 12px;
                width: fit-content;
            ">
                <div class="filtro-item">
                    <label>Mês</label>
                    <select id="filtro-mes-financas" onchange="atualizarGraficoFinancas()">
                        <option value="01" ${mesAtual === 1 ? 'selected' : ''}>Janeiro</option>
                        <option value="02" ${mesAtual === 2 ? 'selected' : ''}>Fevereiro</option>
                        <option value="03" ${mesAtual === 3 ? 'selected' : ''}>Março</option>
                        <option value="04" ${mesAtual === 4 ? 'selected' : ''}>Abril</option>
                        <option value="05" ${mesAtual === 5 ? 'selected' : ''}>Maio</option>
                        <option value="06" ${mesAtual === 6 ? 'selected' : ''}>Junho</option>
                        <option value="07" ${mesAtual === 7 ? 'selected' : ''}>Julho</option>
                        <option value="08" ${mesAtual === 8 ? 'selected' : ''}>Agosto</option>
                        <option value="09" ${mesAtual === 9 ? 'selected' : ''}>Setembro</option>
                        <option value="10" ${mesAtual === 10 ? 'selected' : ''}>Outubro</option>
                        <option value="11" ${mesAtual === 11 ? 'selected' : ''}>Novembro</option>
                        <option value="12" ${mesAtual === 12 ? 'selected' : ''}>Dezembro</option>
                    </select>
                </div>
                <div class="filtro-item">
                    <label>Ano</label>
                    <select id="filtro-ano-financas" onchange="atualizarGraficoFinancas()">
                        <option value="2026" ${anoAtual === 2026 ? 'selected' : ''}>2026</option>
                        <option value="2027" ${anoAtual === 2027 ? 'selected' : ''}>2027</option>
                        <option value="2028" ${anoAtual === 2028 ? 'selected' : ''}>2028</option>
                        <option value="2029" ${anoAtual === 2029 ? 'selected' : ''}>2029</option>
                        <option value="2030" ${anoAtual === 2030 ? 'selected' : ''}>2030</option>
                    </select>
                </div>
            </div>

            <div id="container-dinamico-grafico" style="
                width: 100%;
                min-height: calc(100vh - 180px); 
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start; 
                position: relative;
            ">
                <div id="loading-overlay" style="position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); display: flex; justify-content: center; align-items: center;">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>
    `;

    await atualizarGraficoFinancas();
}


async function buscarGanhosTotaisDoMes(mes, ano) {
    const mesNum = parseInt(mes) - 1; // converte "04" → 3 (0-11)
    const anoNum = parseInt(ano);

    const ultimoDia = new Date(anoNum, mesNum + 1, 0).getDate();
    const mesFormatado = String(mesNum + 1).padStart(2, '0');
    
    const dataInicio = `${anoNum}-${mesFormatado}-01`;
    const dataFim = `${anoNum}-${mesFormatado}-${ultimoDia}T23:59:59`;
    const dataReferenciaView = `${anoNum}-${mesFormatado}-01`;

    const { data: dataEntregas } = await _supabase
        .from('resumo_entregas_mensais')
        .select('total_valor')
        .eq('mes_referencia', dataReferenciaView);

    const { data: dataServicos } = await _supabase
        .from('servicos')
        .select('valor, gasto')
        .gte('data', dataInicio)
        .lte('data', dataFim);

    const totalEntregas = dataEntregas?.reduce((acc, item) => acc + (item.total_valor || 0), 0) || 0;
    
    const totalServicos = dataServicos?.reduce((acc, item) => {
        return acc + ((item.valor || 0) - (item.gasto || 0));
    }, 0) || 0;

    return totalEntregas + totalServicos;
}

async function atualizarGraficoFinancas() {
    const areaGrafico = document.getElementById('container-dinamico-grafico');
    const mes = document.getElementById('filtro-mes-financas').value;
    const ano = document.getElementById('filtro-ano-financas').value;

    areaGrafico.style.justifyContent = 'center';
    areaGrafico.innerHTML = `
    <div style="position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); display: flex; justify-content: center; align-items: center;">
        <div class="spinner"></div>
    </div>
`;

    const mesNum = parseInt(mes) - 1;
    const anoNum = parseInt(ano);
    const ultimoDia = new Date(anoNum, mesNum + 1, 0).getDate();
    const mesFormatado = String(mesNum + 1).padStart(2, '0');
    const dataInicio = `${anoNum}-${mesFormatado}-01`;
    const dataFim = `${anoNum}-${mesFormatado}-${ultimoDia}T23:59:59`;
    const dataReferenciaView = `${anoNum}-${mesFormatado}-01`;

    const { data: dataEntregas } = await _supabase.from('resumo_entregas_mensais').select('total_valor').eq('mes_referencia', dataReferenciaView);
    const { data: dataServicos } = await _supabase.from('servicos').select('valor, gasto').gte('data', dataInicio).lte('data', dataFim);
    const { data: valorPorOrigem } = await _supabase.from('resumo_entregas_mensais').select('origem, total_valor').eq('mes_referencia', dataReferenciaView);
    const { data: contagemPorOrigem } = await _supabase.from('resumo_entregas_contagem').select('origem, total_entregas').eq('mes_referencia', dataReferenciaView);
    const { data: contas } = await _supabase.from('contas').select(`*, contas_parcelas (id, status, valor, data)`).order('id', { ascending: false });

    const totalEntregas = dataEntregas?.reduce((acc, item) => acc + (item.total_valor || 0), 0) || 0;
    const totalServicos = dataServicos?.reduce((acc, item) => acc + ((item.valor || 0) - (item.gasto || 0)), 0) || 0;
    const ganhosAtuaisVisual = totalEntregas + totalServicos;

    const percPrincipal = Math.min((ganhosAtuaisVisual / metaDoMes) * 100, 100);
    const totalCategorias = totalEntregas + totalServicos;
    const percEntregas = totalCategorias > 0 ? Math.round((totalEntregas / totalCategorias) * 100) : 0;
    const percServicos = totalCategorias > 0 ? 100 - percEntregas : 0;

    const origens = ['Açaiteria', 'Aplicativos', 'Unter Tech'];
    const dadosOrigem = origens.map(origem => {
        const valorItem = valorPorOrigem?.find(i => i.origem === origem);
        const contItem = contagemPorOrigem?.find(i => i.origem === origem);
        return {
            origem,
            valor: valorItem?.total_valor || 0,
            quantidade: contItem?.total_entregas || 0
        };
    });
    const totalValorOrigens = dadosOrigem.reduce((acc, i) => acc + i.valor, 0);

    const criarCirculo = (tamanho, raio, percentual, titulo, valorBruto, textoInferior, isMini = false) => {
        const circ = 2 * Math.PI * raio;
        const off = circ - (percentual / 100) * circ;
        const stroke = isMini ? 16 : 22;
        const valorFormatado = `R$${valorBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

        return `
            <div class="progress-circle" style="width: ${tamanho}px; height: ${tamanho}px; display: flex; align-items: center; justify-content: center;">
                <svg width="${tamanho}" height="${tamanho}" style="transform: rotate(-90deg); position: absolute;">
                    <circle class="circle-bg" cx="${tamanho/2}" cy="${tamanho/2}" r="${raio}" style="stroke-width: ${stroke}; fill: none;"></circle>
                    <circle class="circle-progress" cx="${tamanho/2}" cy="${tamanho/2}" r="${raio}" 
                        style="stroke-dasharray: ${circ}; stroke-dashoffset: ${off}; stroke-width: ${stroke}; fill: none; stroke-linecap: round; transition: stroke-dashoffset 0.5s ease;">
                    </circle>
                </svg>
                <div class="circle-center" style="display: flex; flex-direction: column; align-items: center; text-align: center; z-index: 2;">
                    <span class="label-ganhos" style="color: #64748b; ${isMini ? 'font-size: 12px;' : 'font-size: 15px;'}">${titulo}</span>
                    <span class="valor-atual" style="font-weight: bold; color: #6366f1; margin: 2px 0; ${isMini ? 'font-size: 20px;' : 'font-size: 30px;'}">${valorFormatado}</span>
                    <span class="meta-info" style="color: #94a3b8; font-weight: 500; ${isMini ? 'font-size: 14px;' : 'font-size: 12px;'}">${textoInferior}</span>
                </div>
            </div>
        `;
    };

    const circulosOrigem = dadosOrigem.map(item => {
        const perc = totalValorOrigens > 0 ? Math.round((item.valor / totalValorOrigens) * 100) : 0;
        return `<div class="mini-grafico-lateral">${criarCirculo(200, 85, perc, item.origem, item.valor, `${item.quantidade} entregas`, true)}</div>`;
    }).join('');

    const cardsContas = (contas || []).map(conta => {
        const valorRestante = conta.contas_parcelas
            .filter(p => p.status === false)
            .reduce((acc, p) => acc + p.valor, 0);

        const valorFormatado = valorRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00A0/g, '');

        const pagas = conta.contas_parcelas.filter(p => p.status === true).length;
        const total = conta.total_parcelas;
        const porcentagem = total > 0 ? (pagas / total) * 100 : 0;

        const parcelasOrdenadas = [...conta.contas_parcelas].sort((a, b) => a.id - b.id);

        const parcelasHTML = parcelasOrdenadas.map((parcela, idx) => {
            const nomeMes = parcela.data
                ? new Date(parcela.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toLowerCase()
                : '';

            return `
        <div style="display: flex; align-items: center; gap: 10px; padding: 8px 4px; border-bottom: 1px solid #f1f5f9;">
            <span style="font-size: 13px; color: #6366f1; min-width: 16px; font-weight: 700; text-align: center;">${idx + 1}</span>
            
            <span style="font-size: 13px; color: #64748b; font-weight: 300; margin-left: -2px;">|</span>
            
            <span style="font-size: 13px; font-weight: 700; color: #64748b; min-width: 28px; margin-left: 4px;">${nomeMes}</span>
            <span style="font-size: 13px; font-weight: 600; color: #64748b; flex: 1;">${parcela.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\u00A0/g, '')}</span>
            <input type="checkbox" ${parcela.status ? 'checked' : ''}
                onclick="event.stopPropagation()"
                onchange="event.stopPropagation(); atualizarStatusParcela(${parcela.id}, this.checked, this)"
                style="width: 17px; height: 17px; accent-color: #6366f1; cursor: pointer; flex-shrink: 0;">
        </div>
            `;
        }).join('');

        return `
            <div class="card-flip-wrapper" style="width: 260px; height: 360px; flex-shrink: 0; perspective: 1000px; cursor: pointer;"
                onclick="flipCard(this)">
                <div class="card-inner-flip" style="position: relative; width: 100%; height: 100%; transition: transform 0.90s ease; transform-style: preserve-3d;">

                    <!-- FRENTE -->
                    <div class="card-conta-edit" style="position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; box-sizing: border-box; margin: 0; cursor: pointer;">
                        <div class="card-header-credor">
                            <span class="nome-credor">${conta.credor}</span>
                            <div class="valor-total-restante">${valorFormatado}</div>
                        </div>
                        <div class="card-body">
                            <span class="label-card">Descrição</span>
                            <p class="desc-card">${conta.descricao}</p>
                        </div>
                        <div class="card-footer-parcelas">
                            <span class="label-card">Parcelas</span>
                            <div class="progresso-container">
                                <div class="progresso-barra" style="width: ${porcentagem}%"></div>
                            </div>
                            <div class="progresso-texto">${pagas}/${total}</div>
                        </div>
                    </div>

                    <!-- VERSO -->
                    <div style="position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; transform: rotateY(180deg);
                        background: white; border-radius: 12px; padding: 18px 16px 14px 16px;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;
                        box-sizing: border-box; display: flex; flex-direction: column;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-shrink: 0;">
                            <span style="font-size: 13px; font-weight: 700; color: #6366f1;">Parcelas</span>
                            <span class="badge-pagas" style="font-size: 11px; color: #6366f1; background: #eef2ff; padding: 2px 8px; border-radius: 20px; font-weight: 600;">${pagas}/${total} pagas</span>
                        </div>
                        <div class="parcelas-verso-scroll">
                            ${parcelasHTML}
                        </div>
                    </div>

                </div>
            </div>
        `;
    }).join('');

    areaGrafico.style.justifyContent = 'flex-start';

    areaGrafico.innerHTML = `
        <style>
            .card-inner-flip.flipped { transform: rotateY(180deg); }

            .parcelas-verso-scroll {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                scrollbar-width: thin;
                scrollbar-color: #6366f1 transparent;
            }
            .parcelas-verso-scroll::-webkit-scrollbar { width: 4px; }
            .parcelas-verso-scroll::-webkit-scrollbar-track { background: transparent; }
            .parcelas-verso-scroll::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 4px; }
            .parcelas-verso-scroll::-webkit-scrollbar-button { display: none; height: 0; width: 0; }
        </style>

        <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
            <div class="financas-container" style="margin-top: 50px !important; display: flex; flex-direction: row !important; gap: 40px; justify-content: center; align-items: center; width: 100%;">
                <div class="mini-grafico-lateral">${criarCirculo(200, 85, percEntregas, "Ganhos com entregas", totalEntregas, `${percEntregas}%`, true)}</div>
                <div class="grafico-principal-foco">${criarCirculo(300, 130, percPrincipal, "Ganhos do mês", ganhosAtuaisVisual, `Meta: R$${metaDoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, false)}</div>
                <div class="mini-grafico-lateral">${criarCirculo(200, 85, percServicos, "Ganhos com serviços", totalServicos, `${percServicos}%`, true)}</div>
            </div>

            <div style="width: 100%; margin: 50px 0 0 0; padding: 0 40px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
                    <div style="width: 4px; height: 20px; background-color: #6366f1; border-radius: 2px;"></div>
                    <h3 style="font-size: 16px; font-weight: 600; color: #475569; margin: 0;">Relatório de entregas</h3>
                </div>
                <div style="display: flex; flex-direction: row; gap: 24px; justify-content: flex-start; align-items: center;">
                    ${circulosOrigem}
                </div>
            </div>

            <div style="width: 100%; margin: 50px 0 40px 0; padding: 0 40px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
                    <div style="width: 4px; height: 20px; background-color: #6366f1; border-radius: 2px;"></div>
                    <h3 style="font-size: 16px; font-weight: 600; color: #475569; margin: 0;">Relatório de dívidas</h3>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 16px;">
                    ${cardsContas || '<p style="color: #64748b; font-size: 15px;">Nenhuma dívida encontrada.</p>'}
                </div>
            </div>
        </div>
    `;
}

function flipCard(wrapper) {
    const inner = wrapper.querySelector('.card-inner-flip');
    const jaEstaVirado = inner.classList.contains('flipped');

    // Fecha todos os outros cards
    document.querySelectorAll('.card-flip-wrapper .card-inner-flip.flipped').forEach(el => {
        el.classList.remove('flipped');
    });

    if (!jaEstaVirado) {
        inner.classList.add('flipped');
    } else {
        // Voltando para a frente: recalcula estado atual dos checkboxes do verso
        const checkboxes = wrapper.querySelectorAll('.parcelas-verso-scroll input[type="checkbox"]');
        const total = checkboxes.length;
        const pagas = [...checkboxes].filter(cb => cb.checked).length;
        const porcentagem = total > 0 ? (pagas / total) * 100 : 0;

        // Atualiza barra de progresso na frente
        const barra = wrapper.querySelector('.progresso-barra');
        if (barra) barra.style.width = `${porcentagem}%`;

        // Atualiza texto "x/y" na frente
        const textoProgresso = wrapper.querySelector('.progresso-texto');
        if (textoProgresso) textoProgresso.textContent = `${pagas}/${total}`;

        // Atualiza badge "x/y pagas" no verso
        const badge = wrapper.querySelector('.badge-pagas');
        if (badge) badge.textContent = `${pagas}/${total} pagas`;
    }
}

async function atualizarStatusParcela(parcelaId, novoStatus, checkboxEl) {
    // Atualiza a frente do card imediatamente, sem esperar o Supabase
    const wrapper = checkboxEl.closest('.card-flip-wrapper');
    const checkboxes = wrapper.querySelectorAll('.parcelas-verso-scroll input[type="checkbox"]');
    const total = checkboxes.length;
    const pagas = [...checkboxes].filter(cb => cb.checked).length;
    const porcentagem = total > 0 ? (pagas / total) * 100 : 0;

    const barra = wrapper.querySelector('.progresso-barra');
    if (barra) barra.style.width = `${porcentagem}%`;

    const textoProgresso = wrapper.querySelector('.progresso-texto');
    if (textoProgresso) textoProgresso.textContent = `${pagas}/${total}`;

    const badge = wrapper.querySelector('.badge-pagas');
    if (badge) badge.textContent = `${pagas}/${total} pagas`;

    // Aí sim chama o Supabase em background
    const { error } = await _supabase
        .from('contas_parcelas')
        .update({ status: novoStatus })
        .eq('id', parcelaId);

    if (error) {
        mostrarNotificacao("Erro ao atualizar parcela", "erro");
        // Reverte o checkbox visualmente se falhou
        checkboxEl.checked = !novoStatus;
    }
}

async function renderizarServicos() {
    const mainContent = document.getElementById('main-content');
    
    const dataHoje = new Date();
    const mesAtual = (dataHoje.getMonth() + 1).toString().padStart(2, '0');
    const anoAtual = dataHoje.getFullYear();

    mainContent.innerHTML = `
        <div class="servicos-page-wrapper" style="display: flex; flex-direction: column; width: 100%; align-items: center;">

            <div class="filtros-container" style="margin-bottom: 20px; position: relative; z-index: 10; display: flex; gap: 12px; width: fit-content;">
                <div class="filtro-item">
                    <label>Mês</label>
                    <select id="filtro-mes-servicos" onchange="buscarEServicosFiltrados()">
                        <option value="01" ${mesAtual === '01' ? 'selected' : ''}>Janeiro</option>
                        <option value="02" ${mesAtual === '02' ? 'selected' : ''}>Fevereiro</option>
                        <option value="03" ${mesAtual === '03' ? 'selected' : ''}>Março</option>
                        <option value="04" ${mesAtual === '04' ? 'selected' : ''}>Abril</option>
                        <option value="05" ${mesAtual === '05' ? 'selected' : ''}>Maio</option>
                        <option value="06" ${mesAtual === '06' ? 'selected' : ''}>Junho</option>
                        <option value="07" ${mesAtual === '07' ? 'selected' : ''}>Julho</option>
                        <option value="08" ${mesAtual === '08' ? 'selected' : ''}>Agosto</option>
                        <option value="09" ${mesAtual === '09' ? 'selected' : ''}>Setembro</option>
                        <option value="10" ${mesAtual === '10' ? 'selected' : ''}>Outubro</option>
                        <option value="11" ${mesAtual === '11' ? 'selected' : ''}>Novembro</option>
                        <option value="12" ${mesAtual === '12' ? 'selected' : ''}>Dezembro</option>
                    </select>
                </div>
                <div class="filtro-item">
                    <label>Ano</label>
                    <select id="filtro-ano-servicos" onchange="buscarEServicosFiltrados()">
                        <option value="2026" ${anoAtual === 2026 ? 'selected' : ''}>2026</option>
                        <option value="2027" ${anoAtual === 2027 ? 'selected' : ''}>2027</option>
                        <option value="2028" ${anoAtual === 2028 ? 'selected' : ''}>2028</option>
                        <option value="2029" ${anoAtual === 2029 ? 'selected' : ''}>2029</option>
                        <option value="2030" ${anoAtual === 2030 ? 'selected' : ''}>2030</option>
                    </select>
                </div>
            </div>

            <div id="container-dinamico-servicos" style="width: 100%; min-height: calc(100vh - 180px); display: flex; flex-direction: column; align-items: center; justify-content: flex-start; position: relative;">
                
                <div id="header-servicos" style="width: 100%; margin: 20px 0 0 0; padding: 0 40px; display: none;">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
                        <div style="width: 4px; height: 20px; background-color: #6366f1; border-radius: 2px;"></div>
                        <h3 style="font-size: 16px; font-weight: 600; color: #475569; margin: 0;">Histórico de serviços</h3>
                    </div>
                </div>

                <div id="lista-servicos-cards" style="width: 100%; padding: 0 40px; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;"></div>

                <div id="loading-overlay-servicos" style="position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); display: none; justify-content: center; align-items: center;">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>
    `;

    await buscarEServicosFiltrados();
}

async function buscarEServicosFiltrados() {
    const mes = document.getElementById('filtro-mes-servicos').value;
    const ano = document.getElementById('filtro-ano-servicos').value;
    const listaCards = document.getElementById('lista-servicos-cards');
    const loader = document.getElementById('loading-overlay-servicos');
    const header = document.getElementById('header-servicos');

    // 1. Reset inicial: limpa tudo e esconde o título enquanto busca
    listaCards.innerHTML = '';
    header.style.display = 'none'; 
    loader.style.display = 'flex';

    try {
        const dataInicio = `${ano}-${mes}-01T00:00:00Z`;
        let proximoMes = parseInt(mes) + 1;
        let proximoAno = parseInt(ano);
        if (proximoMes > 12) { proximoMes = 1; proximoAno++; }
        const dataFim = `${proximoAno}-${String(proximoMes).padStart(2, '0')}-01T00:00:00Z`;

        const { data, error } = await _supabase
            .from('servicos')
            .select('*')
            .gte('data', dataInicio)
            .lt('data', dataFim)
            .order('data', { ascending: false });

        if (error) throw error;
        
        // 2. A busca terminou, então paramos o spinner
        loader.style.display = 'none';

        // 3. AGORA O PULO DO GATO: Mostramos o título ANTES de checar se está vazio
        header.style.display = 'block';

        // 4. Se não houver dados, a mensagem aparece abaixo do título já visível
        if (!data || data.length === 0) {
            listaCards.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; margin-top: 20px;">
                    <p style="color: #64748b; font-size: 15px;">Nenhum serviço encontrado.</p>
                </div>
            `;
            return;
        }

        // 5. Se houver dados, renderiza os cards normalmente
        data.forEach(servico => {
            const imgNome = servico.categoria ? servico.categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "outros";
            
            let dataCustomizada = "Data pendente";
            if (servico.data) {
                const dateObj = new Date(servico.data);
                if (!isNaN(dateObj)) {
                    const dia = String(dateObj.getUTCDate()).padStart(2, '0');
                    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                    const mesAbrev = meses[dateObj.getUTCMonth()];
                    dataCustomizada = `${dia} ${mesAbrev} ${dateObj.getUTCFullYear()}`;
                }
            }

            const lucro = (servico.valor || 0) - (servico.gasto || 0);
            const valorFormatado = lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\s/g, '');
            const categoriaRaw = servico.categoria || "Geral";
            const categoriaFormatada = categoriaRaw.charAt(0).toUpperCase() + categoriaRaw.slice(1).toLowerCase();

            listaCards.innerHTML += `
                <div class="card-servico" style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); height: 100%;">
                    <div style="padding: 12px 20px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; border-bottom: 1px solid #e2e8f0;">
                        <div style="display: flex; gap: 6px; justify-content: flex-start;">
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: #6366f1;"></div>
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: #64748b;"></div>
                            <div style="width: 10px; height: 10px; border-radius: 50%; background: #94a3b8;"></div>
                        </div>
                        <span style="font-weight: 700; color: #6366f1; font-size: 17px; text-align: center;">${categoriaFormatada}</span>
                        <div style="display: flex; justify-content: flex-end;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: #6366f1; display: flex; align-items: center; justify-content: center;">
                                <img src="imagens/servicos/${imgNome}.png" style="width: 18px; height: 18px; filter: brightness(0) invert(1);" alt="ícone">
                            </div>
                        </div>
                    </div>
                    <div style="height: 130px; padding: 10px 25px; display: flex; align-items: center; justify-content: center; text-align: center; border-bottom: 1px solid #e2e8f0;">
                        <p style="color: #94a3b8; font-size: 15px; font-weight: 500; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;">
                            ${servico.descricao || 'Sem descrição'}
                        </p>
                    </div>
                    <div style="display: flex; align-items: stretch; height: 50px; font-family: 'Inter', system-ui, -apple-system, sans-serif;">
                        <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #475569; font-size: 16px; font-weight: 500; border-right: 1px solid #e2e8f0;">
                            ${dataCustomizada}
                        </div>
                        <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #6366f1; font-weight: 900; font-size: 17px;">
                            ${valorFormatado}
                        </div>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        console.error(err);
        loader.style.display = 'none';
    }
}

async function renderizarDashboard(dataInicioForcada = null) {
    const meuIdNavegacao = navegacaoAtualId; 
    
    const mainContent = document.getElementById('main-content');
    mainContent.className = 'content-dashboard';
    
    mainContent.innerHTML = `
        <div id="container-dinamico-dashboard" style="
            width: 100%;
            min-height: calc(100vh - 100px); 
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        ">
            <div id="loading-overlay" style="display: flex; justify-content: center; align-items: center;">
                <div class="spinner"></div>
            </div>
        </div>
    `;

    // --- LÓGICA DE DATAS CORRIGIDA (Erro 3) ---
    const hoje = new Date();
    let referenciaCalendario = hoje;
    if (dataInicioForcada) {
        referenciaCalendario = new Date(dataInicioForcada);
    }

    const domingo = new Date(referenciaCalendario);
    domingo.setHours(0, 0, 0, 0);
    const diaSemana = referenciaCalendario.getDay(); // 0=Dom, 1=Seg...
    const diasAtéSegunda = (diaSemana === 0 ? 6 : diaSemana - 1); // Dom vira 6, Seg vira 0, etc.
    domingo.setDate(referenciaCalendario.getDate() - diasAtéSegunda);

    const mesesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const diasSemana = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

    let htmlCalendario = `<div class="calendario-dashboard-compacto" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; padding: 0; background: transparent;">`;     
    diasSemana.forEach(dia => { htmlCalendario += `<div class="dia-semana-card">${dia}</div>`; });
    
    for (let i = 0; i < 7; i++) {
        const diaAtual = new Date(domingo);
        diaAtual.setDate(domingo.getDate() + i);
        const diaNum = diaAtual.getDate();
        const mesNome = mesesAbrev[diaAtual.getMonth()].toLowerCase();
        const diaFormatado = diaNum < 10 ? `0${diaNum}` : diaNum;
        const dataExibicao = `${diaFormatado}/${mesNome}`;
        const y = diaAtual.getFullYear();
        const m = String(diaAtual.getMonth() + 1).padStart(2, '0');
        const d = String(diaAtual.getDate()).padStart(2, '0');
        const dataISO = `${y}-${m}-${d}`;
        const ehHoje = diaAtual.toDateString() === hoje.toDateString();
        const estiloHoje = ehHoje ? 'style="border: 1px solid #6366f1;"' : '';
        htmlCalendario += `
            <div class="dia-mes-card" ${estiloHoje} data-data="${dataISO}">
                <span class="data-texto">${dataExibicao}</span>
                <div class="divisor-card"></div>
                <span class="qtd-entregas" style="color: #64748b;">0</span>
            </div>`;
    }
htmlCalendario += `</div>`;

const domingosUltimasSemanas = gerarDatasSemanas(); // ← primeiro gera
const domingoSelecionado = new Date(domingo);        // ← depois usa
domingoSelecionado.setHours(0, 0, 0, 0);

let htmlItensMenu = '';
domingosUltimasSemanas.forEach(dom => {
    const domNorm = new Date(dom);
    domNorm.setHours(0, 0, 0, 0);
    const ativo = domNorm.getTime() === domingoSelecionado.getTime();

    htmlItensMenu += `
        <div class="item-filtro-semana" 
            style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: ${ativo ? '#6366f1' : '#475569'}; font-weight: ${ativo ? '700' : '400'}; text-align: center; transition: background 0.15s, color 0.15s;"
            onmouseenter="this.style.background='#f1f5f9'; this.style.color='#6366f1';"
            onmouseleave="this.style.background='transparent'; this.style.color='${ativo ? '#6366f1' : '#475569'}';"
            onclick="renderizarDashboard(new Date('${dom.toISOString()}'))">
            ${formatarLabelSemana(dom)}
        </div>`;
});

    // --- BUSCA DE DADOS ASSÍNCRONA ---
    const mesReferenciaString = String(hoje.getMonth() + 1).padStart(2, '0');
    const anoReferencia = hoje.getFullYear();
    const dataReferenciaView = `${anoReferencia}-${mesReferenciaString}-01`;
    const ultimoDiaMes = new Date(anoReferencia, hoje.getMonth() + 1, 0).getDate();
    const dataInicioBusca = `${anoReferencia}-${mesReferenciaString}-01`;
    const dataFimBusca = `${anoReferencia}-${mesReferenciaString}-${ultimoDiaMes}T23:59:59`;


    const [resValor, resContagem, resEntregas, resServicos] = await Promise.all([
        _supabase.from('resumo_entregas_mensais').select('origem, total_valor').eq('mes_referencia', dataReferenciaView),
        _supabase.from('resumo_entregas_contagem').select('origem, total_entregas').eq('mes_referencia', dataReferenciaView),
        _supabase.from('resumo_entregas_mensais').select('total_valor').eq('mes_referencia', dataReferenciaView),
        _supabase.from('servicos').select('valor, gasto').gte('data', dataInicioBusca).lte('data', dataFimBusca)
    ]);

    // --- TRAVA DE SEGURANÇA (Erro 2: Race Condition) ---
    // Verificação logo após o await para impedir renderização em aba errada
    if (meuIdNavegacao !== navegacaoAtualId) return;

    const valorPorOrigem = resValor.data;
    const contagemPorOrigem = resContagem.data;
    const dataEntregas = resEntregas.data;
    const dataServicos = resServicos.data;

    // --- CÁLCULOS ---
    const totalEntregas = dataEntregas?.reduce((acc, item) => acc + (item.total_valor || 0), 0) || 0;
    const totalServicos = dataServicos?.reduce((acc, item) => acc + ((item.valor || 0) - (item.gasto || 0)), 0) || 0;
    const ganhosAtuaisVisual = totalEntregas + totalServicos;
    
    // Fallback para metaDoMes caso não esteja definida (Erro 4)
    const metaValor = typeof metaDoMes !== 'undefined' ? metaDoMes : 5000;
    const percPrincipal = Math.min((ganhosAtuaisVisual / metaValor) * 100, 100);

    const origens = ['Açaiteria', 'Aplicativos', 'Unter Tech'];
    const dadosOrigem = origens.map(origem => {
        const valorItem = valorPorOrigem?.find(i => i.origem === origem);
        const contItem = contagemPorOrigem?.find(i => i.origem === origem);
        return { origem, valor: valorItem?.total_valor || 0, quantidade: contItem?.total_entregas || 0 };
    });
    const totalValorOrigens = dadosOrigem.reduce((acc, i) => acc + i.valor, 0);

    // --- HELPER DE GRÁFICOS ---
    const criarCirculoDash = (tamanho, raio, percentual, titulo, valorBruto, textoInferior, strokeSize = 14, fonteValor = '17px', fonteTitulo = '11px', fonteInferior = '12px') => {
        const circ = 2 * Math.PI * raio;
        const off = circ - (percentual / 100) * circ;
        const valorFormatado = `R$${valorBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        return `
            <div class="progress-circle" style="width: ${tamanho}px; height: ${tamanho}px; display: flex; align-items: center; justify-content: center; position: relative;">
                <svg width="${tamanho}" height="${tamanho}" style="transform: rotate(-90deg); position: absolute;">
                    <circle class="circle-bg" cx="${tamanho/2}" cy="${tamanho/2}" r="${raio}" style="stroke-width: ${strokeSize}; fill: none;"></circle>
                    <circle class="circle-progress" cx="${tamanho/2}" cy="${tamanho/2}" r="${raio}" style="stroke-dasharray: ${circ}; stroke-dashoffset: ${off}; stroke-width: ${strokeSize}; fill: none; stroke-linecap: round; transition: stroke-dashoffset 0.5s ease;"></circle>
                </svg>
                <div class="circle-center" style="display: flex; flex-direction: column; align-items: center; text-align: center; z-index: 2;">
                    <span class="label-ganhos" style="color: #64748b; font-size: ${fonteTitulo};">${titulo}</span>
                    <span class="valor-atual" style="font-weight: bold; color: #6366f1; margin: 2px 0; font-size: ${fonteValor};">${valorFormatado}</span>
                    <span class="meta-info" style="color: #94a3b8; font-weight: 500; font-size: ${fonteInferior};">${textoInferior}</span>
                </div>
            </div>`;
    };

    const circuloGanhos = criarCirculoDash(250, 105, percPrincipal, "Ganhos do mês", ganhosAtuaisVisual, `Meta: R$${metaValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 22, '30px', '15px', '12px');
    const circulosOrigemDash = dadosOrigem.map(item => {
        const perc = totalValorOrigens > 0 ? Math.round((item.valor / totalValorOrigens) * 100) : 0;
        return `<div class="mini-grafico-lateral">${criarCirculoDash(180, 75, perc, item.origem, item.valor, `${item.quantidade} entregas`, 16, '20px', '12px', '14px')}</div>`;
    }).join('');

    // --- RENDERIZAÇÃO FINAL ---
    mainContent.innerHTML = `
        <div id="dashboard-page" style="width: 100%;">
            <div style="display: flex; flex-direction: row; align-items: flex-start; gap: 60px;">
                <div style="display: inline-flex; flex-direction: column; position: relative;">
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 4px; height: 20px; background-color: #6366f1; border-radius: 2px;"></div>
                            <h3 style="font-size: 16px; font-weight: 600; color: #475569; margin: 0;">Entregas Açaiteria</h3>
                        </div>
                    </div>
                    <div id="btn-periodo" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 34px; background-color: #6366f1; border-radius: 15px 15px 0 0; margin-bottom: 10px; padding: 0 16px; box-sizing: border-box; color: white; gap: 10px; cursor: pointer;">
                        <span style="font-size: 15px; font-weight: bold; letter-spacing: 0.3px; line-height: 1;">Período</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                    <div id="menu-semanas" style="display: none; position: absolute; top: 74px; left: 50%; transform: translateX(-50%); background: white; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 100; width: 150px; box-sizing: border-box;">
                        ${htmlItensMenu}
                    </div>
                    <div style="display: flex; flex-direction: row; align-items: flex-start; justify-content: flex-start; gap: 10px; padding: 0;">
                        <div class="layout-entregas" style="margin: 0; width: auto; padding: 0;">${htmlCalendario}</div>
                        <div class="card-entregas-total" style="margin: 0; height: 106px; display: flex; flex-direction: column;">
                            <div class="card-entregas-total-header" style="flex: 0.54; display: flex; align-items: center; justify-content: center; font-size: 14px;">Total</div>
                            <div class="card-entregas-total-quant" id="soma-semanal-valor" style="flex: 1.46; display: flex; align-items: center; justify-content: center; margin: 0; font-size: 1.6rem;">0</div>
                        </div>
                    </div>
                    <div style="margin-top: 32px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 4px; height: 20px; background-color: #6366f1; border-radius: 2px;"></div>
                            <h3 style="font-size: 16px; font-weight: 600; color: #475569; margin: 0;">Ganhos mensais</h3>
                        </div>
                    </div>
                    <div style="display: flex; align-items: stretch; width: 100%; max-width: 585px; height: 280px; padding: 30px 20px 20px 12px; background: transparent; box-sizing: border-box; border-radius: 12px; border: 1px solid #6366f1;">
                        <div id="grafico-y-axis" style="display: flex; flex-direction: column; justify-content: space-between; padding-right: 10px; padding-bottom: 28px; color: #64748b; font-size: 11px; text-align: right; border-right: 2px solid #e2e8f0; font-weight: 600; flex-shrink: 0; white-space: nowrap;">
                            <span>4000</span>
                            <span>3000</span>
                            <span>2000</span>
                            <span>1000</span>
                            <span>0</span>
                        </div>
                        <div style="position: relative; flex: 1; display: flex; flex-direction: column;">
                            <div id="grafico-visual" style="position: relative; flex: 1; overflow: visible;">
                                <div style="position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; z-index: 1;">
                                    <div style="width: 100%; height: 1px; background-color: #e2e8f0;"></div>
                                    <div style="width: 100%; height: 1px; background-color: #e2e8f0;"></div>
                                    <div style="width: 100%; height: 1px; background-color: #e2e8f0;"></div>
                                    <div style="width: 100%; height: 1px; background-color: #e2e8f0;"></div>
                                    <div style="width: 100%; height: 1px; background-color: #e2e8f0;"></div>
                                </div>
                                <div id="grafico-bars" style="position: absolute; inset: 0; display: flex; justify-content: space-around; align-items: flex-end; z-index: 2; overflow: visible;">
                                    <span style="color: #6366f1; font-size: 12px; padding: 8px;">Carregando...</span>
                                </div>
                            </div>
                            <div id="grafico-labels" style="display: flex; justify-content: space-around; height: 28px; align-items: center; padding: 0 2px;"></div>
                        </div>
                    </div>
                </div>
                <div style="display: inline-flex; flex-direction: column;">
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 4px; height: 20px; background-color: #6366f1; border-radius: 2px;"></div>
                            <h3 style="font-size: 16px; font-weight: 600; color: #475569; margin: 0;">${hoje.toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}</h3>
                        </div>
                    </div>
                    ${circuloGanhos}
                    <div style="margin-top: 25px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px;">
                            <div style="width: 4px; height: 20px; background-color: #6366f1; border-radius: 2px;"></div>
                            <h3 style="font-size: 16px; font-weight: 600; color: #475569; margin: 0;">Relatório de entregas</h3>
                        </div>
                        <div style="display: flex; flex-direction: row; gap: 12px; justify-content: flex-start; align-items: center;">
                            ${circulosOrigemDash}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- EVENTOS CORRIGIDOS (Erro 1) ---
    const btnPeriodo = document.getElementById('btn-periodo');
    const menuSemanas = document.getElementById('menu-semanas');

    const fecharMenu = function() { 
        if(menuSemanas) menuSemanas.style.display = 'none'; 
    };

    btnPeriodo.addEventListener('click', function(e) {
        e.stopPropagation();
        if (menuSemanas.style.display === 'none') {
            menuSemanas.style.display = 'block';
            // Usa { once: true } para limpar o listener automaticamente após o clique
            document.addEventListener('click', fecharMenu, { once: true });
        } else {
            menuSemanas.style.display = 'none';
        }
    });

    // Popula o calendário semanal
    buscarDadosDashboardSemanal(domingo);

    // Renderiza o gráfico trimestral
    renderizarGraficoTrimestral();
}

async function buscarGanhosTotaisDoMes(mes, ano) {
    // Captura o ID de navegação no início da execução assíncrona
    const meuIdNavegacaoBusca = navegacaoAtualId;

    const mesNum = parseInt(mes) - 1;
    const anoNum = parseInt(ano);
    const ultimoDia = new Date(anoNum, mesNum + 1, 0).getDate();
    const mesFormatado = String(mesNum + 1).padStart(2, '0');

    const dataInicio = `${anoNum}-${mesFormatado}-01`;
    const dataFim = `${anoNum}-${mesFormatado}-${ultimoDia}T23:59:59`;
    const dataReferenciaView = `${anoNum}-${mesFormatado}-01`;

    // Executa as buscas simultaneamente para performance
    const [resEntregas, resServicos] = await Promise.all([
        _supabase.from('resumo_entregas_mensais').select('total_valor').eq('mes_referencia', dataReferenciaView),
        _supabase.from('servicos').select('valor, gasto').gte('data', dataInicio).lte('data', dataFim)
    ]);

    // PROTEÇÃO RACE CONDITION: Se o usuário mudou de aba enquanto o Supabase respondia, para aqui.
    if (meuIdNavegacaoBusca !== navegacaoAtualId) return 0;

    const totalEntregas = resEntregas.data?.reduce((acc, item) => acc + (item.total_valor || 0), 0) || 0;
    const totalServicos = resServicos.data?.reduce((acc, item) => acc + ((item.valor || 0) - (item.gasto || 0)), 0) || 0;

    return totalEntregas + totalServicos;
}

async function renderizarGraficoTrimestral() {
    const barsContainer = document.getElementById('grafico-bars');
    const labelsContainer = document.getElementById('grafico-labels');
    const chartVisual = document.getElementById('grafico-visual');

    if (!barsContainer || !labelsContainer || !chartVisual) return;

    const META_MAXIMA = 4000;

    const mesesParaBuscar = [];
    for (let i = 2; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        mesesParaBuscar.push({
            mes: String(d.getMonth() + 1).padStart(2, '0'),
            ano: d.getFullYear(),
            nome: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
        });
    }

    barsContainer.innerHTML = '<span style="color: #6366f1; font-size: 12px; padding: 8px;">Carregando...</span>';
    labelsContainer.innerHTML = '';

    const resultados = await Promise.all(
        mesesParaBuscar.map(item => buscarGanhosTotaisDoMes(item.mes, item.ano))
    );

    const alturaZona = chartVisual.clientHeight;

    barsContainer.innerHTML = '';
    labelsContainer.innerHTML = '';

    resultados.forEach((totalGanhos, index) => {
        const item = mesesParaBuscar[index];
        const proporcao = Math.min(totalGanhos / META_MAXIMA, 1);
        const alturaPx = Math.round(proporcao * alturaZona);

        const valorFormatado = totalGanhos.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).replace(/R\$\s/, 'R$');

        // Grupo da barra
        const group = document.createElement('div');
        group.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 60px; height: 100%; justify-content: flex-end; overflow: visible;';

        const col = document.createElement('div');
        col.style.cssText = `width: 80px; background-color: #6366f1; border-radius: 4px 4px 0 0; transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1); min-height: 2px; position: relative; height: 0px;`;

        const valueSpan = document.createElement('span');
        valueSpan.style.cssText = 'font-size: 11px; font-weight: bold; color: #6366f1; white-space: nowrap; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 4px;';
        valueSpan.textContent = valorFormatado;

        col.appendChild(valueSpan);
        group.appendChild(col);
        barsContainer.appendChild(group);

        // Anima após um frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                col.style.height = alturaPx + 'px';
            });
        });

        // Label do mês
        const label = document.createElement('span');
        label.style.cssText = 'font-size: 12px; color: #64748b; text-transform: capitalize; font-weight: 500; width: 60px; text-align: center;';
        label.textContent = item.nome;
        labelsContainer.appendChild(label);
    });
}

// ─── Calendário semanal ──────────────────────────────────────────────────────

async function buscarDadosDashboardSemanal(dataInicioSemana) {
    const dataFimSemana = new Date(dataInicioSemana);
    dataFimSemana.setDate(dataInicioSemana.getDate() + 6);
    
    const formatarLocal = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const inicio = formatarLocal(dataInicioSemana);
    const fim = formatarLocal(dataFimSemana);

    const { data, error } = await _supabase
        .from('entregas') 
        .select('data, quantidade')
        .eq('origem', 'Açaiteria')
        .gte('data', inicio)
        .lte('data', fim);

    if (!error && data) {
        const totaisPorDia = {};
        let somaTotalSemana = 0; 

        data.forEach(entrega => {
            const dataPura = entrega.data.split('T')[0];
            const qtd = (entrega.quantidade || 0);
            totaisPorDia[dataPura] = (totaisPorDia[dataPura] || 0) + qtd;
            somaTotalSemana += qtd; 
        });

        const elementoSoma = document.getElementById('soma-semanal-valor');
        if (elementoSoma) {
            elementoSoma.innerText = somaTotalSemana;
            elementoSoma.style.color = somaTotalSemana > 0 ? '#6366f1' : '#64748b';
        }

        const cards = document.querySelectorAll('.dia-mes-card');
        cards.forEach(card => {
            const dataISO = card.getAttribute('data-data');
            const spanQtd = card.querySelector('.qtd-entregas');
            
            if (totaisPorDia[dataISO]) {
                spanQtd.innerText = totaisPorDia[dataISO];
                spanQtd.style.color = '#6366f1'; 
            } else {
                spanQtd.innerText = '0';
                spanQtd.style.color = '#64748b';
            }
        });
    }
}

function gerarDatasSemanas() {
    const semanas = [];
    const hoje = new Date();
    
    // Acha a segunda-feira da semana atual
    const dw = hoje.getDay();
    let segundaReferencia = new Date(hoje);
    segundaReferencia.setDate(hoje.getDate() - (dw === 0 ? 6 : dw - 1));

    for (let i = 0; i < 5; i++) {
        const seg = new Date(segundaReferencia);
        seg.setDate(segundaReferencia.getDate() - (i * 7));
        semanas.push(seg);
    }
    return semanas;
}

function formatarLabelSemana(segundaInicio) {
    const mesesAbrev = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    
    const domingoFim = new Date(segundaInicio);
    domingoFim.setDate(segundaInicio.getDate() + 6); // +6 chega no domingo

    const d1 = String(segundaInicio.getDate()).padStart(2, '0');
    const m1 = mesesAbrev[segundaInicio.getMonth()];
    
    const d2 = String(domingoFim.getDate()).padStart(2, '0');
    const m2 = mesesAbrev[domingoFim.getMonth()];

    return `${d1} ${m1} - ${d2} ${m2}`;
}

function renderizarHome() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: calc(100vh - 100px); text-align: center;">
            
            <div style="margin-bottom: 25px;">
                <img src="imagens/logohome.png" alt="Logo" style="width: 110px; height: 110px; object-fit: contain;">
            </div>

            <h1 style="color: #6366f1; font-size: 2.5rem; font-weight: 800; margin-bottom: 5px;">
                Sistema Financeiro
            </h1>
            <h3 style="color: #64748b; font-size: 1.2rem; font-weight: 500; margin-bottom: 40px;">
                Navegue pelo menu lateral ou utilize os atalhos abaixo:
            </h3>

            <!-- Container dos Botões -->
            <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
                
                <div class="card-atalho" onclick="navegar('entregas')" style="cursor: pointer;">
                    <div class="atalho-icon-wrapper">
                        <img src="imagens/menu/entregas.png" alt="Entregas">
                    </div>
                </div>

                <div class="card-atalho" onclick="navegar('servicos')" style="cursor: pointer;">
                    <div class="atalho-icon-wrapper">
                        <img src="imagens/menu/servicos.png" alt="Serviços">
                    </div>
                </div>

                <div class="card-atalho" onclick="navegar('financas')" style="cursor: pointer;">
                    <div class="atalho-icon-wrapper">
                        <img src="imagens/menu/financas.png" alt="Finanças">
                    </div>
                </div>

            </div>
        </div>

        <style>
            .card-atalho {
                background: transparent;
                border: 1px solid #dbe1e7ff;
                border-radius: 16px;
                padding: 17px; 
                width: 100px;
                display: flex;
                flex-direction: column;
                align-items: center;
                transition: all 0.3s ease;
            }

            /* Quando o mouse passar: Fundo fica roxo sólido */
            .card-atalho:hover {
                transform: translateY(-5px);
                background-color: #6366f1; 
                box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
            }

            .atalho-icon-wrapper {
                width: 60px;
                height: 60px;
                background-color: transparent;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .card-atalho img {
                width: 40px;
                height: 40px;
                object-fit: contain;
                transition: all 0.3s ease;
            }

            /* Quando o mouse passar: Imagem muda de roxo para branco */
            .card-atalho:hover img {
                filter: brightness(0) invert(1);
            }
        </style>
    `;
}
// Inicia o sistema na página Home por padrão
document.addEventListener('DOMContentLoaded', () => {
    navegar('home');
});