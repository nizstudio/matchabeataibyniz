import React, { useEffect, useRef } from 'react';
import { Activity, Radio, Waves, Sparkles } from 'lucide-react';
import { AudioEffects } from '../types';
import { audioEngine } from '../audio/audioEngine';

interface AudioFxVisualizerProps {
  effects: AudioEffects;
  isPlaying: boolean;
  onEffectsChange: (updated: Partial<AudioEffects>) => void;
}

export const AudioFxVisualizer: React.FC<AudioFxVisualizerProps> = ({
  effects,
  isPlaying,
  onEffectsChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      // Clear with background color
      ctx.fillStyle = '#EEF3EC';
      ctx.fillRect(0, 0, width, height);

      // Center baseline
      ctx.strokeStyle = '#DDE6DA';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (isPlaying && analyser) {
        analyser.getByteFrequencyData(dataArray);

        const barCount = 36;
        const barWidth = width / barCount - 2;

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
          const val = dataArray[dataIndex] || 0;
          const barHeight = Math.max(3, (val / 255) * (height - 8));

          const x = i * (barWidth + 2);
          const y = height - barHeight;

          // Gradient color: Matcha Dark to Accent Green
          const grad = ctx.createLinearGradient(0, height, 0, y);
          grad.addColorStop(0, '#1F3526');
          grad.addColorStop(1, '#3E6248');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();
        }
      } else {
        // Idle gentle wave animation
        const time = Date.now() / 1000;
        const barCount = 36;
        const barWidth = width / barCount - 2;

        for (let i = 0; i < barCount; i++) {
          const sine = Math.sin(time * 2 + i * 0.25);
          const barHeight = 4 + (sine + 1) * 3;
          const x = i * (barWidth + 2);
          const y = height - barHeight;

          ctx.fillStyle = '#CAD8C6';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();
        }
      }
    };

    draw();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="bg-[#F8FAF7] rounded-2xl border border-[#DDE6DA] p-5 sm:p-6 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#DDE6DA] text-[#1F3526]">
            <Activity className="w-4 h-4 text-[#3E6248]" />
          </span>
          <h2 className="text-sm font-bold tracking-wider text-[#1E2A22] uppercase">
            Audio FX &amp; Visualizer
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#68756B]">
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-[#3E6248] animate-ping' : 'bg-[#CAD8C6]'
            }`}
          ></span>
          <span>{isPlaying ? 'Live Audio Stream' : 'Ready'}</span>
        </div>
      </div>

      {/* Visualizer Canvas Card */}
      <div className="rounded-xl overflow-hidden border border-[#DDE6DA] bg-[#EEF3EC] p-3 mb-5">
        <canvas
          ref={canvasRef}
          width={600}
          height={80}
          className="w-full h-20 rounded-lg block"
        />
      </div>

      {/* FX Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Low-pass Filter */}
        <div className="bg-[#EEF3EC]/70 rounded-xl p-3.5 border border-[#DDE6DA]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#1F3526] uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#3E6248]" /> Low-Pass Filter
            </span>
            <span className="font-mono text-xs font-bold text-[#1F3526]">
              {Math.round(effects.lowPassFreq)} Hz
            </span>
          </div>
          <input
            type="range"
            min="400"
            max="12000"
            step="100"
            value={effects.lowPassFreq}
            onChange={(e) =>
              onEffectsChange({ lowPassFreq: Number(e.target.value) })
            }
            className="w-full h-1.5 bg-[#DDE6DA] rounded-lg appearance-none cursor-pointer accent-[#1F3526]"
          />
          <div className="flex justify-between text-[10px] text-[#68756B] mt-1">
            <span>Mellow</span>
            <span>Bright</span>
          </div>
        </div>

        {/* Delay Echo */}
        <div className="bg-[#EEF3EC]/70 rounded-xl p-3.5 border border-[#DDE6DA]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#1F3526] uppercase tracking-wider flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-[#3E6248]" /> Delay Echo
            </span>
            <span className="font-mono text-xs font-bold text-[#1F3526]">
              {Math.round(effects.delayTime)} ms
            </span>
          </div>
          <input
            type="range"
            min="60"
            max="750"
            step="10"
            value={effects.delayTime}
            onChange={(e) =>
              onEffectsChange({ delayTime: Number(e.target.value) })
            }
            className="w-full h-1.5 bg-[#DDE6DA] rounded-lg appearance-none cursor-pointer accent-[#1F3526]"
          />
          <div className="flex justify-between text-[10px] text-[#68756B] mt-1">
            <span>Tight</span>
            <span>Spacious</span>
          </div>
        </div>

        {/* Space Reverb */}
        <div className="bg-[#EEF3EC]/70 rounded-xl p-3.5 border border-[#DDE6DA]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-[#1F3526] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3E6248]" /> Space Reverb
            </span>
            <span className="font-mono text-xs font-bold text-[#1F3526]">
              {Math.round(effects.reverbWet)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="95"
            step="1"
            value={effects.reverbWet}
            onChange={(e) =>
              onEffectsChange({ reverbWet: Number(e.target.value) })
            }
            className="w-full h-1.5 bg-[#DDE6DA] rounded-lg appearance-none cursor-pointer accent-[#1F3526]"
          />
          <div className="flex justify-between text-[10px] text-[#68756B] mt-1">
            <span>Dry Room</span>
            <span>Cathedral</span>
          </div>
        </div>
      </div>
    </div>
  );
};
