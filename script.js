//  Configurações principais //
const API_URL = "http://localhost:3000";
const SENHA_ADMIN = "Senha@123";
const INTERVALO_MINUTOS = 120;

//  Seleção de elementos do HTML //
const btnAgendar = document.getElementById('btn-agendar');
const listaHorarios = document.getElementById('lista-horarios');
const abrirAdmin = document.getElementById('abrirAdmin');
const modalAdmin = document.getElementById('modalAdmin');
const fecharModal = document.getElementById('fecharModal');
const btnLoginAdmin = document.getElementById('btnLoginAdmin');
const msgErro = document.getElementById('msgErro');
const mainCliente = document.getElementById('mainCliente');
const mainAdmin = document.getElementById('mainAdmin');
const tabelaBody = document.getElementById('tabelaAgendamentos');
const btnSairAdmin = document.getElementById('btnSairAdmin');

let chartDia = null;
let chartMes = null;

//  Funções de utilidade //
function horaParaMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function atualizarLista() {
  const agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
  listaHorarios.innerHTML = agendamentos.length
    ? agendamentos.map(a =>
        `<li>${a.data} - ${a.hora} | ${a.nome} | ${a.servico} ${a.atendido ? "(Atendido)" : ""}</li>`
      ).join('')
    : '<li>Nenhum horário agendado.</li>';
}

function limparFormulario(id) {
  document.getElementById(id).reset();
}

//  Comunicação com o servidor backend //
async function carregarAgendamentosDaPlanilha() {
  try {
    const resposta = await fetch(`${API_URL}/agendamentos`);
    if (!resposta.ok) throw new Error("Erro ao buscar dados do servidor");

    const agendamentos = await resposta.json();
    localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
  } catch (erro) {
    console.error("Erro ao carregar agendamentos:", erro);
    alert("Erro ao carregar agendamentos: " + erro.message);
  }
}

