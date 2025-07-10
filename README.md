# NuvemMCTI

Wordcloud interativa para mesas touch, com vídeo de fundo e visual moderno.

## Funcionalidades
- Nuvem de palavras dinâmica (wordcloud2.js)
- Arraste palavras para a nuvem para aumentar seu peso
- Suporte a drag & drop (mouse e touch)
- Atalho **R** para resetar pesos (reset temporário, não afeta dados salvos)
- **Persistência robusta** automática no localStorage (mesmo após recarregar ou fechar o navegador)
- Fundo animado com vídeo em loop
- Palavras maiores ficam mais grossas (bold/extrabold)
- Paleta clara (branco/cinza) para destaque sobre vídeo

## Instalação

1. **Clone o repositório:**
   ```sh
   git clone https://github.com/felipebrito/nuvemmcti.git
   cd nuvemmcti/wcloud-app
   ```
2. **Instale as dependências:**
   ```sh
   npm install
   ```
3. **Coloque seu vídeo de fundo:**
   - Substitua `public/bg.mp4` pelo vídeo desejado.

4. **Rode o projeto:**
   ```sh
   npm run dev
   ```
   Acesse [http://localhost:5173](http://localhost:5173)

## Persistência e Reset
- **Incrementos**: Toda alteração de valor das palavras é salva automaticamente e persiste ao recarregar.
- **Reset (tecla R)**: O reset é temporário (soft reset), só afeta a interface. Ao recarregar, os valores salvos retornam.
- Para resetar permanentemente, limpe o localStorage manualmente ou implemente um botão de reset total.

## Customização
- Edite as palavras iniciais em `src/App.jsx` (`initialWords`)
- Ajuste cores, fonte e tamanho em `optionsBase` no mesmo arquivo
- O vídeo de fundo pode ser trocado por qualquer arquivo `.mp4` em `public/bg.mp4`

## Estrutura
- `wcloud-app/src/App.jsx` — lógica principal da wordcloud
- `wcloud-app/public/bg.mp4` — vídeo de fundo
- `wcloud-app/index.html` — inclui fontes e configurações globais

## Observações Técnicas
- O StrictMode do React foi removido para garantir persistência correta em ambiente de desenvolvimento.
- O localStorage nunca é sobrescrito com o valor inicial após o primeiro uso.

## Créditos
- [wordcloud2.js](https://github.com/timdream/wordcloud2.js)
- Fonte [Rawline](https://fonts.google.com/specimen/Rawline)

## Licença
MIT 