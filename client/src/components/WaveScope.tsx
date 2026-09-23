import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

type WaveType = "sine" | "triangle" | "square" | "saw";

const MIN_HZ = 44;
const MAX_HZ = 447;
const DEFAULT_HZ = 222;
const STEP_HZ = 1;
const TIME_WINDOW_S = 0.045; // 45ms fixed scope window
const HOLD_DELAY_MS = 400;
const HOLD_INTERVAL_MS = 50;
const PHASE_SPEED = 2.2; // rad/s scroll for live-scope feel
const REDUCED_PHASE_SPEED = 0.35;

const WAVE_TYPES: WaveType[] = ["sine", "triangle", "square", "saw"];
const WAVE_LABELS: Record<WaveType, string> = {
  sine: "Sine",
  triangle: "Triangle",
  square: "Square",
  saw: "Saw",
};

const a11y = {
  he: {
    scope: "מד תדר אינטראקטיבי",
    decrease: "הורדת תדר",
    increase: "העלאת תדר",
    frequency: "תדר",
    waveType: (name: string) => `צורת גל ${name}`,
  },
  en: {
    scope: "Interactive frequency wave scope",
    decrease: "Decrease frequency",
    increase: "Increase frequency",
    frequency: "Frequency",
    waveType: (name: string) => `${name} waveform`,
  },
  ru: {
    scope: "Интерактивный осциллограф частоты",
    decrease: "Уменьшить частоту",
    increase: "Увеличить частоту",
    frequency: "Частота",
    waveType: (name: string) => `Форма волны ${name}`,
  },
  ar: {
    scope: "منظار موجي تفاعلي للتردد",
    decrease: "خفض التردد",
    increase: "رفع التردد",
    frequency: "التردد",
    waveType: (name: string) => `شكل الموجة ${name}`,
  },
} satisfies Record<
  Language,
  {
    scope: string;
    decrease: string;
    increase: string;
    frequency: string;
    waveType: (name: string) => string;
  }
>;

function sampleWave(type: WaveType, phase: number): number {
  switch (type) {
    case "sine":
      return Math.sin(phase);
    case "triangle":
      return (2 / Math.PI) * Math.asin(Math.sin(phase));
    case "square":
      return Math.sin(phase) >= 0 ? 1 : -1;
    case "saw": {
      const t = ((phase / (Math.PI * 2)) % 1 + 1) % 1;
      return 2 * t - 1;
    }
    default:
      return Math.sin(phase);
  }
}

function clampHz(value: number): number {
  return Math.min(MAX_HZ, Math.max(MIN_HZ, Math.round(value)));
}

