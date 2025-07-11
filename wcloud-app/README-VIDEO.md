# WordCloud com Vídeo de Fundo

Esta é uma nova funcionalidade que adiciona um vídeo de fundo à aplicação WordCloud, criando uma experiência visual mais imersiva.

## Funcionalidades

### 🎥 Vídeo de Fundo
- Vídeo em loop como background da aplicação
- Fallback automático para gradiente animado quando o vídeo não está disponível
- Overlay escuro para melhor legibilidade do conteúdo

### ☁️ WordCloud com D3
- Sistema d3-cloud para renderização das palavras
- Controle total sobre a renderização das fontes
- Suporte a múltiplos pesos da fonte Rawline (300-900)
- Retina/HiDPI support para displays de alta resolução

### 🎯 Seleção de Palavras
- Interface para selecionar palavras da lista disponível
- Drag & drop para adicionar palavras ao wordcloud
- Controles para incrementar peso ou remover palavras
- Persistência das seleções no localStorage

### 📱 Responsivo
- Interface adaptada para desktop e mobile
- Touch gestures para dispositivos móveis
- Layout responsivo que se adapta ao tamanho da tela

## Como Usar

### 1. Navegação
- Use os botões "Principal" e "Com Vídeo" no header para alternar entre as versões
- A versão "Principal" mantém a funcionalidade original
- A versão "Com Vídeo" oferece a nova experiência com vídeo de fundo

### 2. Seleção de Palavras
- Clique nas palavras na lista "Palavras Disponíveis" para selecioná-las
- As palavras selecionadas aparecem na seção "Palavras Selecionadas"
- Use os botões + e × para controlar o peso ou remover palavras

### 3. WordCloud
- O wordcloud é renderizado automaticamente com as palavras selecionadas
- Palavras com maior peso aparecem maiores e mais bold
- O layout é otimizado para evitar sobreposições

## Configuração de Vídeo

### Adicionando seu próprio vídeo:
1. Coloque o arquivo de vídeo na pasta `public/videos/`
2. Nomeie como `background.mp4` (MP4) ou `background.webm` (WebM)
3. O componente detectará automaticamente e usará o vídeo

### Formatos suportados:
- MP4 (H.264)
- WebM (VP8/VP9)

### Fallback:
Se nenhum vídeo estiver disponível, um gradiente animado será usado como background.

## Estrutura de Arquivos

```
wcloud-app/
├── src/
│   ├── VideoWordCloud.jsx     # Componente principal
│   ├── VideoWordCloud.css     # Estilos específicos
│   └── App.jsx               # App principal com navegação
├── public/
│   └── videos/
│       ├── background.mp4     # Vídeo MP4 (opcional)
│       └── background.webm    # Vídeo WebM (opcional)
└── README-VIDEO.md           # Este arquivo
```

## Tecnologias Utilizadas

- **React**: Framework principal
- **d3-cloud**: Layout das palavras na nuvem
- **Canvas API**: Renderização das palavras
- **Rawline Font**: Fonte personalizada com múltiplos pesos
- **CSS3**: Animações e efeitos visuais

## Personalização

### Cores e Estilos
Edite o arquivo `VideoWordCloud.css` para personalizar:
- Cores do tema
- Animações
- Efeitos visuais
- Layout responsivo

### Palavras
Modifique o array `initialWords` no componente para alterar as palavras disponíveis.

### Fontes
As fontes Rawline são carregadas via @font-face. Certifique-se de que os arquivos .woff2 estão na pasta `public/fonts/`.

## Performance

- O vídeo é otimizado para performance com `object-fit: cover`
- O wordcloud é renderizado apenas quando necessário
- Suporte a Retina/HiDPI para displays de alta resolução
- Animações CSS otimizadas com `transform` e `opacity`

## Compatibilidade

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Vídeo não carrega
- Verifique se o arquivo está na pasta correta
- Confirme se o formato é suportado (MP4/WebM)
- O fallback será ativado automaticamente

### Fontes não aparecem bold
- Verifique se todos os pesos da fonte Rawline estão carregados
- Confirme se os arquivos .woff2 estão na pasta `public/fonts/`

### Performance lenta
- Reduza a resolução do vídeo de fundo
- Diminua o número de palavras simultâneas
- Verifique se o dispositivo tem suporte a hardware acceleration 