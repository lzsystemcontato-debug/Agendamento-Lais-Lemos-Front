const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const caminhoArquivo = './agendamentos.json';
let agendamentos = [];

// Carregar agendamentos do arquivo ao iniciar
if (fs.existsSync(caminhoArquivo)) {
  const dados = fs.readFileSync(caminhoArquivo, 'utf-8');
  agendamentos = JSON.parse(dados);
}

// Função para salvar agendamentos no arquivo
function salvarAgendamentos() {
  fs.writeFileSync(caminhoArquivo, JSON.stringify(agendamentos, null, 2));
}

// Listar agendamentos
app.get('/agendamentos', (req, res) => {
  res.json(agendamentos);
});

// Adicionar agendamento
app.post('/agendamentos', (req, res) => {
  const { nome, telefone, data, hora, servico } = req.body;
  if (!nome || !telefone || !data || !hora || !servico) {
    return res.status(400).json({ erro: 'Preencha todos os campos!' });
  }
  const id = Date.now(); // id simples
  agendamentos.push({ id, nome, telefone, data, hora, servico, atendido: false });
  salvarAgendamentos();
  res.json({ sucesso: true });
});

// Atualizar status atendido
app.patch('/agendamentos/:id', (req, res) => {
  const id = Number(req.params.id);
  const { atendido } = req.body;
  const ag = agendamentos.find(a => a.id === id);
  if (!ag) return res.status(404).json({ erro: 'Agendamento não encontrado' });
  ag.atendido = atendido;
  salvarAgendamentos();
  res.json({ sucesso: true });
});

// Excluir agendamento
app.delete('/agendamentos/:id', (req, res) => {
  const id = Number(req.params.id);
  agendamentos = agendamentos.filter(a => a.id !== id);
  salvarAgendamentos();
  res.json({ sucesso: true });
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