//  Envia novo agendamento para o backend //
btnAgendar.addEventListener('click', async () => {
  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const data = document.getElementById('data').value;
  const hora = document.getElementById('hora').value;
  const servico = document.getElementById('servico').value;

  if (!nome || !telefone || !data || !hora || !servico) {
    alert("Preencha todos os campos!");
    return;
  }

  const dados = { nome, telefone, data, hora, servico };

  try {
    const resposta = await fetch(`${API_URL}/agendamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });

    if (resposta.ok) {
      alert("✅ Agendamento salvo com sucesso!");
      limparFormulario('form-agenda');
      await carregarAgendamentosDaPlanilha();
      atualizarLista();
      atualizarTabelaAdmin();
      atualizarContagem();
      gerarGraficos();
    } else {
      alert("❌ Erro ao salvar o agendamento!");
    }
  } catch (erro) {
    console.error("Erro:", erro);
    alert("Erro de conexão com o servidor!");
  }
});

// Painel Administrativo //
abrirAdmin.addEventListener('click', () => {
  modalAdmin.style.display = "block";
  msgErro.style.display = "none";
  document.getElementById('senhaAdmin').value = "";
});

fecharModal.addEventListener('click', () => modalAdmin.style.display = "none");
window.addEventListener('click', e => { if (e.target === modalAdmin) modalAdmin.style.display = "none"; });

// Login do admin
btnLoginAdmin.addEventListener('click', async () => {
  const senha = document.getElementById('senhaAdmin').value;
  if (senha === SENHA_ADMIN) {
    modalAdmin.style.display = "none";
    mainCliente.style.display = "none";
    mainAdmin.style.display = "block";

    await carregarAgendamentosDaPlanilha();

    atualizarTabelaAdmin();
    atualizarContagem();
    gerarGraficos();
  } else {
    msgErro.style.display = "block";
  }
});

btnSairAdmin.addEventListener('click', () => {
  mainAdmin.style.display = "none";
  mainCliente.style.display = "block";
});

// Atualiza tabela do painel admin
function atualizarTabelaAdmin() {
  const ag = JSON.parse(localStorage.getItem('agendamentos')) || [];
  tabelaBody.innerHTML = '';

  ag.forEach(a => {
    // Garantindo que a.id existe e está como string
    const id = a.id?.toString() || "";

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a.data}</td>
      <td>${a.hora}</td>
      <td>${a.nome}</td>
      <td>${a.servico}</td>
      <td>${a.telefone}</td>
      <td>
        <input type="checkbox" ${a.atendido ? "checked" : ""} 
          onchange="marcarAtendido('${id}', this.checked)">
      </td>
      <td class="acoes">
        <button class="btn-acao concluir" 
          onclick="marcarAtendido('${id}', ${!a.atendido})">
          ${a.atendido ? "✅" : "☑️"}
        </button>
        <button class="btn-acao excluir" 
          onclick="excluirAgendamento('${id}')">🗑️</button>
      </td>
    `;
    tabelaBody.appendChild(tr);
  });
}


// Funções de controle do admin (conectando com backend)
async function excluirAgendamento(id) {
  if (!id) {
    alert("❌ ID inválido para excluir!");
    return;
  }
  try {
    const resposta = await fetch(`${API_URL}/agendamentos/${Number(id)}`, { method: 'DELETE' });
    if (!resposta.ok) throw new Error("Erro ao excluir");
    await carregarAgendamentosDaPlanilha();
    atualizarTabelaAdmin();
    atualizarLista();
    atualizarContagem();
    gerarGraficos();
  } catch (erro) {
    console.error("Erro ao excluir:", erro);
    alert("Erro ao excluir o agendamento!");
  }
}
window.excluirAgendamento = excluirAgendamento;

async function marcarAtendido(id, status) {
  try {
    const resposta = await fetch(`${API_URL}/agendamentos/${Number(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ atendido: status })
    });
    if (!resposta.ok) throw new Error("Erro ao atualizar");
    await carregarAgendamentosDaPlanilha();
    atualizarTabelaAdmin();
    atualizarLista();
    atualizarContagem();
    gerarGraficos();
  } catch (erro) {
    console.error("Erro ao atualizar:", erro);
    alert("Erro ao atualizar o status do agendamento!");
  }
}
window.marcarAtendido = marcarAtendido;

// Contagem de atendimentos
function atualizarContagem() {
  const ag = JSON.parse(localStorage.getItem('agendamentos')) || [];
  const c = {};
  ag.forEach(a => {
    if (!c[a.data]) c[a.data] = 0;
    if (a.atendido) c[a.data]++;
  });
  const lista = document.getElementById('listaContagem');
  lista.innerHTML = Object.keys(c).map(d => `<li>${d}: ${c[d]} atendimentos</li>`).join('');
}

// Gráficos
function gerarGraficos() {
  const ag = JSON.parse(localStorage.getItem('agendamentos')) || [];
  const porDia = {};
  ag.forEach(a => { if (!porDia[a.data]) porDia[a.data] = 0; if (a.atendido) porDia[a.data]++; });

  const ctxDia = document.getElementById('graficoDia');
  if (chartDia) chartDia.destroy();
  if (ctxDia) chartDia = new Chart(ctxDia.getContext('2d'), {
    type: 'bar',
    data: { labels: Object.keys(porDia), datasets: [{ data: Object.values(porDia), backgroundColor: '#29dbe2' }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  const porMes = {};
  ag.forEach(a => { const m = a.data.slice(0, 7); if (!porMes[m]) porMes[m] = 0; if (a.atendido) porMes[m]++; });
  const ctxMes = document.getElementById('graficoMes');
  if (chartMes) chartMes.destroy();
  if (ctxMes) chartMes = new Chart(ctxMes.getContext('2d'), {
    type: 'line',
    data: { labels: Object.keys(porMes), datasets: [{ data: Object.values(porMes), borderColor: '#f70404', backgroundColor: 'rgba(247,4,4,0.2)', fill: true }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

// Carrega agendamentos ao abrir
carregarAgendamentosDaPlanilha().then(() => {
  atualizarLista();
  atualizarTabelaAdmin();
  atualizarContagem();
  gerarGraficos();
});
