import { describe, it, expect } from '@jest/globals';

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function StatCard({ title, value, subtitle, trend, trendValue }: StatCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return `
    <div class="p-6 border rounded-lg bg-white">
      <p class="text-sm text-gray-500">${title}</p>
      <p class="text-3xl font-bold mt-2">${value.toLocaleString()}</p>
      ${subtitle ? `<p class="text-sm text-gray-500 mt-1">${subtitle}</p>` : ''}
      ${trend && trendValue ? `<p class="text-sm ${trendColor} mt-1">${trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} ${trendValue}</p>` : ''}
    </div>
  `;
}

describe('StatCard', () => {
  it('should render title and value', () => {
    const html = StatCard({ title: 'Total Users', value: 1000 });
    expect(html).toContain('Total Users');
    expect(html).toContain('1,000');
  });

  it('should render subtitle when provided', () => {
    const html = StatCard({ title: 'Active Users', value: 50, subtitle: 'Last 24 hours' });
    expect(html).toContain('Last 24 hours');
  });

  it('should not render subtitle when not provided', () => {
    const html = StatCard({ title: 'Total Users', value: 100 });
    expect(html).not.toContain('text-gray-500 mt-1');
  });

  it('should format large numbers with commas', () => {
    const html = StatCard({ title: 'Total Generations', value: 1234567 });
    expect(html).toContain('1,234,567');
  });

  it('should render up trend correctly', () => {
    const html = StatCard({ title: 'Users', value: 100, trend: 'up', trendValue: '12%' });
    expect(html).toContain('↑');
    expect(html).toContain('12%');
    expect(html).toContain('text-green-600');
  });

  it('should render down trend correctly', () => {
    const html = StatCard({ title: 'Users', value: 100, trend: 'down', trendValue: '5%' });
    expect(html).toContain('↓');
    expect(html).toContain('text-red-600');
  });

  it('should render neutral trend correctly', () => {
    const html = StatCard({ title: 'Users', value: 100, trend: 'neutral', trendValue: '0%' });
    expect(html).toContain('→');
    expect(html).toContain('text-gray-600');
  });

  it('should not render trend section when trend is not provided', () => {
    const html = StatCard({ title: 'Users', value: 100 });
    expect(html).not.toContain('text-green-600');
    expect(html).not.toContain('text-red-600');
  });
});
