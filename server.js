const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Carregar dados dos animes
const animesPath = path.join(__dirname, 'animes.json');
let animes = JSON.parse(fs.readFileSync(animesPath, 'utf-8'));

// ===== ROTAS =====

// Rota principal
app.get('/', (req, res) => {
  res.json({
    message: 'Bem-vindo à API de Animes! 🎌',
    endpoints: {
      'GET /animes': 'Lista todos os animes',
      'GET /animes/:id': 'Busca anime por ID',
      'GET /animes/search?nome=': 'Busca animes por nome',
      'GET /animes/filter?genero=&temporada=&ano=': 'Filtra animes'
    }
  });
});

// Listar todos os animes
app.get('/animes', (req, res) => {
  res.json({
    total: animes.length,
    animes: animes
  });
});

// Buscar animes por nome (ANTES do :id)
app.get('/animes/search', (req, res) => {
  const { nome } = req.query;
  
  if (!nome) {
    return res.status(400).json({ erro: 'Parâmetro "nome" é obrigatório' });
  }
  
  const resultados = animes.filter(anime => 
    anime.titulo.toLowerCase().includes(nome.toLowerCase())
  );
  
  res.json({
    busca: nome,
    total: resultados.length,
    animes: resultados
  });
});

// Filtrar animes por gênero, temporada ou ano (ANTES do :id)
app.get('/animes/filter', (req, res) => {
  const { genero, temporada, ano } = req.query;
  
  let resultados = [...animes];
  
  if (genero) {
    resultados = resultados.filter(anime =>
      anime.generos.some(g => g.toLowerCase() === genero.toLowerCase())
    );
  }
  
  if (temporada) {
    resultados = resultados.filter(anime =>
      anime.temporada.toLowerCase() === temporada.toLowerCase()
    );
  }
  
  if (ano) {
    resultados = resultados.filter(anime =>
      anime.ano === parseInt(ano)
    );
  }
  
  res.json({
    filtros: { genero, temporada, ano },
    total: resultados.length,
    animes: resultados
  });
});

// Buscar anime por ID (POR ÚLTIMO)
app.get('/animes/:id', (req, res) => {
  const anime = animes.find(a => a.id === parseInt(req.params.id));
  
  if (!anime) {
    return res.status(404).json({ erro: 'Anime não encontrado' });
  }
  
  res.json(anime);
});

// Adicionar novo anime (POST)
app.post('/animes', (req, res) => {
  const novoAnime = req.body;
  
  // Validação básica
  if (!novoAnime.titulo || !novoAnime.generos || !novoAnime.ano) {
    return res.status(400).json({ erro: 'Título, gêneros e ano são obrigatórios' });
  }
  
  // Gerar novo ID
  const novoId = animes.length > 0 ? Math.max(...animes.map(a => a.id)) + 1 : 1;
  
  // Criar objeto do anime
  const anime = {
    id: novoId,
    titulo: novoAnime.titulo,
    tituloOriginal: novoAnime.tituloOriginal || '',
    generos: novoAnime.generos,
    temporada: novoAnime.temporada || 'Não especificada',
    ano: parseInt(novoAnime.ano),
    episodios: parseInt(novoAnime.episodios) || 0,
    status: novoAnime.status || 'Em andamento',
    sinopse: novoAnime.sinopse || 'Sem sinopse',
    nota: parseFloat(novoAnime.nota) || 0,
    estudio: novoAnime.estudio || 'Desconhecido'
  };
  
  // Adicionar ao array
  animes.push(anime);
  
  // Salvar no arquivo JSON
  try {
    fs.writeFileSync(animesPath, JSON.stringify(animes, null, 2), 'utf-8');
    res.status(201).json({ 
      mensagem: 'Anime adicionado com sucesso!', 
      anime: anime 
    });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao salvar anime' });
  }
});

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 API de Animes rodando em http://localhost:${PORT}`);
  console.log(`📊 Total de animes carregados: ${animes.length}`);
});