import { useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip } from "recharts";

interface EndothermicGraphProps {
  reaction: {
    description: string;
    isExothermic: boolean;
    temperatureChange: number;
    enthalpyChange: number;
    intensity: number;
  };
  currentTemp: number;
  isReacting?: boolean;
}

export default function EndothermicGraph({ reaction, currentTemp }: EndothermicGraphProps) {
  const chartData = useMemo(() => {
    // Generate thermal data showing temperature change over time
    const data = [];
    const steps = 20;
    const maxTime = 10; // seconds

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      
      // Temperature changes based on reaction type
      if (reaction.isExothermic) {
        // Exothermic: temperature rises
        const tempRise = reaction.temperatureChange * (1 - Math.exp(-progress * 3));
        data.push({
          time: Number((progress * maxTime).toFixed(1)),
          temp: Number((currentTemp + tempRise).toFixed(1)),
        });
      } else {
        // Endothermic: temperature falls (cooling)
        const tempDrop = reaction.temperatureChange * (1 - Math.exp(-progress * 3));
        data.push({
          time: Number((progress * maxTime).toFixed(1)),
          temp: Number((currentTemp + tempDrop).toFixed(1)), // temperatureChange is negative
        });
      }
    }

    return data;
  }, [reaction, currentTemp]);

  const chartConfig = {
    temp: {
      label: "Temperature (°C)",
      color: reaction.isExothermic ? "hsl(0, 84%, 60%)" : "hsl(210, 100%, 50%)",
    },
  };

  const minTemp = Math.min(...chartData.map(d => d.temp));
  const maxTemp = Math.max(...chartData.map(d => d.temp));

  return (
    <div className="h-64 w-full bg-card rounded-lg p-4 border border-border">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
          <XAxis 
            dataKey="time" 
            label={{ value: "Time (s)", position: "right", offset: 0 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[Math.floor(minTemp - 5), Math.ceil(maxTemp + 5)]}
            label={{ value: "Temperature (°C)", angle: -90, position: "insideLeft" }}
            tick={{ fontSize: 12 }}
          />
          <ReferenceLine 
            y={currentTemp} 
            stroke="#22c55e" 
            strokeDasharray="5 5"
            label={{ value: `Start: ${currentTemp}°C`, position: "right", fill: "#22c55e", fontSize: 11 }}
          />
          <Tooltip 
            formatter={(value) => `${typeof value === 'number' ? value.toFixed(1) : value}°C`}
            labelFormatter={(label) => `Time: ${label}s`}
            contentStyle={{ backgroundColor: "rgba(0,0,0,0.75)", border: "none", borderRadius: "4px", color: "white" }}
          />
          <Line
            type="monotone"
            dataKey="temp"
            stroke={chartConfig.temp.color}
            strokeWidth={2}
            dot={false}
            name="Temperature"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
