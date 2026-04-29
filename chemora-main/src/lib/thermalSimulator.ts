// Thermal simulator implementing thermodynamically-consistent updates
// All energy flows are computed before temperatures are updated.

export interface ThermalState {
  // temperatures (°C)
  T_w: number; // water
  T_m: number; // metal

  // masses (grams)
  m_w: number;
  m_m: number;

  // specific heats (J/(g°C))
  c_w: number;
  c_m: number;

  // reaction state
  reactantAmount: number; // arbitrary units
  reactionRateBase: number; // units per second (user slider)
  enthalpyChange: number; // J per reaction unit (positive = exothermic)

  // environmental / device parameters
  burnerPower: number; // J/s added to water
  k_exchange: number; // J/(s·°C)
  h_base: number; // base convective coefficient (J/(s·m2·°C)) used with area
  h_env_area: number; // effective area for env cooling (m2)
  pressure: number; // Pa
  P_standard: number; // Pa
  // active cooling element parameters
  coolingPower: number; // J/s available from cooling device (positive removes heat)
  coolingCOP: number; // coefficient of performance (efficiency) of cooling device
  T_env: number;
  T_cool: number;

  // numerical
  minTemperature: number; // floor to prevent runaway
}

export interface SimulatorOptions {
  dt?: number; // seconds per step
}

const R = 8.314; // J/(mol·K) - only used if Arrhenius enabled

export class ThermalSimulator {
  state: ThermalState;
  dt: number;

  constructor(initial: ThermalState, opts?: SimulatorOptions) {
    this.state = { ...initial };
    this.dt = opts?.dt ?? 0.05; // finer timestep for smoother graphs
  }

  // Compute reaction rate (units/s) — optional Arrhenius behaviour when Ea provided
  computeReactionRate(tempC: number, baseRate: number, Ea?: number): number {
    if (!baseRate || baseRate <= 0) return 0;
    if (Ea && Ea > 0) {
      const T = tempC + 273.15;
      return baseRate * Math.exp(-Ea / (R * T));
    }
    return baseRate;
  }

  step(Ea?: number) {
    const s = this.state;

    // Gather heat contributions (J/s) for this step
    const Q_burner = s.burnerPower; // J/s added to water

    // Reaction: base computed rate (units/s)
    const requestedRate = this.computeReactionRate(s.T_w, s.reactionRateBase, Ea);

    // Limit by available reactant (units/s) -> cannot consume more than remaining reactant this step
    const maxRateByReactant = s.reactantAmount / Math.max(this.dt, 1e-12);
    let reactionRate = Math.min(requestedRate, maxRateByReactant);

    // Reaction heat (J/s): rate * enthalpyChange (J per unit)
    let Q_reaction = reactionRate * s.enthalpyChange;

    // Track whether we had to limit due to insufficient thermal energy
    let limitedByEnergy = false;

    // If endothermic (enthalpyChange < 0), ensure water has enough thermal energy to supply it.
    if (s.enthalpyChange < 0 && Q_reaction < 0) {
      // Available thermal energy in water relative to minTemperature floor (J)
      const availableEnergyJ = Math.max(0, (s.T_w - s.minTemperature) * s.m_w * s.c_w);
      const availableEnergyRate = availableEnergyJ / Math.max(this.dt, 1e-12); // J/s available to lose without breaching floor

      // Limit |Q_reaction| to availableEnergyRate
      const maxAllowedAbs = availableEnergyRate;
      if (Math.abs(Q_reaction) > maxAllowedAbs) {
        // scale down reaction rate
        const scale = maxAllowedAbs / Math.abs(Q_reaction);
        reactionRate *= scale;
        Q_reaction *= scale;
        limitedByEnergy = true;
      }
    }

    // Heat exchange between water and metal (J/s)
    const Q_exchange = s.k_exchange * (s.T_w - s.T_m);

    // Environmental cooling coefficients scaled by pressure
    const h_env = s.h_base * (s.pressure / s.P_standard);

    // Cooling terms (J/s)
    const Q_env_w = h_env * s.h_env_area * (s.T_w - s.T_env);
    const Q_env_m = h_env * s.h_env_area * (s.T_m - s.T_env);

    // Active cooling element: removes heat up to `coolingPower` (J/s).
    // Use COP to relate electrical input to refrigeration capacity; treat `coolingPower` as refrigeration capacity (J/s removed).
    // Cooling effectiveness reduces as object approaches `T_cool`.
    function activeCooling(T_obj: number) {
      const dT = T_obj - s.T_cool;
      if (dT <= 0) return 0; // cannot cool below cooling element temperature
      // simple effectiveness model: fraction = 1 - exp(-alpha * dT)
      const alpha = 0.5; // empirical tuning constant
      const frac = 1 - Math.exp(-alpha * dT);
      return s.coolingPower * frac; // J/s removed from object
    }

    const Q_cool_w = activeCooling(s.T_w);
    const Q_cool_m = activeCooling(s.T_m);

    const Q_total_cooling_w = Q_env_w + Q_cool_w;
    const Q_total_cooling_m = Q_env_m + Q_cool_m;

    // Convert per-second to per-step (multiply by dt)
    const dt = this.dt;
    const dQ_burner = Q_burner * dt;
    const dQ_reaction = Q_reaction * dt;
    const dQ_exchange = Q_exchange * dt;
    const dQ_total_cooling_w = Q_total_cooling_w * dt;
    const dQ_total_cooling_m = Q_total_cooling_m * dt;

    // Energy balance updates
    const deltaT_w = (dQ_burner + dQ_reaction - dQ_exchange - dQ_total_cooling_w) / (s.m_w * s.c_w);
    const deltaT_m = (dQ_exchange - dQ_total_cooling_m) / (s.m_m * s.c_m);

    // Update temperatures simultaneously
    s.T_w = Math.max(s.minTemperature, s.T_w + deltaT_w);
    s.T_m = Math.max(s.minTemperature, s.T_m + deltaT_m);

    // Consume reactants
    const reactedAmount = reactionRate * dt;
    s.reactantAmount = Math.max(0, s.reactantAmount - reactedAmount);

    // If endothermic and energy limited, reactionRate should reflect that (report back)
    const effectiveReactionRate = reactionRate;

    return {
      Q_burner: dQ_burner,
      Q_reaction: dQ_reaction,
      Q_exchange: dQ_exchange,
      Q_total_cooling_w: dQ_total_cooling_w,
      Q_total_cooling_m: dQ_total_cooling_m,
      deltaT_w,
      deltaT_m,
      reactedAmount,
      effectiveReactionRate,
      limitedByEnergy,
    };
  }
}

export default ThermalSimulator;