export default function WaveScope() {
  const { language } = useLanguage();
  const labels = a11y[language];

  const [frequency, setFrequency] = useState(DEFAULT_HZ);
  const [waveType, setWaveType] = useState<WaveType>("sine");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const freqRef = useRef(frequency);
  const typeRef = useRef(waveType);
  const phaseRef = useRef(0);
  const rafRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  freqRef.current = frequency;
  typeRef.current = waveType;

  const bumpFrequency = useCallback((delta: number) => {
    setFrequency((prev) => {
      const next = clampHz(prev + delta);
      if (next === prev) {
        // Stop hold when we hit the rail
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        if (holdIntervalRef.current) {
          clearInterval(holdIntervalRef.current);
          holdIntervalRef.current = null;
        }
      }
      return next;
    });
  }, []);

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const startHold = useCallback(
    (delta: number) => {
      clearHold();
      bumpFrequency(delta);
      holdTimerRef.current = setTimeout(() => {
        holdIntervalRef.current = setInterval(() => bumpFrequency(delta), HOLD_INTERVAL_MS);
      }, HOLD_DELAY_MS);
    },
    [bumpFrequency, clearHold],
  );

  useEffect(() => () => clearHold(), [clearHold]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedMotionRef.current = mq.matches;
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTs = 0;
    let dpr = 1;
    let cssW = 0;
    let cssH = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = Math.max(1, Math.floor(rect.width));
      cssH = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const styles = getComputedStyle(document.documentElement);
    const acid = styles.getPropertyValue("--acid").trim() || "#e3c565";
    const paper = styles.getPropertyValue("--paper").trim() || "#f2f1eb";

    const draw = (ts: number) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      const speed = reducedMotionRef.current ? REDUCED_PHASE_SPEED : PHASE_SPEED;
      phaseRef.current += speed * dt;

      const w = cssW;
      const h = cssH;
      const midY = h * 0.5;
      const amp = h * 0.34;
      const freq = freqRef.current;
      const type = typeRef.current;
      const phase0 = phaseRef.current;

      ctx.clearRect(0, 0, w, h);

      // Subtle grid
      ctx.save();
      ctx.strokeStyle = "rgba(227,197,101,0.10)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();

      ctx.strokeStyle = "rgba(227,197,101,0.06)";
      ctx.beginPath();
      ctx.moveTo(0, midY - amp);
      ctx.lineTo(w, midY - amp);
      ctx.moveTo(0, midY + amp);
      ctx.lineTo(w, midY + amp);
      // vertical ticks
      const vDivs = 8;
      for (let i = 1; i < vDivs; i++) {
        const x = (w * i) / vDivs;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      ctx.stroke();
      ctx.restore();

      const samples = Math.max(64, Math.ceil(w));
      const omega = Math.PI * 2 * freq; // rad/s

      const wavePath = new Path2D();
      const fillPath = new Path2D();
      for (let i = 0; i <= samples; i++) {
        const x = (i / samples) * w;
        const t = (i / samples) * TIME_WINDOW_S;
        const y = midY - sampleWave(type, omega * t + phase0) * amp;
        if (i === 0) {
          wavePath.moveTo(x, y);
          fillPath.moveTo(x, y);
        } else {
          wavePath.lineTo(x, y);
          fillPath.lineTo(x, y);
        }
      }
      fillPath.lineTo(w, midY);
      fillPath.lineTo(0, midY);
      fillPath.closePath();

      // Soft fill under the wave
      ctx.save();
      const grad = ctx.createLinearGradient(0, midY - amp, 0, midY + amp);
      grad.addColorStop(0, "rgba(227,197,101,0.14)");
      grad.addColorStop(0.5, "rgba(227,197,101,0.04)");
      grad.addColorStop(1, "rgba(227,197,101,0.00)");
      ctx.fillStyle = grad;
      ctx.fill(fillPath);
      ctx.restore();

      // Glow stroke
      ctx.save();
      ctx.strokeStyle = acid;
      ctx.lineWidth = 2.25;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(227,197,101,0.55)";
      ctx.shadowBlur = 10;
      ctx.stroke(wavePath);
      ctx.restore();

      // Faint mirror / secondary trace
      ctx.save();
      ctx.strokeStyle = paper;
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      const soft = new Path2D();
      for (let i = 0; i <= samples; i++) {
        const x = (i / samples) * w;
        const t = (i / samples) * TIME_WINDOW_S;
        const y = midY - sampleWave(type, omega * t + phase0) * amp * 0.55;
        if (i === 0) soft.moveTo(x, y);
        else soft.lineTo(x, y);
      }
      ctx.stroke(soft);
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  const atMin = frequency <= MIN_HZ;
  const atMax = frequency >= MAX_HZ;
  const freqDisplay = frequency.toFixed(2);

  return (
    <div className="wave-scope" role="group" aria-label={labels.scope} dir="ltr">
      <div className="wave-scope__chrome">
        <div className="wave-scope__freq" aria-live="polite">
          <span className="wave-scope__freq-label">{labels.frequency}</span>
          <div className="wave-scope__freq-controls">
            <button
              type="button"
              className="wave-scope__step"
              aria-label={labels.decrease}
              disabled={atMin}
              onPointerDown={(e) => {
                if (e.button !== 0 || atMin) return;
                e.preventDefault();
                (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
                startHold(-STEP_HZ);
              }}
              onPointerUp={clearHold}
              onPointerCancel={clearHold}
              onPointerLeave={clearHold}
            >
              −
            </button>
            <strong className="wave-scope__readout">
              {freqDisplay} <small>Hz</small>
            </strong>
            <button
              type="button"
              className="wave-scope__step"
              aria-label={labels.increase}
              disabled={atMax}
              onPointerDown={(e) => {
                if (e.button !== 0 || atMax) return;
                e.preventDefault();
                (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
                startHold(STEP_HZ);
              }}
              onPointerUp={clearHold}
              onPointerCancel={clearHold}
              onPointerLeave={clearHold}
            >
              +
            </button>
          </div>
        </div>

        <div className="wave-scope__types" role="group" aria-label="Waveform type">
          {WAVE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`wave-scope__type${waveType === type ? " is-active" : ""}`}
              aria-label={labels.waveType(WAVE_LABELS[type])}
              aria-pressed={waveType === type}
              onClick={() => setWaveType(type)}
            >
              {WAVE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="wave-scope__canvas-wrap" ref={wrapRef}>
        <canvas ref={canvasRef} className="wave-scope__canvas" aria-hidden="true" />
      </div>
    </div>
  );
}
