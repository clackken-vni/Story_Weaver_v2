export interface MetricDataPoint {
  timestamp: string;
  value: number;
}

export interface MetricsChartProps {
  title: string;
  data: MetricDataPoint[];
  type: 'cpu' | 'memory' | 'requests' | 'latency';
  unit?: string;
}

export function MetricsChart({ title, data, type, unit = '%' }: MetricsChartProps) {
  if (data.length === 0) {
    return <div className="chart-empty">No data available for {title}</div>;
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length;

  return (
    <div className="metrics-chart p-4 border rounded-lg" data-type={type}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="chart-stats flex gap-4 text-sm text-gray-600 mb-4">
        <span>Min: {minValue.toFixed(1)}{unit}</span>
        <span>Max: {maxValue.toFixed(1)}{unit}</span>
        <span>Avg: {avgValue.toFixed(1)}{unit}</span>
      </div>
      <div className="chart-bars flex items-end gap-2 h-40">
        {data.map((point, index) => {
          const heightPercent = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
          return (
            <div
              key={index}
              className="bar-container flex-1 flex flex-col items-center"
              data-index={index}
            >
              <span className="bar-value text-xs mb-1">{point.value.toFixed(1)}{unit}</span>
              <div
                className="bar bg-blue-500 w-full transition-all"
                style={{ height: `${heightPercent}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
