import React, { useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const CanvasCaptcha = ({ captchaText, onRefresh }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw distractor lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.bezierCurveTo(
        Math.random() * canvas.width, Math.random() * canvas.height,
        Math.random() * canvas.width, Math.random() * canvas.height,
        Math.random() * canvas.width, Math.random() * canvas.height
      );
      ctx.stroke();
    }

    // Draw noise points
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 255}, 0.3)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw characters
    ctx.font = 'bold 22px monospace';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < captchaText.length; i++) {
      ctx.fillStyle = `rgb(${50 + Math.random() * 100}, ${30 + Math.random() * 100}, ${100 + Math.random() * 100})`;
      ctx.save();
      const x = 12 + i * 22;
      const y = canvas.height / 2 + (Math.random() * 8 - 4);
      const angle = (Math.random() * 28 - 14) * Math.PI / 180;
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(captchaText[i], 0, 0);
      ctx.restore();
    }
  }, [captchaText]);

  return (
    <div className="flex items-center gap-3">
      <canvas
        ref={canvasRef}
        width={130}
        height={46}
        className="border-2 border-slate-100 rounded-xl bg-slate-50 shadow-inner select-none"
      />
      <button
        type="button"
        onClick={onRefresh}
        className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition duration-150 active:scale-95 cursor-pointer"
        title="Refresh CAPTCHA Code"
      >
        <RefreshCw size={18} />
      </button>
    </div>
  );
};

export default CanvasCaptcha;
