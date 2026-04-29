import { FC } from "react";
import { Thermometer as ThermometerIcon } from "lucide-react";

interface ThermometerProps {
  currentTemp: number;
  minTemp?: number;
  maxTemp?: number;
  label?: string;
  showRecordings?: boolean;
  initialMetalTemp?: number;
  initialWaterTemp?: number;
}

export const Thermometer: FC<ThermometerProps> = ({
  currentTemp,
  minTemp = -10,
  maxTemp = 110,
  label = "Temperature",
  showRecordings = false,
  initialMetalTemp,
  initialWaterTemp,
}) => {
  // Calculate the fill percentage based on current temp
  const tempRange = maxTemp - minTemp;
  const fillPercentage = ((currentTemp - minTemp) / tempRange) * 100;

  // Clamp fill percentage to valid range
  const clampedFill = Math.max(0, Math.min(100, fillPercentage));

  // Determine color based on temperature
  const getTemperatureColor = (temp: number): string => {
    if (temp < 0) return "#3B82F6"; // Blue - cold
    if (temp < 20) return "#06B6D4"; // Cyan - cool
    if (temp < 40) return "#10B981"; // Green - warm
    if (temp < 60) return "#F59E0B"; // Amber - hot
    if (temp < 80) return "#EF4444"; // Red - very hot
    return "#991B1B"; // Dark red - extremely hot
  };

  const fillColor = getTemperatureColor(currentTemp);

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-gradient-to-br from-card to-card/50 rounded-lg border border-border">
      {/* Labels and Info */}
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground mb-2">
          {label}
        </p>
        <div className="flex items-center justify-center gap-2">
          <ThermometerIcon className="w-5 h-5 text-primary" />
          <span className="text-3xl font-bold text-foreground">
            {currentTemp.toFixed(1)}°C
          </span>
        </div>
      </div>

      {/* Thermometer Visual */}
      <div className="flex flex-col items-center gap-3">
        {/* Temperature scale with markings */}
        <div className="flex gap-6 items-end">
          {/* Scale labels */}
          <div className="flex flex-col justify-between text-xs text-muted-foreground h-40">
            <span>{maxTemp}°</span>
            <span>{(maxTemp + minTemp) / 2}°</span>
            <span>{minTemp}°</span>
          </div>

          {/* Thermometer tube */}
          <div className="relative w-12 h-40 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full border-2 border-border shadow-md overflow-hidden">
            {/* Mercury/liquid fill */}
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out rounded-full"
              style={{
                height: `${clampedFill}%`,
                backgroundColor: fillColor,
                boxShadow: `0 0 8px ${fillColor}80`,
              }}
            />

            {/* Temperature scale markings */}
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <div
                key={fraction}
                className="absolute left-0 right-0 border-b border-border/40"
                style={{ bottom: `${fraction * 100}%` }}
              />
            ))}

            {/* Current temperature indicator line */}
            <div
              className="absolute left-0 right-0 h-px bg-foreground transition-all duration-500"
              style={{ bottom: `${clampedFill}%` }}
            />
          </div>

          {/* Bulb at the bottom */}
          <div className="hidden" />
        </div>

        {/* Bulb visualization */}
        <div
          className="w-14 h-14 rounded-full border-2 border-border shadow-lg transition-all duration-500"
          style={{
            backgroundColor: fillColor,
            boxShadow: `0 0 16px ${fillColor}60`,
          }}
        />
      </div>

      {/* Recording Info if provided */}
      {showRecordings && (initialMetalTemp !== undefined || initialWaterTemp !== undefined) && (
        <div className="w-full pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {initialMetalTemp !== undefined && (
              <div className="bg-blue-500/10 rounded p-2 text-center">
                <p className="text-xs text-muted-foreground">Metal Initial</p>
                <p className="font-semibold text-foreground">
                  {initialMetalTemp.toFixed(1)}°C
                </p>
              </div>
            )}
            {initialWaterTemp !== undefined && (
              <div className="bg-cyan-500/10 rounded p-2 text-center">
                <p className="text-xs text-muted-foreground">Water Initial</p>
                <p className="font-semibold text-foreground">
                  {initialWaterTemp.toFixed(1)}°C
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="text-xs text-center text-muted-foreground px-3">
        {currentTemp < Math.min(
          initialMetalTemp ?? 40,
          initialWaterTemp ?? 20
        ) + 2 && currentTemp > Math.max(initialMetalTemp ?? 40, initialWaterTemp ?? 20) - 2
          ? "🔄 System at equilibrium"
          : "⚗️ Heat exchange in progress"}
      </div>
    </div>
  );
};

export default Thermometer;
