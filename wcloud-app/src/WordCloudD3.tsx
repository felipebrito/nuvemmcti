import React, { useEffect, useRef } from 'react';
import cloud from 'd3-cloud';

// Props: lista de palavras [[string, number]], largura, altura
interface WordCloudD3Props {
  words: [string, number][];
  width?: number;
  height?: number;
}

const fontFamily = 'Rawline, sans-serif';

// Função para determinar o peso da fonte conforme o tamanho
function getFontWeight(size: number) {
  if (size > 100) return 900;
  if (size > 70) return 900; // bold para grandes
  if (size > 50) return 700;
  if (size > 30) return 500;
  return 400;
}

function weightFactor(value: number) {
  const base = 14;
  const fator = 18;
  const maxFontSize = 120;
  return Math.min(base + Math.log2(value) * fator, maxFontSize);
}

const WordCloudD3: React.FC<WordCloudD3Props> = ({ words, width = 900, height = 600 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ratio = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx?.clearRect(0, 0, width, height);

    const wordObjs = words.map(([text, value]) => {
      const size = weightFactor(value);
      const weight = getFontWeight(size);
      return { text, value, size, weight };
    });

    cloud()
      .size([width, height])
      .words(wordObjs)
      .padding(5)
      .rotate(() => Math.random() > 0.5 ? 0 : 90)
      .font('Rawline')
      .fontWeight(d => d.weight)
      .fontSize(d => d.size)
      .on('end', draw)
      .start();

    function draw(words: any[]) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      words.forEach(word => {
        ctx.save();
        ctx.font = `${word.weight} ${word.size}px ${fontFamily}`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(word.x + width / 2, word.y + height / 2);
        ctx.rotate(word.rotate * Math.PI / 180);
        ctx.fillText(word.text, 0, 0);
        ctx.restore();
      });
    }
  }, [words, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ background: 'transparent', borderRadius: 8, display: 'block', margin: '0 auto' }}
    />
  );
};

export default WordCloudD3; 