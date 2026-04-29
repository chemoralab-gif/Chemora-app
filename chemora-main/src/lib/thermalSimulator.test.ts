import ThermalSimulator from "./thermalSimulator";

test("basic exothermic raises water temperature", () => {
  const sim = new ThermalSimulator({
    T_w: 20,
    T_m: 20,
    m_w: 100,
    m_m: 50,
    c_w: 4.18,
    c_m: 0.45,
    reactantAmount: 0.5,
    reactionRateBase: 0.1,
    enthalpyChange: 5000,
    burnerPower: 0,
    k_exchange: 0.1,
    h_base: 5,
    h_env_area: 0.01,
    pressure: 101325,
    P_standard: 101325,
    h_cool: 0,
    h_cool_area: 0.01,
    T_env: 20,
    T_cool: 5,
    minTemperature: 0,
  }, { dt: 0.1 });

  const before = sim.state.T_w;
  sim.step();
  expect(sim.state.T_w).toBeGreaterThanOrEqual(before);
});
