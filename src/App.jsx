import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Metabolism Animation Component ──────────────────────── */
function MetabolismAnimation({ rate }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const stateRef = useRef({ particles: [], enzymes: [], time: 0 });

  const color = rate < 30 ? "#e67e22" : rate > 70 ? "#e74c3c" : "#2ecc71";
  const concentration = Math.round(100 - rate);
  const enzymeActivity = Math.round(rate);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const tubeY = H / 2;
    const tubeH = 28;
    const tubeTop = tubeY - tubeH / 2;
    const tubeBot = tubeY + tubeH / 2;

    // Start particles
    const numParticles = 14;
    stateRef.current.particles = Array.from(
      { length: numParticles },
      (_, i) => ({
        x: (i / numParticles) * W,
        y: tubeY + (Math.random() - 0.5) * (tubeH - 10),
        r: 4 + Math.random() * 2,
        metabolized: false,
        opacity: 1,
      }),
    );
    // Enzyme markers (fixed positions along tube)
    stateRef.current.enzymes = [W * 0.25, W * 0.5, W * 0.75].map((ex) => ({
      x: ex,
      active: false,
      pulse: 0,
    }));

    let lastTime = null;
    function draw(ts) {
      if (!lastTime) lastTime = ts;
      const dt = Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;

      // Speed is proportional to rate (pixels per second)
      const speed = 15 + rate * 2.5;

      ctx.clearRect(0, 0, W, H);

      // Draw tube (bloodstream)
      const grad = ctx.createLinearGradient(0, tubeTop, 0, tubeBot);
      grad.addColorStop(0, "rgba(180,30,60,0.15)");
      grad.addColorStop(0.5, "rgba(180,30,60,0.35)");
      grad.addColorStop(1, "rgba(180,30,60,0.15)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(0, tubeTop, W, tubeH, 14);
      ctx.fill();
      ctx.strokeStyle = "rgba(180,30,60,0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Tube label
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "10px sans-serif";
      ctx.fillText("Bloodstream", 8, tubeTop - 5);

      // Enzyme labels
      stateRef.current.enzymes.forEach((e) => {
        // Draw enzyme diamond
        e.pulse = (e.pulse + dt * 3) % (Math.PI * 2);
        const alpha = 0.5 + 0.3 * Math.sin(e.pulse);
        ctx.save();
        ctx.translate(e.x, tubeTop - 14);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = `rgba(126,200,227,${alpha})`;
        ctx.strokeStyle = `rgba(126,200,227,${alpha * 1.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(-6, -6, 12, 12);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = `rgba(126,200,227,${alpha})`;
        ctx.font = "bold 7px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CYP3A", e.x, tubeTop - 26);
        ctx.textAlign = "left";
      });

      // Update and draw particles
      stateRef.current.particles.forEach((p) => {
        p.x += speed * dt;
        if (p.x > W + 10) {
          p.x = -10;
          p.y = tubeY + (Math.random() - 0.5) * (tubeH - 12);
          p.metabolized = false;
          p.opacity = 1;
        }

        // Check enzyme collision
        stateRef.current.enzymes.forEach((e) => {
          if (!p.metabolized && Math.abs(p.x - e.x) < 10) {
            // At high rates, more likely to metabolize
            if (Math.random() < rate / 800) {
              p.metabolized = true;
            }
          }
        });

        // Fade metabolized particles
        if (p.metabolized) p.opacity = Math.max(0.08, p.opacity - dt * 1.5);

        // Draw drug molecule
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        const drugColor = p.metabolized
          ? "rgba(100,100,120,"
          : rate < 30
            ? "rgba(230,126,34,"
            : rate > 70
              ? "rgba(231,76,60,"
              : "rgba(52,152,219,";
        ctx.fillStyle = drugColor + p.opacity + ")";
        ctx.fill();
        ctx.strokeStyle = drugColor + p.opacity * 0.7 + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Concentration gauge (right side)
      const gaugeX = W - 22;
      const gaugeH = H - 20;
      const gaugeY = 10;
      const fillH = (concentration / 100) * gaugeH;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.roundRect(gaugeX, gaugeY, 14, gaugeH, 4);
      ctx.fill();
      const gaugeGrad = ctx.createLinearGradient(
        0,
        gaugeY + gaugeH - fillH,
        0,
        gaugeY + gaugeH,
      );
      gaugeGrad.addColorStop(0, color + "44");
      gaugeGrad.addColorStop(1, color + "cc");
      ctx.fillStyle = gaugeGrad;
      ctx.beginPath();
      ctx.roundRect(gaugeX, gaugeY + gaugeH - fillH, 14, fillH, 4);
      ctx.fill();
      ctx.strokeStyle = color + "55";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(gaugeX, gaugeY, 14, gaugeH, 4);
      ctx.stroke();

      // Gauge label
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Drug", gaugeX + 7, gaugeY - 2);
      ctx.fillText("Level", gaugeX + 7, gaugeY + 8);
      ctx.fillStyle = color;
      ctx.font = "bold 9px sans-serif";
      ctx.fillText(concentration + "%", gaugeX + 7, gaugeY + gaugeH + 12);
      ctx.textAlign = "left";

      // Enzyme activity bar (bottom)
      const barY = H - 14;
      const barW = W - 30 - 30;
      const barX = 8;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, 8, 4);
      ctx.fill();
      const actGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      actGrad.addColorStop(0, "#2ecc71");
      actGrad.addColorStop(0.5, "#f1c40f");
      actGrad.addColorStop(1, "#e74c3c");
      ctx.fillStyle = actGrad;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.roundRect(barX, barY, (enzymeActivity / 100) * barW, 8, 4);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "8px sans-serif";
      ctx.fillText("Enzyme Activity: " + enzymeActivity + "%", barX, barY - 3);

      animRef.current = requestAnimationFrame(draw);
    }
    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [rate, color, concentration, enzymeActivity]);

  return (
    <div className="met-anim-wrap">
      <canvas ref={canvasRef} width={560} height={120} className="met-canvas" />
      <div className="met-anim-legend">
        <span style={{ color }}>■ Drug molecules</span>
        <span style={{ color: "#7ec8e3" }}>◆ CYP3A4/5 enzyme</span>
        <span style={{ color: "#888" }}>■ Metabolized (inactive)</span>
      </div>
    </div>
  );
}

/* ─── Rotatable Brain SVG — 3D with Dopamine Pathways ─────── */
function RotatableBrain({ activeRegion, setActiveRegion, regions }) {
  const [rotY, setRotY] = useState(0);
  const [rotX, setRotX] = useState(0);
  const [showPathways, setShowPathways] = useState(true);
  const dragRef = useRef(null);

  const getPos = (e) => {
    if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  };
  const onDragStart = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    dragRef.current = {
      startX: pos.x,
      startY: pos.y,
      rotY,
      rotX,
      dragging: true,
    };
  };
  const onDragMove = useCallback((e) => {
    if (!dragRef.current?.dragging) return;
    const pos = getPos(e);
    const dx = pos.x - dragRef.current.startX;
    const dy = pos.y - dragRef.current.startY;
    setRotY(Math.max(-78, Math.min(78, dragRef.current.rotY + dx * 0.55)));
    setRotX(Math.max(-30, Math.min(30, dragRef.current.rotX + dy * 0.35)));
  }, []);
  const onDragEnd = () => {
    if (dragRef.current) dragRef.current.dragging = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("touchend", onDragEnd);
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragEnd);
      window.removeEventListener("touchmove", onDragMove);
      window.removeEventListener("touchend", onDragEnd);
    };
  }, [onDragMove]);

  const showFront = Math.abs(rotY) < 55;
  const sideLabel =
    rotY > 55 ? "Left Hemisphere" : rotY < -55 ? "Right Hemisphere" : null;
  const vta = regions.find((r) => r.id === "vta");
  const nac = regions.find((r) => r.id === "nac");
  const pfc = regions.find((r) => r.id === "pfc");
  const ds = regions.find((r) => r.id === "dstr");

  return (
    <div className="brain-rotate-wrap">
      <div className="brain-rotate-hint">
        ↔ Drag to rotate · Click a region to explore
      </div>
      <div className="brain-pathway-toggle">
        <button
          className={`pathway-btn ${showPathways ? "active" : ""}`}
          onClick={() => setShowPathways((p) => !p)}
        >
          {showPathways ? "◉" : "○"} Dopamine Pathways
        </button>
      </div>
      <div
        className="brain-3d-container"
        style={{
          transform: `perspective(700px) rotateY(${rotY}deg) rotateX(${-rotX}deg)`,
        }}
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
      >
        <svg
          viewBox="0 0 80 95"
          className="brain-svg"
          aria-label="Rotatable 3D brain diagram"
        >
          <defs>
            {/* Main 3D surface gradient — lighter at upper-left, dark at edges */}
            <radialGradient id="brainSurface" cx="34%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#7d4ab0" />
              <stop offset="40%" stopColor="#4a1e7a" />
              <stop offset="100%" stopColor="#180830" />
            </radialGradient>
            {/* Specular highlight */}
            <radialGradient id="brainSpec" cx="28%" cy="22%" r="35%">
              <stop offset="0%" stopColor="rgba(230,210,255,0.32)" />
              <stop offset="100%" stopColor="rgba(230,210,255,0)" />
            </radialGradient>
            {/* Cerebellum gradient */}
            <radialGradient id="cerebGrad" cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#5b2a90" />
              <stop offset="100%" stopColor="#1a082e" />
            </radialGradient>
            {/* Rim glow filter */}
            <filter id="rimGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="1.2"
                result="blur"
              />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Dopamine arrowheads */}
            <marker
              id="meso-arrow"
              markerWidth="3.5"
              markerHeight="3"
              refX="3"
              refY="1.5"
              orient="auto"
            >
              <polygon
                points="0 0, 3.5 1.5, 0 3"
                fill="#f39c12"
                opacity="0.9"
              />
            </marker>
            <marker
              id="meso-c-arrow"
              markerWidth="3.5"
              markerHeight="3"
              refX="3"
              refY="1.5"
              orient="auto"
            >
              <polygon
                points="0 0, 3.5 1.5, 0 3"
                fill="#3498db"
                opacity="0.9"
              />
            </marker>
            <marker
              id="nigro-arrow"
              markerWidth="3.5"
              markerHeight="3"
              refX="3"
              refY="1.5"
              orient="auto"
            >
              <polygon
                points="0 0, 3.5 1.5, 0 3"
                fill="#9b59b6"
                opacity="0.9"
              />
            </marker>
          </defs>

          {/* Drop shadow */}
          <ellipse cx="42" cy="48" rx="34" ry="36" fill="rgba(0,0,0,0.45)" />

          {/* ── Realistic brain silhouette (lateral view) ── */}
          <path
            d="M 37 12 C 24 11, 11 20, 10 34 C 9 48, 11 61, 22 69 C 30 75, 42 78, 54 74 C 66 69, 74 58, 73 46 C 74 33, 69 21, 60 16 C 54 12, 46 12, 37 12 Z"
            fill="url(#brainSurface)"
            stroke="rgba(160,100,220,0.7)"
            strokeWidth="1"
          />
          {/* Specular highlight overlay */}
          <path
            d="M 37 12 C 24 11, 11 20, 10 34 C 9 48, 11 61, 22 69 C 30 75, 42 78, 54 74 C 66 69, 74 58, 73 46 C 74 33, 69 21, 60 16 C 54 12, 46 12, 37 12 Z"
            fill="url(#brainSpec)"
            stroke="none"
          />
          {/* Edge rim glow for 3D */}
          <path
            d="M 37 12 C 24 11, 11 20, 10 34 C 9 48, 11 61, 22 69 C 30 75, 42 78, 54 74 C 66 69, 74 58, 73 46 C 74 33, 69 21, 60 16 C 54 12, 46 12, 37 12 Z"
            fill="none"
            stroke="rgba(200,150,255,0.18)"
            strokeWidth="4"
            filter="url(#rimGlow)"
          />

          {/* ── Cerebellum (back-bottom) ── */}
          <path
            d="M 52 71 C 58 71, 67 68, 70 63 C 68 59, 61 58, 54 61 C 50 63, 50 69, 52 71 Z"
            fill="url(#cerebGrad)"
            stroke="rgba(140,80,200,0.5)"
            strokeWidth="0.7"
          />
          {/* Cerebellum folds */}
          <path
            d="M 54 70 Q 61 67 68 64"
            stroke="#4a1a70"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M 55 68 Q 62 65 67 63"
            stroke="#4a1a70"
            strokeWidth="0.4"
            fill="none"
          />
          <path
            d="M 57 66 Q 63 64 67 62"
            stroke="#4a1a70"
            strokeWidth="0.35"
            fill="none"
          />

          {/* ── Brainstem ── */}
          <path
            d="M 33 74 C 31 80, 31 87, 34 91 C 36 93, 40 93, 42 91 C 45 87, 45 80, 43 74"
            fill="#250a40"
            stroke="rgba(140,80,200,0.5)"
            strokeWidth="0.8"
          />

          {/* ── Cortical folds (sulci & gyri) ── */}
          {/* Central sulcus */}
          <path
            d="M 42 14 Q 44 20 42 26 Q 40 30 38 36"
            stroke="#4a1a70"
            strokeWidth="0.8"
            fill="none"
            opacity="0.9"
          />
          {/* Sylvian fissure */}
          <path
            d="M 16 46 Q 30 44 44 46 Q 55 48 66 46"
            stroke="#4a1a70"
            strokeWidth="0.9"
            fill="none"
            opacity="0.8"
          />
          {/* Superior frontal */}
          <path
            d="M 17 30 Q 24 26 30 28"
            stroke="#5a2280"
            strokeWidth="0.6"
            fill="none"
          />
          <path
            d="M 16 38 Q 22 34 28 35"
            stroke="#5a2280"
            strokeWidth="0.55"
            fill="none"
          />
          {/* Post-central gyrus area */}
          <path
            d="M 48 17 Q 54 15 60 18"
            stroke="#5a2280"
            strokeWidth="0.6"
            fill="none"
          />
          <path
            d="M 54 24 Q 60 22 66 26"
            stroke="#5a2280"
            strokeWidth="0.6"
            fill="none"
          />
          <path
            d="M 56 33 Q 63 30 69 35"
            stroke="#5a2280"
            strokeWidth="0.55"
            fill="none"
          />
          <path
            d="M 55 41 Q 63 39 70 43"
            stroke="#5a2280"
            strokeWidth="0.5"
            fill="none"
          />
          {/* Occipital */}
          <path
            d="M 60 52 Q 66 54 70 56"
            stroke="#5a2280"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M 56 59 Q 62 61 68 60"
            stroke="#5a2280"
            strokeWidth="0.5"
            fill="none"
          />
          {/* Temporal */}
          <path
            d="M 20 55 Q 30 53 40 55"
            stroke="#5a2280"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M 20 62 Q 30 60 42 62"
            stroke="#5a2280"
            strokeWidth="0.5"
            fill="none"
          />
          {/* Parietal */}
          <path
            d="M 32 30 Q 40 27 48 30"
            stroke="#5a2280"
            strokeWidth="0.6"
            fill="none"
          />
          {/* Corpus callosum midline */}
          <path
            d="M 28 50 Q 42 46 56 50"
            stroke="#5a2080"
            strokeWidth="1.4"
            fill="none"
            opacity="0.5"
          />
          {/* Interhemispheric fissure */}
          <path
            d="M 36 13 Q 41 11 46 13"
            stroke="#3d1060"
            strokeWidth="0.7"
            fill="none"
          />

          {/* ── DOPAMINE PATHWAYS ── */}
          {showFront && showPathways && vta && nac && pfc && ds && (
            <g>
              {/* Mesolimbic: VTA → Nucleus Accumbens (orange/gold) */}
              <path
                d={`M ${vta.cx} ${vta.cy} C ${vta.cx - 6} ${vta.cy - 10}, ${nac.cx + 4} ${nac.cy + 8}, ${nac.cx} ${nac.cy}`}
                stroke="#f39c12"
                strokeWidth="1.4"
                fill="none"
                strokeDasharray="3 2"
                className="dopa-anim mesolimbic-path"
                markerEnd="url(#meso-arrow)"
              />
              <text
                x="43"
                y="58"
                fontSize="2.8"
                fill="#f39c12"
                opacity="0.8"
                textAnchor="middle"
              >
                Mesolimbic
              </text>

              {/* Mesocortical: VTA → Prefrontal Cortex (blue) */}
              <path
                d={`M ${vta.cx} ${vta.cy} C ${vta.cx - 10} ${vta.cy - 15}, ${pfc.cx + 8} ${pfc.cy + 12}, ${pfc.cx} ${pfc.cy}`}
                stroke="#3498db"
                strokeWidth="1.2"
                fill="none"
                strokeDasharray="3 2"
                className="dopa-anim mesocortical-path"
                markerEnd="url(#meso-c-arrow)"
              />
              <text
                x="32"
                y="47"
                fontSize="2.8"
                fill="#3498db"
                opacity="0.8"
                textAnchor="middle"
              >
                Mesocortical
              </text>

              {/* Nigrostriatal: VTA → Dorsal Striatum (purple) */}
              <path
                d={`M ${vta.cx} ${vta.cy} C ${vta.cx + 2} ${vta.cy - 8}, ${ds.cx + 2} ${ds.cy + 6}, ${ds.cx} ${ds.cy}`}
                stroke="#9b59b6"
                strokeWidth="1"
                fill="none"
                strokeDasharray="2.5 2"
                className="dopa-anim nigrostriatal-path"
                markerEnd="url(#nigro-arrow)"
              />
              <text
                x="57"
                y="53"
                fontSize="2.6"
                fill="#9b59b6"
                opacity="0.75"
                textAnchor="middle"
              >
                Nigrostr.
              </text>
            </g>
          )}

          {/* Side label when rotated far */}
          {!showFront && (
            <text
              x="40"
              y="48"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="6"
              fill="rgba(255,255,255,0.45)"
            >
              {sideLabel}
            </text>
          )}

          {/* ── Brain region hotspots ── */}
          {showFront &&
            regions.map((r) => (
              <g
                key={r.id}
                onClick={() =>
                  setActiveRegion(activeRegion === r.id ? null : r.id)
                }
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={r.cx}
                  cy={r.cy}
                  r={r.r + 3}
                  fill={
                    activeRegion === r.id
                      ? "rgba(231,76,60,0.2)"
                      : "rgba(142,68,173,0.12)"
                  }
                />
                <circle
                  cx={r.cx}
                  cy={r.cy}
                  r={r.r}
                  fill={activeRegion === r.id ? "#e74c3c" : "#8e44ad"}
                  opacity="0.92"
                />
                <text
                  x={r.cx}
                  y={r.cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="4.2"
                  fill="white"
                  fontWeight="bold"
                >
                  {r.label}
                </text>
              </g>
            ))}
        </svg>
      </div>

      {/* Pathway legend */}
      {showFront && showPathways && (
        <div className="brain-pathway-legend">
          <span style={{ color: "#f39c12" }}>
            ● Mesolimbic (VTA→NAc) — Primary reward circuit
          </span>
          <span style={{ color: "#3498db" }}>
            ● Mesocortical (VTA→PFC) — Impulse control
          </span>
          <span style={{ color: "#9b59b6" }}>
            ● Nigrostriatal (VTA→DS) — Habit formation
          </span>
        </div>
      )}
      <div className="brain-rot-indicator">
        ⟳ {Math.round(Math.abs(rotY))}° rotated
      </div>
    </div>
  );
}

const SECTIONS = [
  { id: "s1", label: "Entrance Hall", icon: "🏛️", color: "#1e3a5f" },
  { id: "s2", label: "Genetics Lab", icon: "🧬", color: "#1a4d3a" },
  { id: "s3", label: "Biochemistry Station", icon: "⚗️", color: "#4a2060" },
  { id: "s4", label: "Neuroscience Chamber", icon: "🧠", color: "#5a1a1a" },
  { id: "s5", label: "Pharmacology Wing", icon: "💊", color: "#1a3a5a" },
  { id: "s6", label: "Clinical Office", icon: "🩺", color: "#1a4a3a" },
  { id: "s7", label: "Ethics & Citations Hall", icon: "⚖️", color: "#3a2a0a" },
];

function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="tooltip-wrap"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span className="tooltip-term">{children}</span>
      {visible && <span className="tooltip-box">{text}</span>}
    </span>
  );
}

function Accordion({ title, children, accent = "#4fc3f7" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="accordion" style={{ borderLeft: `4px solid ${accent}` }}>
      <button className="accordion-header" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <span className="accordion-arrow">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  );
}

function ImageCard({ src, alt, caption, citation, fallback }) {
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <>
      <figure className="img-card" onClick={() => !error && setOpen(true)} style={!error ? { cursor: "zoom-in" } : {}}>
        {error ? (
          <div className="img-fallback">
            {fallback || "[ Image unavailable ]"}
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            onError={() => setError(true)}
            loading="lazy"
          />
        )}
        <figcaption>
          <strong>{caption}</strong>
          <span className="img-cite">{citation}</span>
        </figcaption>
      </figure>

      {open && (
        <div className="lightbox-overlay" onClick={() => setOpen(false)}>
          <div className="lightbox-box" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            <img src={src} alt={alt} className="lightbox-img" />
            {caption && (
              <figcaption className="lightbox-caption">
                <strong>{caption}</strong>
                {citation && <span className="img-cite">{citation}</span>}
              </figcaption>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SectionShell({ id, label, icon, color, children }) {
  return (
    <section id={id} className="section-shell" style={{ "--accent": color }}>
      <div className="section-header" style={{ background: color }}>
        <span className="section-icon">{icon}</span>
        <h2>{label}</h2>
        <span className="section-badge">
          Station {SECTIONS.findIndex((s) => s.id === id) + 1} of 7
        </span>
      </div>
      <div className="section-body">{children}</div>
      {id !== "s7" && <div className="section-arrow-down"></div>}
    </section>
  );
}

/* ─── SECTION 1: Entrance Hall ────────────────p��────────────── */
function EntranceHall() {
  const [hovered, setHovered] = useState(null);
  const stats = [
    {
      value: "3M+",
      label: "Americans affected by OUD",
      detail:
        "Opioid Use Disorder impacts over 3 million people in the U.S. alone, representing a national public health emergency.",
    },
    {
      value: "80,000+",
      label: "Overdose deaths per year (U.S.)",
      detail:
        "Synthetic opioids like fentanyl account for the majority of overdose fatalities, underscoring the urgency of this research.",
    },
    {
      value: "30–50%",
      label: "Of clinical drugs metabolized by CYP3A4",
      detail:
        "The CYP3A4 enzyme alone processes nearly half of all medications used in medicine, including most opioids.",
    },
    {
      value: "83%",
      label: "Gene sequence homology: CYP3A4 vs CYP3A5",
      detail:
        "CYP3A4 and CYP3A5 share 83% sequence homology, meaning genetic differences between them can still significantly alter drug metabolism.",
    },
  ];
  return (
    <SectionShell id="s1" label="Entrance Hall" icon="🏛️" color="#1e3a5f">
      <div className="subsection">
        <h3></h3>
        <h3>Welcome to the Research Facility</h3>
        <p>This facility explores one of biology's most pressing questions:</p>
        <blockquote className="research-question">
          "How do genetic variations in drug-metabolizing enzymes and
          neurobiological alterations contribute to individual differences in
          opioid dependency risk?"
        </blockquote>
        <p>
          Follow the arrow path through seven stations, each dedicated to a
          different facet of Opioid Use Disorder (OUD). There are many interactive elements for you, and you may also click images to enlarge them.
        </p>
      </div>

      <div className="subsection">
        <h3>The Opioid Crisis at a Glance</h3>
        <p>Hover over each stat card to learn more.</p>
        <div className="stat-grid">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`stat-card ${hovered === i ? "hovered" : ""}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              {hovered === i && <div className="stat-detail">{s.detail}</div>}
            </div>
          ))}
        </div>
        <p className="cite-inline">
          Statistics adapted from: Carmen et al. (2024); Zhang et al. (2024);
          CDC Opioid Overdose Data.
        </p>
      </div>

      <div className="subsection">
        <h3>Cross-Disciplinary Overview</h3>
        <div className="disc-grid">
          <div className="disc-card bio">
            <h4>🔬 Biology</h4>
            <p>
              CYP3A4/5 enzyme genetics and opioid pharmacokinetics drive
              individual metabolism rates and dependency risk.
            </p>
          </div>
          <div className="disc-card psych">
            <h4>🧠 Psychology</h4>
            <p>
              Behavioral shifts, reward dysregulation, and structural brain
              changes explain why addiction becomes compulsive and habitual.
            </p>
          </div>
          <div className="disc-card ethics">
            <h4>⚖️ Ethics</h4>
            <p>
              Genetic screening for OUD risk raises questions about privacy,
              equity, and the limits of predicting human behavior.
            </p>
          </div>
        </div>
      </div>

      <div className="subsection">
        <h3>Your Research Path</h3>
        <p>
          The arrows below guide you from the entrance through all seven
          stations. Each section builds on the last.
        </p>
        <div className="path-preview">
          {SECTIONS.map((s, i) => (
            <span key={s.id} className="path-preview-item">
              <a
                href={`#${s.id}`}
                className="path-link"
                style={{ background: s.color }}
              >
                {s.icon} {s.label}
              </a>
              {i < SECTIONS.length - 1 && <span className="path-arrow">→</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="subsection">
        <h3>About This Paper</h3>
        <p>
          Written by Aditya Dash, Rhea Gadi, and Rylan M. Oglesbee at Innovation
          Academy for AP Biology (Dr. Ginny Berkemeier), March 2026.
        </p>
        <p>
          The paper synthesizes peer-reviewed literature published since 2019 on
          opioid dependency from genetic, neurobiological, and pharmacological
          perspectives.
        </p>
        <div style={{ marginTop: "1.2rem" }}>
          <a
            href="/research-paper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="paper-pdf-btn"
          >
            📄 View Full Research Paper (PDF)
          </a>
        </div>
      </div>
    </SectionShell>
  );
}

/* ─── SECTION 2: Genetics Lab ───────────────────────────────── */
function GeneticsLab() {
  const [selected, setSelected] = useState(null);
  const variants = [
    {
      id: "cyp3a4",
      name: "CYP3A4",
      tag: "Chromosome 7",
      desc: "Responsible for metabolizing 30–50% of all clinical drugs. Has a large, flexible active site that binds a wide variety of opioids including fentanyl, hydrocodone, methadone, and oxycodone.",
    },
    {
      id: "cyp3a5",
      name: "CYP3A5",
      tag: "Chromosome 7 (83% homology)",
      desc: "Shares 83% sequence homology with CYP3A4. Has a narrower active site, giving it higher substrate selectivity. Its contribution to oxycodone metabolism compared to CYP3A4 is still being studied.",
    },
  ];
  return (
    <SectionShell id="s2" label="Genetics Lab" icon="🧬" color="#1a4d3a">
      <div className="subsection">
        <h3></h3>
        <h3>The CYP3A Gene Family</h3>
        <p>
          Members of the{" "}
          <Tooltip text="Cytochrome P450, family 3, subfamily A — a group of enzymes on chromosome 7 critical for drug metabolism">
            CYP3A gene family
          </Tooltip>{" "}
          are located on <strong>chromosome 7</strong> and play a central role
          in Opioid Use Disorder.
        </p>
        <p>
          Both CYP3A4 and CYP3A5 are enzymes that break down drugs in the body —
          a process called{" "}
          <Tooltip text="The chemical transformation of a drug within the body, typically to a form that can be eliminated">
            drug metabolism
          </Tooltip>
          .
        </p>
      </div>

      <div className="subsection">
        <h3>Click an Enzyme to Explore</h3>
        <div className="enzyme-selector">
          {variants.map((v) => (
            <button
              key={v.id}
              className={`enzyme-btn ${selected === v.id ? "active" : ""}`}
              onClick={() => setSelected(selected === v.id ? null : v.id)}
            >
              {v.name} <span className="enzyme-tag">{v.tag}</span>
            </button>
          ))}
        </div>
        {selected && (
          <div className="enzyme-detail">
            <h4>{variants.find((v) => v.id === selected)?.name}</h4>
            <p>{variants.find((v) => v.id === selected)?.desc}</p>
          </div>
        )}
      </div>

      <div className="subsection img-subsection">
        <div>
          <h3>Chromosome 7 & Gene Location</h3>
          <p>
            Both CYP3A4 and CYP3A5 are located on chromosome 7, in the 7q22.1
            region. This chromosome carries many genes involved in drug
            metabolism.
          </p>
          <p>
            The position of these genes on chromosome 7 means that{" "}
            <Tooltip text="Small nucleotide substitutions in the gene sequence that can alter enzyme function">
              SNPs
            </Tooltip>{" "}
            in this region directly affect how a person metabolizes drugs
            throughout their entire life; polymorphisms tend to result in the
            change in structure of the CYP3A4/5 enzymes which metabolize
            opioids, resulting in the change in the rate of metabolism of
            opioids.
          </p>
        </div>
        <ImageCard
          src="https://www.mdpi.com/biomedicines/biomedicines-08-00094/article_deploy/html/images/biomedicines-08-00094-g002.png"
          alt="Human chromosome 7 diagram"
          caption="Human Chromosome 7"
          citation="(Saiz-Rodríguez et al., 2020)"
          fallback="Chromosome 7 Diagram — CYP3A4/5 located at 7q22.1"
        />
      </div>

      <div className="subsection img-subsection">
        <ImageCard
          src="https://media.springernature.com/lw685/springer-static/image/art%3A10.1038%2Fs41467-025-58749-8/MediaObjects/41467_2025_58749_Fig8_HTML.png"
          alt="CYP3A4/5 enzyme 3D protein structure"
          caption="CYP3A4/5 Protein Structure"
          citation="(Wang et al., 2025)"
          fallback="CYP3A4 3D Protein Structure — Showing large active site cavity capable of binding multiple substrates"
        />
        <div>
          <h3>CYP3A4 Enzyme Structure</h3>
          <p>
            CYP3A4 is a member of the{" "}
            <Tooltip text="A superfamily of monooxygenase enzymes found throughout the body, primarily in the liver">
              cytochrome P450 superfamily
            </Tooltip>
            . Its notably large and flexible active site allows it to bind to
            many different substrates.
          </p>
          <p>
            This structural flexibility explains why CYP3A4 alone can metabolize
            30–50% of clinically used drugs (Zhang et al., 2024).
          </p>
        </div>
      </div>

      <div className="subsection">
        <h3>Opioids Metabolized by CYP3A4/5</h3>
        <div className="opioid-grid">
          {[
            {
              name: "Fentanyl",
              note: "Mainly metabolized by CYP3A4 → norfentanyl (inactive metabolite)",
            },
            {
              name: "Hydrocodone",
              note: "Metabolized by CYP3A4; can convert to hydromorphone",
            },
            {
              name: "Oxycodone",
              note: "CYP3A4 role vs CYP3A5 still under investigation",
            },
            {
              name: "Methadone",
              note: "CYP3A4-dependent; critical for OUD treatment",
            },
          ].map((d) => (
            <div key={d.name} className="opioid-card">
              <div className="opioid-name">{d.name}</div>
              <div className="opioid-note">{d.note}</div>
            </div>
          ))}
        </div>
        <p className="cite-inline">
          Source: Aapro et al. (2024); Coates & Lazarus (2023).
        </p>
      </div>

      <div className="subsection">
        <h3>Biology ↔ Psychology Connection</h3>
        <p>
          The genetic makeup of CYP3A4/5 determines how quickly a person breaks
          down opioids — this directly shapes the psychological experience of
          the drug's effects.
        </p>
        <p>
          Fast metabolizers may feel opioids wear off sooner, increasing the
          psychological craving for another dose and raising OUD risk.
        </p>
      </div>
    </SectionShell>
  );
}

/* ─── SECTION 3: Biochemistry Station ───────────────────────── */
const SNP_CARDS = [
  {
    id: "fast",
    label: "Fast Metabolizer",
    subtitle: "e.g. CYP3A4*18A",
    color: "#e74c3c",
  },
  {
    id: "slow",
    label: "Slow Metabolizer",
    subtitle: "Loss-of-function variant",
    color: "#e67e22",
  },
  {
    id: "nonfunc",
    label: "Non-functional Variant",
    subtitle: "e.g. CYP3A5*3",
    color: "#7f8c8d",
  },
];
const SNP_EFFECTS = [
  {
    id: "fast",
    label: "Higher OUD Risk (drug wears off quickly → more needed)",
    match: "fast",
  },
  {
    id: "slow",
    label: "Drug Toxicity (opioid stays in body too long)",
    match: "slow",
  },
  {
    id: "nonfunc",
    label: "Minimal inhibitor/inducer response (metabolism largely unchanged)",
    match: "nonfunc",
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function BiochemistryStation() {
  const [dragging, setDragging] = useState(null);
  const [matches, setMatches] = useState({});
  const [checked, setChecked] = useState(false);
  const [shuffledCards] = useState(() => shuffle(SNP_CARDS));
  const [shuffledEffects] = useState(() => shuffle(SNP_EFFECTS));

  const handleDragStart = (id) => setDragging(id);
  const handleDrop = (effectId) => {
    if (dragging) {
      setMatches((m) => ({ ...m, [effectId]: dragging }));
      setDragging(null);
    }
  };
  const allMatched = shuffledEffects.every((e) => matches[e.id]);
  const correctCount = shuffledEffects.filter(
    (e) => matches[e.id] === e.match,
  ).length;

  const [metRate, setMetRate] = useState(50);
  const metLabel =
    metRate < 30
      ? "Slow Metabolizer — drug stays longer, risk of toxicity"
      : metRate > 70
        ? "Fast Metabolizer — drug clears quickly, higher OUD risk"
        : "Normal Metabolizer — balanced drug clearance";
  const metColor =
    metRate < 30 ? "#e67e22" : metRate > 70 ? "#e74c3c" : "#2ecc71";

  return (
    <SectionShell
      id="s3"
      label="Biochemistry Station"
      icon="⚗️"
      color="#4a2060"
    >
      <div className="subsection">
        <h3></h3>
        <h3>What Are SNPs?</h3>
        <p>
          A{" "}
          <Tooltip text="Single Nucleotide Polymorphism — a single base-pair change in a gene sequence that can alter the protein produced">
            SNP (single nucleotide polymorphism)
          </Tooltip>{" "}
          is a one-letter change in a DNA sequence that can dramatically alter
          enzyme function.
        </p>
        <p>
          In the CYP3A4 and CYP3A5 genes, SNPs can speed up, slow down, or
          eliminate enzyme activity — directly changing how the body handles
          opioids.
        </p>
      </div>

      <div className="subsection img-subsection">
        <ImageCard
          src="https://blog.bccresearch.com/hubfs/Single-Nucleotide-Polymorphism.webp"
          alt="Diagram showing a single nucleotide polymorphism in DNA"
          caption="Single Nucleotide Polymorphism (SNP)"
          citation="(Rawat, 2024)"
          fallback="SNP Diagram — one nucleotide substitution changes the entire downstream protein"
        />
        <div>
          <h3>How SNPs Alter Enzyme Activity</h3>
          <p>
            Even a single nucleotide substitution in CYP3A4 or CYP3A5 can change
            the enzyme's shape, altering how fast or slow it works.
          </p>
          <p>
            <strong>CYP3A4*18A</strong> — an increased-activity variant — causes
            opioids to be metabolized faster, which can increase dependency risk
            (Zhang et al., 2024).
          </p>
          <p>
            Loss-of-function variants cause opioids to remain in the body
            longer, increasing the risk of toxicity and side effects.
          </p>
        </div>
      </div>

      <div className="subsection">
        <h3>🎯 Drag-and-Drop SNP Matcher</h3>
        <p>
          Drag each SNP type to its matching clinical effect. Then click "Check
          Answers."
        </p>
        <div className="dnd-container">
          <div className="dnd-sources">
            <h4>SNP Types (drag these)</h4>
            {shuffledCards.filter(
              (c) => !Object.values(matches).includes(c.id),
            ).map((c) => (
              <div
                key={c.id}
                className="dnd-card"
                draggable
                onDragStart={() => handleDragStart(c.id)}
                style={{ borderColor: c.color }}
              >
                <strong style={{ color: c.color }}>{c.label}</strong>
                <span>{c.subtitle}</span>
              </div>
            ))}
            {shuffledCards.every((c) => Object.values(matches).includes(c.id)) && (
              <div className="dnd-card empty">All SNPs placed!</div>
            )}
          </div>
          <div className="dnd-targets">
            <h4>Clinical Effects (drop here)</h4>
            {shuffledEffects.map((e) => (
              <div
                key={e.id}
                className={`dnd-target ${matches[e.id] ? "filled" : ""}`}
                onDragOver={(ev) => ev.preventDefault()}
                onDrop={() => handleDrop(e.id)}
                onClick={() =>
                  matches[e.id] &&
                  setMatches((m) => {
                    const n = { ...m };
                    delete n[e.id];
                    return n;
                  })
                }
              >
                {matches[e.id] ? (
                  <>
                    <strong
                      style={{
                        color: shuffledCards.find((c) => c.id === matches[e.id])
                          ?.color,
                      }}
                    >
                      {shuffledCards.find((c) => c.id === matches[e.id])?.label}
                    </strong>{" "}
                    → {e.label}
                  </>
                ) : (
                  <span className="dnd-hint">{e.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        {allMatched && (
          <div className="dnd-result">
            <button className="check-btn" onClick={() => setChecked(true)}>
              Check Answers
            </button>
            {checked && (
              <div
                className={`result-box ${correctCount === 3 ? "correct" : "partial"}`}
              >
                {correctCount === 3
                  ? "✅ Perfect! All three SNP types correctly matched!"
                  : `⚠️ ${correctCount}/3 correct. Click any target to remove and retry.`}
                <button
                  className="reset-btn"
                  onClick={() => {
                    setMatches({});
                    setChecked(false);
                  }}
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        )}
        <p className="cite-inline">
          Based on: Zhang et al. (2024); Coates & Lazarus (2023); Wright et al.
          (2019).
        </p>
      </div>

      <div className="subsection">
        <h3>🎚️ Metabolism Rate Slider</h3>
        <p>
          Adjust the slider to see how metabolism rate affects OUD risk — watch
          the live animation below.
        </p>
        <div className="slider-section">
          <div className="slider-labels">
            <span>Slow (Loss-of-function)</span>
            <span>Normal</span>
            <span>Fast (Gain-of-function)</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={metRate}
            onChange={(e) => setMetRate(Number(e.target.value))}
            className="met-slider"
          />
          <MetabolismAnimation rate={metRate} />
          <div
            className="met-result"
            style={{ color: metColor, borderColor: metColor }}
          >
            <strong>{metLabel}</strong>
            <p className="met-desc">
              {metRate < 30
                ? "Loss-of-function variants like CYP3A5*3 reduce enzyme efficiency. Opioids accumulate (high drug level bar) and fewer molecules are metabolized — increasing toxicity risk."
                : metRate > 70
                  ? "Gain-of-function variants like CYP3A4*18A clear drugs quickly. Molecules move fast and are metabolized rapidly — the pain-relieving effect fades, prompting more frequent dosing."
                  : "Standard CYP3A4/5 activity provides balanced drug clearance. Molecules move at moderate speed with balanced enzyme interception."}
            </p>
          </div>
        </div>
        <p className="cite-inline">
          Source: Zhang et al. (2024); Coates & Lazarus (2023).
        </p>
      </div>

      <div className="subsection img-subsection">
        <div>
          <h3>Fentanyl — A Case Study in CYP3A4 Metabolism</h3>
          <p>
            Fentanyl is one of the most potent and dangerous opioids,
            responsible for the majority of overdose deaths.
          </p>
          <p>
            It is <strong>primarily metabolized by CYP3A4</strong> into an
            inactive product called norfentanyl (Aapro et al., 2024).
          </p>
          <p>
            In fast CYP3A4 metabolizers, fentanyl clears the body rapidly, which
            can lead individuals to use higher or more frequent doses — a key
            pathway to dependency.
          </p>
        </div>
        <ImageCard
          src="https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=3345&t=l"
          alt="Chemical structure of fentanyl"
          caption="Chemical Structure of Fentanyl"
          citation="(PubChem, 2019a)"
          fallback="Fentanyl — C₂₂H₂₈N₂O — metabolized by CYP3A4 to norfentanyl"
        />
      </div>

      <div className="subsection img-subsection">
        <ImageCard
          src="https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=5284603&t=l"
          alt="Chemical structure of oxycodone"
          caption="Chemical Structure of Oxycodone"
          citation="(PubChem, 2019b)"
          fallback="Oxycodone — C₁₈H₂₁NO₄ — metabolized by both CYP3A4 and CYP3A5"
        />
        <div>
          <h3>Oxycodone Metabolism</h3>
          <p>
            Oxycodone metabolism by CYP3A5 relative to CYP3A4 is still being
            investigated.
          </p>
          <p>
            Because CYP3A4 and CYP3A5 share 83% sequence homology, they often
            metabolize the same substrates — but with different efficiencies
            depending on the individual's genotype (Coates & Lazarus, 2023).
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

/* ─── SECTION 4: Neuroscience Chamber ──────────────────────── */
const BRAIN_REGIONS = [
  {
    id: "vta",
    label: "VTA",
    cx: 52,
    cy: 68,
    r: 9,
    desc: "Ventral Tegmental Area — dopamine-producing neurons originate here. Opioids suppress inhibitory neurons in the VTA, causing a surge of dopamine release.",
  },
  {
    id: "nac",
    label: "NAc",
    cx: 38,
    cy: 42,
    r: 9,
    desc: 'Nucleus Accumbens — the brain\'s "reward center." Dopamine floods here when opioids are used, creating intense feelings of euphoria and reinforcing the behavior.',
  },
  {
    id: "pfc",
    label: "PFC",
    cx: 18,
    cy: 25,
    r: 9,
    desc: "Prefrontal Cortex — responsible for impulse control and decision-making. Chronic opioid use reduces gray matter volume here, physically impairing the ability to resist drug use (Brick et al., 2019).",
  },
  {
    id: "dstr",
    label: "DS",
    cx: 52,
    cy: 42,
    r: 9,
    desc: "Dorsal Striatum — controls habit and compulsive behavior. Addiction shifts behavioral control from the goal-oriented ventral striatum to this region, making drug use feel automatic (Wright et al., 2019).",
  },
];
const QUIZ_QUESTIONS = [
  {
    q: 'What neurotransmitter is primarily responsible for the euphoric "rush" caused by opioids?',
    opts: ["Serotonin", "Dopamine", "GABA", "Glutamate"],
    ans: 1,
    exp: "Dopamine is released in the nucleus accumbens when opioids bind to mu receptors, creating euphoria and reinforcing drug-seeking behavior (Carmen et al., 2024).",
  },
  {
    q: "What happens to dopamine D2 receptors with chronic opioid exposure?",
    opts: [
      "They multiply rapidly",
      "They become hypersensitive",
      "They undergo dysregulation, requiring higher doses",
      "They are permanently destroyed",
    ],
    ans: 2,
    exp: "Chronic opioid exposure causes D2 receptor dysregulation, meaning more opioid is needed to produce the same dopamine response — a hallmark of tolerance (Brick et al., 2019).",
  },
  {
    q: "When opioid use suddenly stops, what happens to the GABA and glutamate systems?",
    opts: [
      "They shut down completely",
      "They become hyperactive, causing withdrawal",
      "They rebalance immediately",
      "They have no reaction",
    ],
    ans: 1,
    exp: "Opioids suppress GABA and glutamate signaling. When opioids are removed, these systems rebound and become hyperactive, producing severe withdrawal symptoms (Carmen et al., 2024).",
  },
  {
    q: "Which psychological concept explains why addiction feels automatic and compulsive?",
    opts: [
      "Cognitive dissonance",
      "Behavioral control shifting to the dorsal striatum",
      "Prefrontal cortex hyperactivity",
      "Increased VTA dopamine production",
    ],
    ans: 1,
    exp: "Addiction shifts control from the goal-directed ventral striatum to the habit-forming dorsal striatum, making drug use feel impulsive and automatic rather than a conscious choice (Wright et al., 2019).",
  },
];

function NeuroscienceChamber() {
  const [activeRegion, setActiveRegion] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleAnswer = (qi, ai) => {
    if (!quizSubmitted) setQuizAnswers((prev) => ({ ...prev, [qi]: ai }));
  };
  const score = QUIZ_QUESTIONS.filter(
    (q, i) => quizAnswers[i] === q.ans,
  ).length;

  return (
    <SectionShell
      id="s4"
      label="Neuroscience Chamber"
      icon="🧠"
      color="#5a1a1a"
    >
      <div className="subsection">
        <h3></h3>
        <h3>The Dopaminergic System & Addiction</h3>
        <p>
          Opioids trigger the release of{" "}
          <Tooltip text="A neurotransmitter central to reward, motivation, and pleasure — flooding the nucleus accumbens during opioid use">
            dopamine
          </Tooltip>{" "}
          in the nucleus accumbens by binding to{" "}
          <Tooltip text="A type of opioid receptor (μ-opioid receptor) that mediates pain relief, euphoria, and addiction">
            mu (μ) receptors
          </Tooltip>
          .
        </p>
        <p>
          Chronic opioid use causes{" "}
          <Tooltip text="D2 receptors become desensitized, requiring progressively higher opioid doses to achieve the same dopamine effect">
            dopamine D2 receptor dysregulation
          </Tooltip>
          , forcing users to increase doses to feel the same effect (Brick et
          al., 2019).
        </p>
      </div>

      <div className="subsection img-subsection">
        <ImageCard
          src="https://www.ncbi.nlm.nih.gov/books/NBK595465/bin/503777_1_En_1_Fig3_HTML.jpg"
          alt="Diagram of dopamine pathways in the human brain"
          caption="Dopamine Pathways in the Human Brain"
          citation="(Nummenmaa et al., 2022)"
          fallback="Dopamine Pathways — Mesolimbic (VTA→NAc), Mesocortical (VTA→PFC), and Nigrostriatal pathways"
        />
        <div>
          <h3>Dopamine Pathway Overview</h3>
          <li>
            <p>
              The <strong>mesolimbic pathway</strong> (VTA → Nucleus Accumbens)
              is the primary reward circuit activated by opioids.
            </p>
          </li>
          <li>
            <p>
              The <strong>mesocortical pathway</strong> (VTA → Prefrontal
              Cortex) governs impulse control. Opioids damage this pathway over
              time, weakening the ability to resist use.
            </p>
          </li>
          <li>
            <p>
              The <strong>nigrostriatal pathway</strong> connects to the
              striatum, influencing habitual and compulsive behavior central to
              addiction.
            </p>
          </li>
        </div>
      </div>

      <div className="subsection">
        <h3>🧠 Brain Map — Drag to Rotate · Click to Explore</h3>
        <p>
          Drag the brain model left and right to rotate it in 3D, then click a
          labeled region to learn what opioids do there.
        </p>
        <div className="brain-container">
          <RotatableBrain
            activeRegion={activeRegion}
            setActiveRegion={setActiveRegion}
            regions={BRAIN_REGIONS}
          />
          <div className="brain-info">
            {activeRegion ? (
              <>
                <h4>
                  {BRAIN_REGIONS.find((r) => r.id === activeRegion)?.label}
                </h4>
                <p>{BRAIN_REGIONS.find((r) => r.id === activeRegion)?.desc}</p>
              </>
            ) : (
              <p className="brain-hint">
                Drag the brain to rotate it, then click a region (VTA, NAc, PFC,
                DS) to see what opioids do there.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="subsection img-subsection">
        <div>
          <h3>Beyond Dopamine: GABA & Glutamate</h3>
          <p>
            Opioids suppress both{" "}
            <Tooltip text="The brain's main inhibitory neurotransmitter — opioids suppress GABA, which temporarily increases dopamine release">
              GABA (inhibitory)
            </Tooltip>{" "}
            and{" "}
            <Tooltip text="The brain's main excitatory neurotransmitter — opioids also reduce glutamate signaling">
              glutamate (excitatory)
            </Tooltip>{" "}
            signaling.
          </p>
          <p>
            The brain compensates by upregulating receptors for both. When
            opioid use stops, both systems become <strong>hyperactive</strong> —
            producing severe withdrawal symptoms (Carmen et al., 2024).
          </p>
        </div>
        <ImageCard
          src="https://macbrs.org/wp-content/uploads/2022/05/graphic_the-dopamine-drive.png"
          alt="Diagram of mesolimbic reward pathway"
          caption="Mesolimbic Reward Pathway"
          citation="(The Dopamine Drive: Mesolimbic Reward Pathway, 2022)"
          fallback="Mesolimbic Pathway — VTA to Nucleus Accumbens, the core reward circuit activated by opioids"
        />
      </div>

      <div className="subsection">
        <h3>Brain Structural Changes</h3>
        <div className="two-col">
          <Accordion
            title="Prefrontal Cortex Gray Matter Loss"
            accent="#e74c3c"
          >
            <p>
              Chronic opioid use reduces gray matter volume in the prefrontal
              cortex (Brick et al., 2019).
            </p>
            <p>
              This physically depletes the neural substrate responsible for
              impulse control, decision-making, and resisting drug cravings.
            </p>
            <p className="cite-inline">
              Biology ↔ Psychology Link: Structural brain damage directly
              impairs psychological self-regulation.
            </p>
          </Accordion>
          <Accordion title="Ventral to Dorsal Striatum Shift" accent="#e67e22">
            <p>
              Behavioral control shifts from the ventral striatum
              (goal-oriented) to the dorsolateral striatum (habit-driven) in
              opioid-dependent individuals (Wright et al., 2019).
            </p>
            <p>
              This shift explains why addiction becomes compulsive — the
              behavior is no longer a choice but a deeply ingrained habit.
            </p>
            <p className="cite-inline">
              Biology ↔ Psychology Link: Neural pathway changes physically
              embed compulsive behavior patterns.
            </p>
          </Accordion>
          <Accordion title="Endogenous Opioid Suppression" accent="#9b59b6">
            <p>
              Chronic exogenous opioid use suppresses the body's natural opioid
              production and downregulates opioid receptors (Freiermuth et al.,
              2023).
            </p>
            <p>
              When external opioids are removed, the body's pain-regulating
              ability is compromised, driving continued use.
            </p>
          </Accordion>
        </div>
      </div>

      <div className="subsection">
        <h3>🧪 Neuroscience Quiz</h3>
        <p>
          Test your understanding of the neurobiological mechanisms of opioid
          addiction.
        </p>
        <div className="quiz-container">
          {QUIZ_QUESTIONS.map((q, qi) => (
            <div key={qi} className="quiz-question">
              <p className="q-text">
                <strong>Q{qi + 1}.</strong> {q.q}
              </p>
              <div className="q-opts">
                {q.opts.map((opt, ai) => {
                  let cls = "q-opt";
                  if (quizSubmitted) {
                    if (ai === q.ans) cls += " correct";
                    else if (quizAnswers[qi] === ai) cls += " wrong";
                  } else if (quizAnswers[qi] === ai) cls += " selected";
                  return (
                    <button
                      key={ai}
                      className={cls}
                      onClick={() => handleAnswer(qi, ai)}
                      disabled={quizSubmitted}
                    >
                      {String.fromCharCode(65 + ai)}. {opt}
                    </button>
                  );
                })}
              </div>
              {quizSubmitted && <p className="q-exp">{q.exp}</p>}
            </div>
          ))}
          <div className="quiz-controls">
            {!quizSubmitted ? (
              <button
                className="check-btn"
                onClick={() => setQuizSubmitted(true)}
                disabled={
                  Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length
                }
              >
                Submit Quiz ({Object.keys(quizAnswers).length}/
                {QUIZ_QUESTIONS.length} answered)
              </button>
            ) : (
              <div className="quiz-score">
                <strong>
                  Score: {score}/{QUIZ_QUESTIONS.length}
                </strong>
                {score === QUIZ_QUESTIONS.length
                  ? " 🏆 Excellent!"
                  : score >= 2
                    ? " 👍 Good work!"
                    : " 📖 Review the section above."}
                <button
                  className="reset-btn"
                  onClick={() => {
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                >
                  Retake
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

/* ─── SECTION 5: Pharmacology Wing ─────────────────────────── */
const PHARMA_TABS = [
  "CYP3A4 Modulators",
  "CYP3A5 Modulators",
  "The P450 Cycle",
];
function PharmacologyWing() {
  const [tab, setTab] = useState(0);

  return (
    <SectionShell id="s5" label="Pharmacology Wing" icon="💊" color="#1a3a5a">
      <div className="subsection">
        <h3></h3>
        <h3>Inducers and Inhibitors</h3>
        <p>
          <Tooltip text="Molecules that decrease enzyme expression or activity, slowing drug metabolism and increasing drug retention time">
            Inhibitors
          </Tooltip>{" "}
          slow down CYP3A4/5 enzymes, causing drugs to linger in the body longer
          — raising toxicity risk.
        </p>
        <p>
          <Tooltip text="Molecules that increase enzyme expression or activity, speeding up drug metabolism and reducing drug effectiveness">
            Inducers
          </Tooltip>{" "}
          accelerate enzyme activity, clearing drugs faster — which can reduce
          drug effectiveness and push toward higher doses.
        </p>
        <p>
          Both types of molecules are used therapeutically to manage how opioids
          affect the body (Zhang et al., 2024).
        </p>
      </div>

      <div className="subsection">
        <h3>📋 Explore Modulators - Click to Expand</h3>
        <div className="tabs">
          {PHARMA_TABS.map((t, i) => (
            <button
              key={i}
              className={`tab-btn ${tab === i ? "active" : ""}`}
              onClick={() => setTab(i)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="tab-content">
          {tab === 0 && (
            <div>
              <h4>CYP3A4 Inhibitors</h4>
              <div className="pharma-grid">
                <div className="pharma-card inhibitor">
                  <h5>Strong Inhibitors</h5>
                  <ul>
                    <li>Clarithromycin</li>
                    <li>Telithromycin</li>
                    <li>Nefazodone</li>
                  </ul>
                  <p>
                    Dramatically increase substrate (opioid) levels, raising
                    toxicity risk significantly (Freiermuth et al., 2023).
                  </p>
                </div>
                <div className="pharma-card inhibitor mild">
                  <h5>Moderate Inhibitors</h5>
                  <ul>
                    <li>Amiodarone</li>
                    <li>Diltiazem</li>
                    <li>Verapamil</li>
                  </ul>
                  <p>
                    Moderate effect on drug toxicity levels; require careful
                    monitoring when co-prescribed with opioids (Freiermuth et
                    al., 2023).
                  </p>
                </div>
              </div>
              <h4>CYP3A4 Inducers</h4>
              <div className="pharma-grid">
                <div className="pharma-card inducer">
                  <h5>Strong Inducers</h5>
                  <ul>
                    <li>Rifampin</li>
                    <li>Phenytoin</li>
                    <li>Primidone</li>
                  </ul>
                  <p>
                    Decrease substrate levels and toxicity. May require higher
                    opioid doses — increasing dependency potential (Coates &
                    Lazarus, 2023).
                  </p>
                </div>
              </div>
            </div>
          )}
          {tab === 1 && (
            <div>
              <h4>CYP3A5 Inhibitors</h4>
              <div className="pharma-grid">
                <div className="pharma-card inhibitor">
                  <h5>Functional Variants</h5>
                  <ul>
                    <li>Ketoconazole</li>
                    <li>Itraconazole</li>
                    <li>Voriconazole</li>
                  </ul>
                  <p>
                    Slow metabolism in functional CYP3A5 variants, increasing
                    opioid retention (Coates & Lazarus, 2023).
                  </p>
                </div>
                <div className="pharma-card neutral">
                  <h5>Non-Functional Variants (e.g. CYP3A5*3)</h5>
                  <p>
                    Inhibitors and inducers have little to no effect on
                    non-functional CYP3A5 variants (Wright et al., 2019).
                  </p>
                  <p>
                    This means non-functional variants already reduce opioid
                    metabolism, and cannot be further slowed by inhibitors.
                  </p>
                </div>
              </div>
              <h4>CYP3A5 Inducers</h4>
              <div className="pharma-grid">
                <div className="pharma-card inducer">
                  <h5>Anticonvulsants (for functional variants)</h5>
                  <ul>
                    <li>Carbamazepine</li>
                    <li>Phenobarbital</li>
                    <li>Phenytoin</li>
                  </ul>
                  <p>
                    Speed up opioid metabolism in functional CYP3A5 variants;
                    have minimal effect on non-functional variants (Coates &
                    Lazarus, 2023).
                  </p>
                </div>
              </div>
            </div>
          )}
          {tab === 2 && (
            <div className="tab-p450">
              <ImageCard
                src="https://media.springernature.com/lw685/springer-static/image/chp%3A10.1007%2F978-3-030-51519-5_65-1/MediaObjects/492821_0_En_65-1_Fig2_HTML.png"
                alt="The cytochrome P450 enzymatic cycle"
                caption="The Cytochrome P450 (CYP) Enzymatic Cycle"
                citation="(Talevi & Bellera, 2021)"
                fallback="Cytochrome P450 Cycle: Drug binds → Electrons transferred → Oxygen inserted → Metabolite released"
              />
              <div>
                <h4>How CYP Enzymes Work</h4>
                <p>
                  CYP enzymes like CYP3A4 oxidize drug molecules using a heme
                  iron center and molecular oxygen.
                </p>
                <p>
                  The drug (substrate) binds the active site → electrons are
                  transferred from NADPH → oxygen is inserted into the drug →
                  the modified (metabolized) drug is released.
                </p>
                <p>
                  Inhibitors block this cycle; inducers amplify it — both
                  strategies alter how long opioids remain active in the body.
                </p>
              </div>
            </div>
          )}
        </div>
        <p className="cite-inline">
          Sources: Freiermuth et al. (2023); Coates & Lazarus (2023); Zhang et
          al. (2024); Wright et al. (2019).
        </p>
      </div>

      <div className="subsection">
        <h3>Clinical Implications</h3>
        <p>
          Understanding which drugs induce or inhibit CYP3A4/5 is critical when
          prescribing opioids alongside other medications.
        </p>
        <p>
          Drug-drug interactions involving CYP3A4/5 can rapidly shift a
          patient's opioid exposure from therapeutic to dangerous levels.
        </p>
        <p>
          Pharmacogenomic profiling — identifying a patient's CYP3A4/5 genotype
          before prescribing — enables truly personalized pain management.
        </p>
      </div>

      <div className="subsection">
        <h3>Biology ↔ Psychology Connection</h3>
        <p>
          When inducers accelerate CYP3A4 activity, opioids wear off faster —
          producing psychological craving and withdrawal symptoms sooner.
        </p>
        <p>
          When inhibitors slow metabolism, the prolonged drug effect can
          reinforce the psychological association between the drug and relief,
          deepening dependency.
        </p>
      </div>
    </SectionShell>
  );
}

/* ─── SECTION 6: Clinical Office ───────────────────────────── */
const ORT_ITEMS = [
  { q: "Personal history of substance abuse (alcohol)", points: [0, 3] },
  { q: "Personal history of substance abuse (illegal drugs)", points: [0, 4] },
  { q: "Family history of substance abuse (alcohol)", points: [0, 1] },
  { q: "Family history of substance abuse (illegal drugs)", points: [0, 2] },
  { q: "History of preadolescent sexual abuse", points: [0, 3] },
  {
    q: "Psychological disease (ADD, OCD, bipolar, schizophrenia)",
    points: [0, 2],
  },
  { q: "Depression (history of)", points: [0, 1] },
];
function ClinicalOffice() {
  const [ortAnswers, setOrtAnswers] = useState({});
  const [ortShown, setOrtShown] = useState(false);
  const totalScore = ORT_ITEMS.reduce(
    (sum, item, i) => sum + (ortAnswers[i] ? item.points[1] : 0),
    0,
  );
  const riskLevel =
    totalScore <= 3
      ? {
          label: "Low Risk",
          color: "#27ae60",
          desc: "Opioids may be prescribed with standard monitoring.",
        }
      : totalScore <= 7
        ? {
            label: "Moderate Risk",
            color: "#e67e22",
            desc: "Mild opioids with low doses and increased monitoring recommended. Consider non-opioid alternatives.",
          }
        : {
            label: "High Risk",
            color: "#e74c3c",
            desc: "High likelihood of addiction behaviors. Non-opioid alternatives strongly preferred; if opioids required, use CYP3A4 inducers to accelerate metabolism and reduce toxicity.",
          };

  return (
    <SectionShell id="s6" label="Clinical Office" icon="🩺" color="#1a4a3a">
      <div className="subsection">
        <h3></h3>
        <h3>The Opioid Risk Tool (ORT)</h3>
        <p>
          The{" "}
          <Tooltip text="A validated clinical self-report screening tool used to assess a patient's risk of developing opioid addiction before prescribing pain medications">
            Opioid Risk Tool (ORT)
          </Tooltip>{" "}
          is used by clinicians and pharmacologists to evaluate a patient's risk
          of developing addiction when prescribed opioids for pain management.
        </p>
        <p>
          Scores are interpreted as:{" "}
          <strong style={{ color: "#27ae60" }}>0–3 = Low Risk</strong>,{" "}
          <strong style={{ color: "#e67e22" }}>4–7 = Moderate Risk</strong>,{" "}
          <strong style={{ color: "#e74c3c" }}>≥ 8 = High Risk</strong>.
        </p>
      </div>

      <div className="subsection">
        <h3>🩺 ORT Risk Calculator</h3>
        <p>
          Check all risk factors that apply (this is a simplified educational
          version):
        </p>
        <div className="ort-form">
          {ORT_ITEMS.map((item, i) => (
            <label key={i} className="ort-item">
              <input
                type="checkbox"
                checked={!!ortAnswers[i]}
                onChange={(e) =>
                  setOrtAnswers((prev) => ({ ...prev, [i]: e.target.checked }))
                }
              />
              <span>
                {item.q}{" "}
                <span className="ort-pts">(+{item.points[1]} pts)</span>
              </span>
            </label>
          ))}
          <button
            className="check-btn"
            onClick={() => setOrtShown(true)}
            style={{ marginTop: "1rem" }}
          >
            Calculate My Risk Score
          </button>
        </div>
        {ortShown && (
          <div className="ort-result" style={{ borderColor: riskLevel.color }}>
            <div className="ort-score" style={{ color: riskLevel.color }}>
              Score: {totalScore} — {riskLevel.label}
            </div>
            <p>{riskLevel.desc}</p>
          </div>
        )}
      </div>

      <div className="subsection">
        <h3>Personalized Medicine Based on CYP3A4/5 Genotype</h3>
        <Accordion title="Low Risk Patients (ORT: 0–3)" accent="#27ae60">
          <p>
            For low-risk patients, opioids such as methadone, oxycodone, and
            morphine may be prescribed effectively.
          </p>
          <p>
            Non-opioid medications like acetaminophen and NSAIDs can supplement
            treatment, but opioids are not contraindicated (Wright et al.,
            2019).
          </p>
          <p>
            CYP3A4/5 genotyping can still help optimize dosing to prevent under-
            or over-treatment.
          </p>
        </Accordion>
        <Accordion title="Moderate Risk Patients (ORT: 4–7)" accent="#e67e22">
          <p>
            Mild opioids at low doses are recommended, combined with inducers of
            the functional CYP3A5 variant (e.g., carbamazepine) to accelerate
            metabolism.
          </p>
          <p>
            CYP3A4 activity is left unchanged to prevent opioids from breaking
            down too quickly (Wright et al., 2019).
          </p>
          <p>
            Non-opioid options like muscle relaxants, acetaminophen, and NSAIDs
            (ibuprofen, naproxen) are preferred where possible.
          </p>
        </Accordion>
        <Accordion title="High Risk Patients (ORT: ≥ 8)" accent="#e74c3c">
          <p>
            When non-opioid medications fail, opioids may be used as a last
            resort with strict monitoring.
          </p>
          <p>
            CYP3A4 inducers (rifampin, phenytoin) can be added to increase
            opioid metabolism and decrease toxicity risk.
          </p>
          <p>
            CYP3A5 functional variants are left uninduced to prevent opioids
            from clearing too rapidly from the bloodstream (Wright et al.,
            2019).
          </p>
        </Accordion>
      </div>

      <div className="subsection">
        <h3>Psychology of Treatment</h3>
        <p>
          The ORT includes psychological risk factors — history of depression,
          trauma, and psychiatric conditions — recognizing that addiction is
          never purely biological.
        </p>
        <p>
          Psychological disease like bipolar disorder, OCD, and schizophrenia
          significantly increase OUD risk, requiring integrated mental health
          treatment alongside pharmacological management.
        </p>
        <p>
          Behavioral interventions, counseling, and social support are necessary
          complements to pharmacogenomic approaches.
        </p>
      </div>

      <div className="subsection img-subsection">
        <ImageCard
          src="https://media.springernature.com/lw685/springer-static/image/art%3A10.1038%2Fs41386-021-01153-9/MediaObjects/41386_2021_1153_Fig2_HTML.png"
          alt="Prefrontal cortex highlighted in a lateral view of the human brain"
          caption="Prefrontal Cortex — Impulse Control Center"
          citation="(Ceceli et al., 2021)"
          fallback="Prefrontal Cortex — Gray matter loss here directly reduces ability to resist opioid cravings"
        />
        <div>
          <h3>Biology-Psychology-Ethics Intersection</h3>
          <p>
            Reduced prefrontal cortex volume in opioid-dependent individuals
            (Brick et al., 2019) means the very brain structures needed for
            treatment compliance are damaged.
          </p>
          <p>
            This raises a key psychological question: if addiction physically
            impairs decision-making, to what extent is continued drug use truly
            a "choice"?
          </p>
          <p>
            This neurobiological reality has profound implications for how we
            treat — and judge — people with OUD.
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

/* ─── SECTION 7: Ethics & Citations Hall ────────────────────── */
const PAPER_REFS = [
  "Brick, L. A., Micalizzi, L., Knopik, V. S., & Palmer, R. H. C. (2019). Characterization of DSM-IV Opioid Dependence Among Individuals of European Ancestry. Journal of Studies on Alcohol and Drugs, 80(3), 319–330. https://doi.org/10.15288/jsad.2019.80.319",
  "Carmen, F. P., Romero, M., & Blanco-Gandía, M. Carmen. (2024). Neurobiological theories of addiction: A comprehensive review. Psychoactives, 3, 35–47. https://doi.org/10.3390/psychoactives3010003",
  "Coates, S., & Lazarus, P. (2023). Hydrocodone, oxycodone, and morphine metabolism and drug-drug interactions. Journal of Pharmacology and Experimental Therapeutics, 387(2). https://doi.org/10.1124/jpet.123.001651",
  "Freiermuth, C. E., Kisor, D. F., Lambert, J., Braun, R., Frey, J. A., Bachmann, D. J., Bischof, J. J., Lyons, M. S., Pantalon, M. V., Punches, B. E., Ancona, R., & Sprague, J. E. (2023). Genetic Variants Associated with Opioid Use Disorder. Clinical Pharmacology & Therapeutics. https://doi.org/10.1002/cpt.2864",
  "Matti Aapro, Stefano Fogli, Morlion, B., & Danesi, R. (2024). Opioid metabolism and drug-drug interaction in cancer. The Oncologist, 29(11). https://doi.org/10.1093/oncolo/oyae094",
  "Wright, W. C., Chenge, J., & Chen, T. (2019). Structural perspectives of the CYP3A family and their small molecule modulators in drug metabolism. Liver Research, 3(3), 132–142. https://doi.org/10.1016/j.livres.2019.08.001",
  "Zhang, Y., Wang, Z., Wang, Y., Jin, W., Zhang, Z., Jin, L., Qian, J., & Zheng, L. (2024). CYP3A4 and CYP3A5: the crucial roles in clinical drug metabolism and the significant implications of genetic polymorphisms. PeerJ, 12, e18636–e18636. https://doi.org/10.7717/peerj.18636",
];
const IMAGE_REFS = [
  "Ceceli, A. O., Bradberry, C. W., & Goldstein, R. Z. (2021). The neurobiology of drug addiction: cross-species insights into the dysfunction and recovery of the prefrontal cortex. Neuropsychopharmacology, 47(1). https://doi.org/10.1038/s41386-021-01153-9",
  "Nummenmaa, L., Seppälä, K., & Putkinen, V. (2022, November 29). Fig. 1.3, [Main dopamine pathways in the brain]. Nih.gov; Springer. https://www.ncbi.nlm.nih.gov/books/NBK595465/figure/ch1.Fig3/",
  "PubChem. (2019a). Fentanyl. Nih.gov; PubChem. https://pubchem.ncbi.nlm.nih.gov/compound/Fentanyl",
  "PubChem. (2019b). Oxycodone. Nih.gov; PubChem. https://pubchem.ncbi.nlm.nih.gov/compound/Oxycodone",
  "Rawat, K. (2024, August 30). The Rise of SNP (Single Nucleotide Polymorphism) Genotyping: Driving Global Market Growth at a 21.7% CAGR. Bccresearch.com; BCC Research. https://blog.bccresearch.com/the-rise-of-snp-single-nucleotide-polymorphism-genotyping-driving-global-market-growth-at-a-21.7-cagr",
  "Saiz-Rodríguez, M., Almenara, S., Navares-Gómez, M., Ochoa, D., Román, M., Zubiaur, P., Koller, D., Santos, M., Mejía, G., Borobia, A. M., Rodríguez-Antona, C., & Abad-Santos, F. (2020). Effect of the Most Relevant CYP3A4 and CYP3A5 Polymorphisms on the Pharmacokinetic Parameters of 10 CYP3A Substrates. Biomedicines, 8(4), 94. https://doi.org/10.3390/biomedicines8040094",
  "Talevi, A., & Bellera, C. L. (2021). Cytochrome P450. Springer EBooks, 1–8. https://doi.org/10.1007/978-3-030-51519-5_65-1",
  "The dopamine drive: Mesolimbic reward pathway. (2022, May 16). McMaster Brain Research Society. https://macbrs.org/2022/05/15/the-dopamine-drive-mesolimbic-reward-pathway/",
  "Wang, J., Nithianantham, S., Chai, S. C., Jung, Y.-H., Yang, L., Ong, H. W., Li, Y., Zhang, Y., Miller, D. J., & Chen, T. (2025). Decoding the selective chemical modulation of CYP3A4. Nature Communications, 16(1). https://doi.org/10.1038/s41467-025-58749-8",
];
const ETHICS_POINTS = [
  {
    title: "Privacy & Genetic Data",
    content:
      "Genetic screening for CYP3A4/5 SNPs generates sensitive health data. If genetic risk profiles influence insurance coverage or employment decisions, pharmacogenomics could penalize individuals for their biology — a clear violation of medical ethics.",
    discipline: "Ethics ↔ Biology",
  },
  {
    title: "Health Equity & Population Diversity",
    content:
      "Relevant CYP3A4/5 genetic variations are unevenly distributed across populations (Freiermuth et al., 2023). If pharmacogenomic tools are developed primarily from data on European populations, they may be less accurate — or entirely inapplicable — for patients of African, Asian, or Indigenous descent, exacerbating existing health inequalities.",
    discipline: "Ethics ↔ Biology ↔ Psychology",
  },
  {
    title: "Genetic Determinism vs. Holistic Care",
    content:
      "Genetic predisposition raises OUD risk but does not definitively determine whether a person will develop addiction (Zhang et al., 2024). Environmental, psychological, and social factors all contribute. Treating genetics as destiny dehumanizes patients and ignores the complexity of addiction as a biopsychosocial condition.",
    discipline: "Ethics ↔ Psychology",
  },
  {
    title: 'Stigma and the "Addiction as Choice" Debate',
    content:
      "Neurobiological evidence shows that opioids physically damage the brain's decision-making and impulse-control systems (Brick et al., 2019). Viewing addiction as a moral failing ignores this evidence and harms patients by reducing access to compassionate, effective care.",
    discipline: "Ethics ↔ Psychology ↔ Biology",
  },
  {
    title: "Access to Pharmacogenomic Testing",
    content:
      "Genetic testing is expensive. If pharmacogenomic opioid management becomes standard of care but is only available to wealthy patients, it will widen health disparities rather than narrow them. Ethical implementation requires equitable access.",
    discipline: "Ethics",
  },
];

function EthicsCitationsHall() {
  return (
    <SectionShell
      id="s7"
      label="Ethics & Citations Hall"
      icon="⚖️"
      color="#3a2a0a"
    >
      <div className="subsection">
        <h3></h3>
        <h3>Conclusion</h3>
        <li>
          <p>
            Polymorphisms in CYP3A4 and CYP3A5 directly influence opioid
            metabolism rates, with both rapid-metabolizing and loss-of-function
            variants affecting OUD vulnerability through distinct mechanisms.
          </p>
        </li>
        <li>
          <p>
            These genetic differences interact with neurobiological changes —
            including dopamine dysregulation and compensatory
            GABAergic/glutamatergic adaptations — that progressively deepen
            dependency.
          </p>
        </li>
        <li>
          Pharmacogenomic knowledge enables personalized care strategies, but
          must be implemented alongside ethical safeguards that protect patient
          privacy, equity, and dignity.
        </li>
        <div style={{ marginTop: "1.2rem" }}>
          <a
            href="/research-paper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="paper-pdf-btn"
          >
            📄 View Full Research Paper (PDF)
          </a>
        </div>
      </div>

      <div className="subsection">
        <h3>📋 Research Summary</h3>
        <div className="summary-grid">
          <div className="summary-group">
            <div className="summary-group-title">🧬 Genetics</div>
            <ul className="summary-list">
              <li>
                CYP3A4 metabolizes 30–50% of all clinically used drugs; CYP3A4
                and CYP3A5 share 83% gene sequence homology but differ in
                substrate selectivity.
              </li>
              <li>
                SNPs can increase <em>or</em> decrease enzyme efficiency — both
                extremes raise OUD risk through distinct mechanisms.
              </li>
              <li>
                Gain-of-function variants (e.g., CYP3A4*18A) cause rapid
                clearance and drive frequent dosing; loss-of-function variants
                (e.g., CYP3A5*3) cause drug accumulation and toxicity risk.
              </li>
            </ul>
          </div>
          <div className="summary-group">
            <div className="summary-group-title">🧠 Neurobiology</div>
            <ul className="summary-list">
              <li>
                Opioids trigger dopamine release in the nucleus accumbens via mu
                receptor binding, but chronic use dysregulates D2 receptors,
                requiring ever-higher doses.
              </li>
              <li>
                Suppression of GABA and glutamate causes receptor upregulation,
                producing severe withdrawal when opioids stop and impairing
                natural pain regulation long-term.
              </li>
              <li>
                Gray matter volume in the prefrontal cortex decreases with
                chronic use, and behavioral control shifts from goal-oriented
                (ventral striatum) to compulsive (dorsolateral striatum).
              </li>
            </ul>
          </div>
          <div className="summary-group">
            <div className="summary-group-title">
              💊 Pharmacology & Clinical
            </div>
            <ul className="summary-list">
              <li>
                CYP3A4 inhibitors (e.g., clarithromycin) slow metabolism and
                raise toxicity risk, while inducers (e.g., rifampin) speed
                clearance and may increase dependency potential.
              </li>
              <li>
                Non-functional CYP3A5 variants are largely unresponsive to both
                inducers and inhibitors, limiting therapeutic adjustment in
                those individuals.
              </li>
              <li>
                The Opioid Risk Tool (ORT) helps clinicians pre-screen patients,
                while pharmacogenomic testing can personalize opioid therapy —
                though both must be made equitably accessible.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="subsection">
        <h3>⚖️ Ethical Considerations — Click to Expand</h3>
        <p>
          Each ethical issue below connects biology, psychology, and ethics.
          Click to explore.
        </p>
        <div className="ethics-container">
          {ETHICS_POINTS.map((ep, i) => (
            <Accordion key={i} title={ep.title} accent="#f39c12">
              <p>{ep.content}</p>
              <div className="discipline-tag">{ep.discipline}</div>
            </Accordion>
          ))}
        </div>
      </div>

      <div className="subsection">
        <h3>Future Research Directions</h3>
        <div className="future-grid">
          {[
            "Expand genetic screening studies across diverse global populations to ensure equitable pharmacogenomic medicine.",
            "Investigate gene-environment interactions that modulate CYP3A4/5 expression beyond SNPs.",
            "Develop non-invasive genetic testing methods to make pharmacogenomic profiling accessible in all clinical settings.",
            "Study long-term neurobiological recovery following OUD treatment to better understand brain plasticity.",
          ].map((item, i) => (
            <div key={i} className="future-card">
              <span className="future-num">{i + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="subsection">
        <h3>📚 Paper References (APA)</h3>
        <ol className="ref-list">
          {PAPER_REFS.map((ref, i) => (
            <li key={i} className="ref-item">
              {ref}
            </li>
          ))}
        </ol>
      </div>

      <div className="subsection">
        <h3>🖼️ Image & Diagram Citations (APA)</h3>
        <ol className="ref-list">
          {IMAGE_REFS.map((ref, i) => (
            <li key={i} className="ref-item">
              {ref}
            </li>
          ))}
        </ol>
      </div>

      <div className="final-badge">
        <p>Research Facility Tour Complete ✓</p>
        <p style={{ fontSize: "0.9rem", color: "#aaa" }}>
          Aditya Dash · Rhea Gadi · Rylan M. Oglesbee | Innovation Academy AP
          Biology | March 2026
        </p>
      </div>
    </SectionShell>
  );
}

/* ─── FLOOR PLAN HOME PAGE ───────────────────────────────────── */
const ROOM_PREVIEWS = {
  s1: [
    "80K+ overdose deaths/yr",
    "Biology ↔ Psychology ↔ Ethics",
    "The core research question",
  ],
  s2: [
    "CYP3A4/5 gene variants",
    "Chr. 7q21 location & structure",
    "3D enzyme model explorer",
  ],
  s3: [
    "SNP drag-and-drop matcher",
    "Live metabolism rate slider",
    "Fentanyl & oxycodone cases",
  ],
  s4: [
    "Drag-to-rotate 3D brain",
    "Mesolimbic dopamine pathway",
    "Neuroscience quiz",
  ],
  s5: [
    "Inducers vs. inhibitors",
    "CYP3A4/5 modulator tables",
    "Cytochrome P450 cycle",
  ],
  s6: [
    "Opioid Risk Tool (ORT)",
    "Personalized medicine calculator",
    "Psychology of dependency",
  ],
  s7: ["Ethical frameworks", "Cross-disciplinary summary", "All APA citations"],
};

function FloorPlan({ onEnterRoom, darkMode }) {
  const [hovered, setHovered] = useState(null);
  const rooms = SECTIONS.map((s) => ({ ...s, preview: ROOM_PREVIEWS[s.id] }));

  const C = darkMode
    ? {
        floor: "#07111e",
        tileLine: "rgba(100,160,190,0.06)",
        wallHatch: "rgba(126,200,227,0.18)",
        wallBorder: "rgba(126,200,227,0.55)",
        wallInner: "rgba(126,200,227,0.35)",
        corridor: "rgba(126,200,227,0.04)",
        corridorV: "rgba(126,200,227,0.03)",
        door: "rgba(126,200,227,0.6)",
        doorArc: "rgba(126,200,227,0.4)",
        corridorLabel: "rgba(126,200,227,0.28)",
        compassRose: "rgba(126,200,227,0.35)",
        scale: "rgba(126,200,227,0.3)",
        scaleText: "rgba(126,200,227,0.22)",
        dwgNo: "rgba(126,200,227,0.2)",
        dwgScale: "rgba(126,200,227,0.15)",
        arrow: "#7ec8e3",
      }
    : {
        floor: "#d8eaf8",
        tileLine: "rgba(20,70,130,0.07)",
        wallHatch: "rgba(20,70,130,0.15)",
        wallBorder: "rgba(20,70,130,0.5)",
        wallInner: "rgba(20,70,130,0.3)",
        corridor: "rgba(20,70,130,0.05)",
        corridorV: "rgba(20,70,130,0.03)",
        door: "rgba(20,70,130,0.55)",
        doorArc: "rgba(20,70,130,0.35)",
        corridorLabel: "rgba(20,70,130,0.38)",
        compassRose: "rgba(20,70,130,0.45)",
        scale: "rgba(20,70,130,0.3)",
        scaleText: "rgba(20,70,130,0.3)",
        dwgNo: "rgba(20,70,130,0.28)",
        dwgScale: "rgba(20,70,130,0.2)",
        arrow: "#1a5a90",
      };

  /* Room positions (% of building). Corridors occupy gaps between rows. */
  const roomLayouts = [
    { left: "25%", top: "2%", width: "50%", height: "17%" }, // s1 Entrance
    { left: "2%", top: "24%", width: "30%", height: "22%" }, // s2 Genetics
    { left: "37%", top: "24%", width: "30%", height: "22%" }, // s3 Biochem
    { left: "2%", top: "52%", width: "66%", height: "22%" }, // s4 Neuro
    { left: "2%", top: "80%", width: "30%", height: "18%" }, // s5 Pharma
    { left: "37%", top: "80%", width: "30%", height: "18%" }, // s6 Clinical
    { left: "72%", top: "24%", width: "26%", height: "74%" }, // s7 Ethics
  ];

  /* Arrows: endpoints placed exactly 3 SVG units (1 arrowhead length) before
     each room boundary, so the arrowhead body fills the corridor and the tip
     touches the room edge (hidden under the room card at z-index 3) */
  const arrows = [
    { d: "M 50 19 C 50 22, 17 19, 17 21", id: "a1" }, // 1→2: tip at y=24
    { d: "M 32 35 L 34 35", id: "a2" }, // 2→3: tip at x=37
    { d: "M 52 46 C 52 50, 35 46, 35 49", id: "a3" }, // 3→4: tip at y=52
    { d: "M 17 74 L 17 77", id: "a4" }, // 4→5: tip at y=80
    { d: "M 32 89 L 34 89", id: "a5" }, // 5→6: tip at x=37
    { d: "M 67 89 C 74 89, 67 61, 69 61", id: "a6" }, // 6→7: tip at x=72
  ];

  return (
    <div className="floorplan-page">
      <div className="fp-header">
        <div className="fp-title-main">🏥 OUD Research Facility</div>
        <div className="fp-subtitle-main">
          CYP3A Gene Family &amp; Dopaminergic Systems in Opioid Use Disorder
        </div>
        <div className="fp-authors">
          Aditya Dash · Rhea Gadi · Rylan M. Oglesbee &nbsp;|&nbsp; AP Biology ·
          March 2026
        </div>
        <div className="fp-instruction">
          Click any room to enter and explore
        </div>
      </div>

      <div className="fp-building">
        {/* ── Architectural floor plan SVG ── */}
        <svg
          className="fp-bg-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Floor tile cross-hatch */}
            <pattern
              id="fp-tile"
              patternUnits="userSpaceOnUse"
              width="6"
              height="6"
            >
              <rect width="6" height="6" fill={C.floor} />
              <path
                d="M0,3 L6,3 M3,0 L3,6"
                stroke={C.tileLine}
                strokeWidth="0.4"
              />
            </pattern>
            {/* Exterior wall hatch */}
            <pattern
              id="wall-hatch"
              patternUnits="userSpaceOnUse"
              width="3"
              height="3"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="3"
                stroke={C.wallHatch}
                strokeWidth="1"
              />
            </pattern>
          </defs>
          {/* Floor surface */}
          <rect x="0" y="0" width="100" height="100" fill="url(#fp-tile)" />
          {/* Corridor fills (slightly lighter) */}
          <rect x="2" y="19" width="70" height="5" fill={C.corridor} />{" "}
          {/* upper */}
          <rect x="2" y="46" width="68" height="6" fill={C.corridor} />{" "}
          {/* middle */}
          <rect x="2" y="74" width="68" height="6" fill={C.corridor} />{" "}
          {/* lower */}
          <rect x="32" y="24" width="5" height="22" fill={C.corridorV} />{" "}
          {/* col gap 2↔3 */}
          <rect x="32" y="80" width="5" height="18" fill={C.corridorV} />{" "}
          {/* col gap 5↔6 */}
          <rect x="68" y="24" width="4" height="74" fill={C.corridorV} />{" "}
          {/* right corridor */}
          {/* ── Outer building walls (thick hatch fill + border) ── */}
          <rect x="1" y="1" width="98" height="1.5" fill="url(#wall-hatch)" />
          <rect
            x="1"
            y="97.5"
            width="98"
            height="1.5"
            fill="url(#wall-hatch)"
          />
          <rect x="1" y="1" width="1.5" height="98" fill="url(#wall-hatch)" />
          <rect
            x="97.5"
            y="1"
            width="1.5"
            height="98"
            fill="url(#wall-hatch)"
          />
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            fill="none"
            stroke={C.wallBorder}
            strokeWidth="0.8"
          />
          {/* ── Interior wall lines ── */}
          {/* Entrance side walls */}
          <line
            x1="25"
            y1="2"
            x2="25"
            y2="19"
            stroke={C.wallInner}
            strokeWidth="0.6"
          />
          <line
            x1="75"
            y1="2"
            x2="75"
            y2="19"
            stroke={C.wallInner}
            strokeWidth="0.6"
          />
          {/* Upper corridor top/bottom lines */}
          <line
            x1="2"
            y1="19"
            x2="72"
            y2="19"
            stroke={C.wallInner}
            strokeWidth="0.5"
          />
          <line
            x1="2"
            y1="24"
            x2="72"
            y2="24"
            stroke={C.wallInner}
            strokeWidth="0.5"
          />
          {/* Room 2 right / Room 3 left walls */}
          <line
            x1="32"
            y1="24"
            x2="32"
            y2="46"
            stroke={C.wallInner}
            strokeWidth="0.5"
          />
          <line
            x1="37"
            y1="24"
            x2="37"
            y2="46"
            stroke={C.wallInner}
            strokeWidth="0.5"
          />
          {/* Middle corridor */}
          <line
            x1="2"
            y1="46"
            x2="70"
            y2="46"
            stroke={C.wallInner}
            strokeWidth="0.5"
          />
          <line
            x1="2"
            y1="52"
            x2="70"
            y2="52"
            stroke={C.wallInner}
            strokeWidth="0.5"
          />
          {/* Neuro right wall */}
          <line
            x1="68"
            y1="52"
            x2="68"
            y2="74"
            stroke={C.wallInner}
            strokeWidth="0.5"
          />
          {/* Lower corridor */}
          <line
            x1="2"
            y1="74"
            x2="70"
            y2="74"
            stroke={C.wallInner}
            strokeWidth="0.5"
          />
          <line
            x1="2"
            y1="80"
            x2="70"
            y2="80"
            stroke={C.wallInner}
            strokeWidth="0.5"
          />
          {/* Room 5 right / Room 6 left walls */}
          <line
            x1="32"
            y1="80"
            x2="32"
            y2="98"
            stroke={C.wallInner}
            strokeWidth="0.5"
          />
          <line
            x1="37"
            y1="80"
            x2="37"
            y2="98"
            stroke={C.wallInner}
            strokeWidth="0.5"
          />
          {/* Ethics left wall */}
          <line
            x1="72"
            y1="24"
            x2="72"
            y2="98"
            stroke={C.wallInner}
            strokeWidth="0.5"
          />
          {/* Ethics top wall */}
          <line
            x1="72"
            y1="24"
            x2="98"
            y2="24"
            stroke={C.wallInner}
            strokeWidth="0.5"
          />
          {/* ── Door symbols (line + quarter-arc swing) ── */}
          {/* Entrance → upper corridor */}
          <line
            x1="50"
            y1="17.5"
            x2="50"
            y2="19.5"
            stroke={C.door}
            strokeWidth="0.5"
          />
          <path
            d="M 50 17.5 A 2 2 0 0 0 52 19.5"
            fill="none"
            stroke={C.doorArc}
            strokeWidth="0.4"
          />
          {/* Room 2 → corridor (right wall) */}
          <line
            x1="30.5"
            y1="35"
            x2="32.5"
            y2="35"
            stroke={C.door}
            strokeWidth="0.5"
          />
          <path
            d="M 30.5 35 A 2 2 0 0 1 32.5 33"
            fill="none"
            stroke={C.doorArc}
            strokeWidth="0.4"
          />
          {/* Room 3 → middle corridor (bottom) */}
          <line
            x1="52"
            y1="44.5"
            x2="52"
            y2="46.5"
            stroke={C.door}
            strokeWidth="0.5"
          />
          <path
            d="M 52 44.5 A 2 2 0 0 1 54 46.5"
            fill="none"
            stroke={C.doorArc}
            strokeWidth="0.4"
          />
          {/* Room 4 → lower corridor (bottom-left) */}
          <line
            x1="17"
            y1="72.5"
            x2="17"
            y2="74.5"
            stroke={C.door}
            strokeWidth="0.5"
          />
          <path
            d="M 17 72.5 A 2 2 0 0 0 19 74.5"
            fill="none"
            stroke={C.doorArc}
            strokeWidth="0.4"
          />
          {/* Room 5 → corridor (right) */}
          <line
            x1="30.5"
            y1="89"
            x2="32.5"
            y2="89"
            stroke={C.door}
            strokeWidth="0.5"
          />
          <path
            d="M 30.5 89 A 2 2 0 0 1 32.5 87"
            fill="none"
            stroke={C.doorArc}
            strokeWidth="0.4"
          />
          {/* Ethics left wall door */}
          <line
            x1="70.5"
            y1="61"
            x2="72.5"
            y2="61"
            stroke={C.door}
            strokeWidth="0.5"
          />
          <path
            d="M 70.5 61 A 2 2 0 0 0 72.5 63"
            fill="none"
            stroke={C.doorArc}
            strokeWidth="0.4"
          />
          {/* ── Corridor labels ── */}
          <text
            x="36"
            y="22.2"
            fill={C.corridorLabel}
            fontSize="1.6"
            textAnchor="middle"
            letterSpacing="0.8"
          >
            MAIN CORRIDOR A
          </text>
          <text
            x="35"
            y="49.5"
            fill={C.corridorLabel}
            fontSize="1.6"
            textAnchor="middle"
            letterSpacing="0.8"
          >
            CORRIDOR B
          </text>
          <text
            x="35"
            y="77.5"
            fill={C.corridorLabel}
            fontSize="1.6"
            textAnchor="middle"
            letterSpacing="0.8"
          >
            CORRIDOR C
          </text>
          {/* ── Scale bar ── */}
          <g transform="translate(3,96)">
            <line
              x1="0"
              y1="0"
              x2="12"
              y2="0"
              stroke={C.scale}
              strokeWidth="0.5"
            />
            <line
              x1="0"
              y1="-0.6"
              x2="0"
              y2="0.6"
              stroke={C.scale}
              strokeWidth="0.5"
            />
            <line
              x1="12"
              y1="-0.6"
              x2="12"
              y2="0.6"
              stroke={C.scale}
              strokeWidth="0.5"
            />
            <text
              x="6"
              y="-1"
              fill={C.scaleText}
              fontSize="1.4"
              textAnchor="middle"
            >
              ~10 m
            </text>
          </g>
          {/* ── Drawing title block ── */}
          <text x="97" y="96" fill={C.dwgNo} fontSize="1.3" textAnchor="end">
            DWG NO: OUD-FACILITY-F1
          </text>
          <text x="97" y="98" fill={C.dwgScale} fontSize="1.1" textAnchor="end">
            SCALE 1:200 · 2026
          </text>
        </svg>

        {/* ── Animated path arrows SVG ── */}
        <svg
          className="fp-arrows-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <marker
              id="fp-arrow"
              markerWidth="4"
              markerHeight="3.5"
              refX="0"
              refY="1.75"
              orient="auto"
            >
              <polygon
                points="0 0, 4 1.75, 0 3.5"
                fill={C.arrow}
                opacity="0.95"
              />
            </marker>
          </defs>
          {arrows.map((a) => (
            <path
              key={a.id}
              d={a.d}
              stroke={C.arrow}
              strokeWidth="0.75"
              fill="none"
              markerEnd="url(#fp-arrow)"
              strokeDasharray="2.5 1.5"
              className="fp-arrow-path"
            />
          ))}
        </svg>

        {/* ── Room cards ── */}
        {rooms.map((room, i) => (
          <div
            key={room.id}
            className={`fp-room${hovered === room.id ? " fp-room-hovered" : ""}`}
            style={{
              position: "absolute",
              ...roomLayouts[i],
              "--rc": room.color,
              borderColor: room.color + "bb",
            }}
            onMouseEnter={() => setHovered(room.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onEnterRoom(room.id)}
          >
            <div className="fp-room-num">Station {i + 1}</div>
            <div className="fp-room-head">
              <span className="fp-room-icon">{room.icon}</span>
              <span className="fp-room-name">{room.label}</span>
            </div>
            <ul className="fp-room-bullets">
              {room.preview.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
            <div className="fp-room-enter">Enter →</div>
          </div>
        ))}

        <div className="fp-corner fp-corner-tl">
          OUD RESEARCH FACILITY — FLOOR 1
        </div>
        <div className="fp-corner fp-corner-br">AP BIOLOGY 2026</div>
      </div>
    </div>
  );
}

/* ─── SECTION COMPONENTS MAP ────────────────────────────────── */
const SECTION_COMPONENTS = {
  s1: EntranceHall,
  s2: GeneticsLab,
  s3: BiochemistryStation,
  s4: NeuroscienceChamber,
  s5: PharmacologyWing,
  s6: ClinicalOffice,
  s7: EthicsCitationsHall,
};

/* ─── HOME NAV MENU ──────────────────────────────────────────── */
function HomeNavMenu({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="home-nav-menu" ref={menuRef}>
      <button
        className={`section-nav-btn topbar-menu-btn home-nav-btn${menuOpen ? " active" : ""}`}
        onClick={() => setMenuOpen((o) => !o)}
      >
        ☰ All Stations
      </button>
      {menuOpen && (
        <div className="topbar-dropdown home-nav-dropdown">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              className="topbar-dropdown-item"
              onClick={() => {
                onNavigate(s.id);
                setMenuOpen(false);
              }}
            >
              <span className="td-num">{i + 1}</span>
              <span className="td-icon">{s.icon}</span>
              <span className="td-label">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── SECTION TOP BAR ───────────────────────────────────────── */
function TopBar({ sec, idx, onBack, onNavigate, darkMode, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="section-topbar">
      {/* Left: back + current section title */}
      <div className="topbar-left">
        <button className="section-back-btn" onClick={onBack}>
          ← Facility Map
        </button>
        <div className="topbar-current">
          <span className="topbar-current-icon">{sec?.icon}</span>
          <span className="topbar-current-label">
            <span className="topbar-station">
              Station {idx + 1} of {SECTIONS.length}
            </span>
            <span className="topbar-secname">{sec?.label}</span>
          </span>
        </div>
      </div>

      {/* Right: full nav menu + theme toggle */}
      <div className="topbar-right">
        <div className="topbar-menu-wrap" ref={menuRef}>
          <button
            className={`section-nav-btn topbar-menu-btn${menuOpen ? " active" : ""}`}
            onClick={() => setMenuOpen((o) => !o)}
          >
            ☰ All Stations
          </button>
          {menuOpen && (
            <div className="topbar-dropdown">
              {SECTIONS.map((s, i) => (
                <button
                  key={s.id}
                  className={`topbar-dropdown-item${s.id === sec?.id ? " current" : ""}`}
                  onClick={() => {
                    onNavigate(s.id);
                    setMenuOpen(false);
                  }}
                >
                  <span className="td-num">{i + 1}</span>
                  <span className="td-icon">{s.icon}</span>
                  <span className="td-label">{s.label}</span>
                  {s.id === sec?.id && <span className="td-here">◀</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <ThemeToggle dark={darkMode} onToggle={onToggleTheme} inline />
      </div>
    </div>
  );
}

/* ─── THEME TOGGLE ───────────────────────────────────────────── */
function ThemeToggle({ dark, onToggle, inline }) {
  return (
    <button
      className={`theme-toggle${dark ? " theme-toggle--dark" : " theme-toggle--light"}${inline ? " theme-toggle--inline" : ""}`}
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb" />
      </span>
      <span className="theme-toggle-icon">{dark ? "🌙" : "☀️"}</span>
    </button>
  );
}

/* ─── APP ROOT ───────────────────────────────────────────────── */
export default function App() {
  const [viewMode, setViewMode] = useState("floorplan");
  const [activeSection, setActiveSection] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("oud-theme");
    return saved ? saved === "dark" : true;
  });

  const toggleTheme = () => {
    setDarkMode((d) => {
      const next = !d;
      localStorage.setItem("oud-theme", next ? "dark" : "light");
      return next;
    });
  };

  const handleEnterRoom = (sectionId) => {
    setActiveSection(sectionId);
    setViewMode("section");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleBack = () => {
    setViewMode("floorplan");
    setActiveSection(null);
  };

  if (viewMode === "floorplan") {
    return (
      <div data-theme={darkMode ? "dark" : "light"}>
        <ThemeToggle dark={darkMode} onToggle={toggleTheme} />
        <HomeNavMenu onNavigate={handleEnterRoom} />
        <FloorPlan onEnterRoom={handleEnterRoom} darkMode={darkMode} />
      </div>
    );
  }

  const idx = SECTIONS.findIndex((s) => s.id === activeSection);
  const sec = SECTIONS[idx];
  const SectionComponent = SECTION_COMPONENTS[activeSection];
  const prevSec = idx > 0 ? SECTIONS[idx - 1] : null;
  const nextSec = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;

  return (
    <div data-theme={darkMode ? "dark" : "light"}>
      <div className="section-view">
        {/* Top navigation bar */}
        <TopBar
          sec={sec}
          idx={idx}
          onBack={handleBack}
          onNavigate={handleEnterRoom}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
        />

        {/* Single section content */}
        <div className="section-view-body">
          <SectionComponent />
        </div>

        {/* Bottom nav */}
        <div className="section-bottombar">
          <button className="section-back-btn outline" onClick={handleBack}>
            ← Back to Facility Map
          </button>
          <div className="section-bottombar-nav">
            {prevSec && (
              <button
                className="section-nav-btn"
                onClick={() => handleEnterRoom(prevSec.id)}
              >
                ← {prevSec.label}
              </button>
            )}
            {nextSec && (
              <button
                className="section-nav-btn"
                onClick={() => handleEnterRoom(nextSec.id)}
              >
                {nextSec.label} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
