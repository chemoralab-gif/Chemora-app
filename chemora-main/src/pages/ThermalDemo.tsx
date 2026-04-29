import React, { useEffect, useRef, useState } from "react";
import ThermalSimulator, { ThermalState } from "../lib/thermalSimulator";

export default function ThermalDemo() {
  const initial: ThermalState = {
    T_w: 25,
    T_m: 100,
    m_w: 200, // g
    m_m: 50,
    c_w: 4.18,
    c_m: 0.45,
    reactantAmount: 1.0,
    reactionRateBase: 0.1,
    enthalpyChange: 5000, // J per unit (positive exo)
    burnerPower: 0,
    k_exchange: 0.5,
    h_base: 5,
    h_env_area: 0.05,
    pressure: 101325,
    P_standard: 101325,
    coolingPower: 0,
    coolingCOP: 2.5,
    T_env: 25,
    T_cool: 5,
    minTemperature: 0,
  };

  const [state, setState] = useState(initial);
  const simRef = useRef<ThermalSimulator | null>(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<{ t: number; T_w: number; T_m: number }[]>([]);
  // keep a fixed-length buffer for plotting
  const maxPoints = 400;

  useEffect(() => {
    simRef.current = new ThermalSimulator(state, { dt: 0.05 });
  }, []);

  useEffect(() => {
    let id: number | null = null;
    if (running && simRef.current) {
      id = window.setInterval(() => {
        const res = simRef.current!.step();
        setState({ ...simRef.current!.state });
        setLog((l) => {
          const next = [...l, { t: Date.now(), T_w: simRef.current!.state.T_w, T_m: simRef.current!.state.T_m }];
          return next.length > maxPoints ? next.slice(next.length - maxPoints) : next;
        });
        // expose last step diagnostics
        setDiagnostics({ effectiveRate: res.effectiveReactionRate, limitedByEnergy: res.limitedByEnergy });
      }, 50); // finer sampling
    }
    return () => {
      if (id) window.clearInterval(id);
    };
  }, [running]);

  function updateField<K extends keyof ThermalState>(k: K, v: ThermalState[K]) {
    if (!simRef.current) return;
    simRef.current.state[k] = v as any;
    setState({ ...simRef.current.state });
  }

  // persist water mass so other UI (e.g., apparatus palette) can read and display it
  useEffect(() => {
    try {
      window.localStorage.setItem("sim_m_w", String(state.m_w));
    } catch (e) {
      // ignore
    }
  }, [state.m_w]);

  const [diagnostics, setDiagnostics] = useState<{ effectiveRate: number; limitedByEnergy: boolean }>({ effectiveRate: 0, limitedByEnergy: false });

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Thermal Simulator Demo</h2>
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div>
          <label>Burner Power (J/s)</label>
          <input type="range" min={0} max={10000} value={state.burnerPower} onChange={(e) => updateField("burnerPower", Number(e.target.value))} />
          <div>{state.burnerPower} J/s</div>

          <label>Reaction Rate Base (units/s)</label>
          <input type="range" min={0} max={1} step={0.01} value={state.reactionRateBase} onChange={(e) => updateField("reactionRateBase", Number(e.target.value))} />
          <div>{state.reactionRateBase.toFixed(2)}</div>

          <label>Enthalpy Change (J/unit; +exo, -endo)</label>
          <input type="range" min={-10000} max={10000} value={state.enthalpyChange} onChange={(e) => updateField("enthalpyChange", Number(e.target.value))} />
          <div>{state.enthalpyChange} J/unit</div>

          <label>Cooling Power (J/s)</label>
          <input type="range" min={0} max={10000} value={(state as any).coolingPower} onChange={(e) => updateField("coolingPower", Number(e.target.value))} />
          <div>{(state as any).coolingPower} J/s</div>

          <label>Cooling Element Temp (°C)</label>
          <input type="range" min={-20} max={50} value={state.T_cool} onChange={(e) => updateField("T_cool", Number(e.target.value))} />
          <div>{state.T_cool} °C</div>

          <label>Environmental Temp (°C)</label>
          <input type="range" min={-20} max={100} value={state.T_env} onChange={(e) => updateField("T_env", Number(e.target.value))} />
          <div>{state.T_env} °C</div>

          <label>Pressure (Pa)</label>
          <input type="range" min={50000} max={150000} value={state.pressure} onChange={(e) => updateField("pressure", Number(e.target.value))} />
          <div>{state.pressure} Pa</div>

          <label>Water Mass (g)</label>
          <input type="range" min={10} max={1000} value={state.m_w} onChange={(e) => updateField("m_w", Number(e.target.value))} />
          <div>{state.m_w} g</div>

          <label>Metal Mass (g)</label>
          <input type="range" min={1} max={500} value={state.m_m} onChange={(e) => updateField("m_m", Number(e.target.value))} />
          <div>{state.m_m} g</div>

          <label>Exchange k (J/(s·°C))</label>
          <input type="range" min={0} max={5} step={0.01} value={state.k_exchange} onChange={(e) => updateField("k_exchange", Number(e.target.value))} />
          <div>{state.k_exchange.toFixed(2)}</div>
        </div>

        <div>
          <div>Water Temp: {state.T_w.toFixed(2)} °C</div>
          <div>Metal Temp: {state.T_m.toFixed(2)} °C</div>
          <div>Reactant: {state.reactantAmount.toFixed(3)}</div>
          <div className="mt-2">Reaction: {state.enthalpyChange > 0 ? "Exothermic" : state.enthalpyChange < 0 ? "Endothermic" : "None"}</div>
          <div>Effective reaction rate: {diagnostics.effectiveRate.toFixed(4)} units/s</div>
          <div>{diagnostics.limitedByEnergy ? "Reaction energy-limited" : "Reaction not energy-limited"}</div>
          <div className="mt-2">
            <button className="btn" onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Start"}</button>
            <button className="btn ml-2" onClick={() => { simRef.current = new ThermalSimulator(initial, { dt: 0.1 }); setState(initial); setLog([]); setRunning(false); setDiagnostics({ effectiveRate: 0, limitedByEnergy: false }); }}>Reset</button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium">Temperature Plot</h3>
        <div className="border p-2 mt-2">
          <TemperaturePlot data={log} width={700} height={200} />
        </div>
      </div>
    </div>
  );
}

function TemperaturePlot({ data, width, height }: { data: { t: number; T_w: number; T_m: number }[]; width: number; height: number }) {
  if (!data || data.length === 0) return <div style={{ width, height }}>No data</div>;

  const times = data.map((d) => d.t);
  const Tw = data.map((d) => d.T_w);
  const Tm = data.map((d) => d.T_m);
  const minT = Math.min(...Tw, ...Tm);
  const maxT = Math.max(...Tw, ...Tm);
  const padding = 8;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;

  const x = (i: number) => padding + (i / Math.max(1, data.length - 1)) * plotW;
  const y = (v: number) => padding + (1 - (v - minT) / Math.max(1e-6, maxT - minT)) * plotH;

  const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');

  return (
    <svg width={width} height={height}>
      <rect x={0} y={0} width={width} height={height} fill="#fff" stroke="#e5e7eb" />
      <path d={path(Tw)} fill="none" stroke="#1f7aef" strokeWidth={2} />
      <path d={path(Tm)} fill="none" stroke="#ef4444" strokeWidth={2} />
      <g fontSize={10} fill="#111">
        <text x={padding} y={padding - 2}>Max {maxT.toFixed(1)}°C</text>
        <text x={padding} y={height - 2}>{minT.toFixed(1)}°C</text>
      </g>
    </svg>
  );
}
