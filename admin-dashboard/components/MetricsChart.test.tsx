import { describe, it, expect } from '@jest/globals';

interface MetricDataPoint {
  timestamp: string;
  value: number;
}

interface MetricsChartProps {
  title: string;
  data: MetricDataPoint[];
  type: 'cpu' | 'memory' | 'requests' | 'latency';
  unit?: string;
}

function MetricsChart({ title, data, type, unit = '%' }: MetricsChartProps) {
  if (data.length === 0) {
    return `<div class="chart-empty">No data available for ${title}</div>`;
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length;

  const bars = data.map((point, index) => {
    const heightPercent = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
    return `
      <div class="bar-container" data-index="${index}">
        <div class="bar" style="height: ${heightPercent}%"></div>
        <span class="bar-value">${point.value.toFixed(1)}${unit}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="metrics-chart" data-type="${type}">
      <h3>${title}</h3>
      <div class="chart-stats">
        <span>Min: ${minValue.toFixed(1)}${unit}</span>
        <span>Max: ${maxValue.toFixed(1)}${unit}</span>
        <span>Avg: ${avgValue.toFixed(1)}${unit}</span>
      </div>
      <div class="chart-bars">${bars}</div>
    </div>
  `;
}

describe('MetricsChart', () => {
  const mockCpuData: MetricDataPoint[] = [
    { timestamp: '2024-01-01T00:00:00Z', value: 45.5 },
    { timestamp: '2024-01-01T01:00:00Z', value: 52.3 },
    { timestamp: '2024-01-01T02:00:00Z', value: 38.1 },
    { timestamp: '2024-01-01T03:00:00Z', value: 61.2 },
  ];

  const mockMemoryData: MetricDataPoint[] = [
    { timestamp: '2024-01-01T00:00:00Z', value: 62.0 },
    { timestamp: '2024-01-01T01:00:00Z', value: 65.5 },
  ];

  it('should render chart title', () => {
    const html = MetricsChart({ title: 'CPU Usage', data: mockCpuData, type: 'cpu' });
    expect(html).toContain('CPU Usage');
  });

  it('should render empty state when no data', () => {
    const html = MetricsChart({ title: 'CPU Usage', data: [], type: 'cpu' });
    expect(html).toContain('No data available for CPU Usage');
  });

  it('should calculate and display min/max/avg stats', () => {
    const html = MetricsChart({ title: 'CPU Usage', data: mockCpuData, type: 'cpu' });
    expect(html).toContain('Min:');
    expect(html).toContain('Max:');
    expect(html).toContain('Avg:');
  });

  it('should render correct number of bars', () => {
    const html = MetricsChart({ title: 'CPU Usage', data: mockCpuData, type: 'cpu' });
    const barCount = (html.match(/bar-container/g) || []).length;
    expect(barCount).toBe(mockCpuData.length);
  });

  it('should use default unit as percentage', () => {
    const html = MetricsChart({ title: 'CPU Usage', data: mockCpuData, type: 'cpu' });
    expect(html).toContain('%');
  });

  it('should use custom unit when provided', () => {
    const latencyData: MetricDataPoint[] = [
      { timestamp: '2024-01-01T00:00:00Z', value: 120 },
      { timestamp: '2024-01-01T01:00:00Z', value: 150 },
    ];
    const html = MetricsChart({ title: 'Latency', data: latencyData, type: 'latency', unit: 'ms' });
    expect(html).toContain('ms');
  });

  it('should handle data-type attribute', () => {
    const html = MetricsChart({ title: 'Memory', data: mockMemoryData, type: 'memory' });
    expect(html).toContain('data-type="memory"');
  });

  it('should calculate correct max value', () => {
    const html = MetricsChart({ title: 'CPU Usage', data: mockCpuData, type: 'cpu' });
    const expectedMax = Math.max(...mockCpuData.map(d => d.value));
    expect(html).toContain(`Max: ${expectedMax.toFixed(1)}`);
  });

  it('should calculate correct min value', () => {
    const html = MetricsChart({ title: 'CPU Usage', data: mockCpuData, type: 'cpu' });
    const expectedMin = Math.min(...mockCpuData.map(d => d.value));
    expect(html).toContain(`Min: ${expectedMin.toFixed(1)}`);
  });

  it('should calculate correct average value', () => {
    const html = MetricsChart({ title: 'CPU Usage', data: mockCpuData, type: 'cpu' });
    const expectedAvg = mockCpuData.reduce((sum, d) => sum + d.value, 0) / mockCpuData.length;
    expect(html).toContain(`Avg: ${expectedAvg.toFixed(1)}`);
  });

  it('should render single data point', () => {
    const singleData: MetricDataPoint[] = [{ timestamp: '2024-01-01T00:00:00Z', value: 50 }];
    const html = MetricsChart({ title: 'Single Point', data: singleData, type: 'cpu' });
    expect(html).toContain('50.0%');
  });
});
