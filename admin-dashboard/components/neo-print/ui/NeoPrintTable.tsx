import type { ReactNode } from 'react';
import { NeoPrintCard } from '../foundation/NeoPrintCard';

export interface NeoPrintTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  render: (row: T) => ReactNode;
}

interface NeoPrintTableProps<T> {
  data: T[];
  columns: NeoPrintTableColumn<T>[];
  rowKey: (row: T) => string;
  emptyLabel?: string;
}

export function NeoPrintTable<T>({ data, columns, rowKey, emptyLabel = 'No rows available' }: NeoPrintTableProps<T>) {
  if (data.length === 0) {
    return <NeoPrintCard><p style={{ fontSize: 'var(--text-sm)', color: 'var(--np-muted)' }}>{emptyLabel}</p></NeoPrintCard>;
  }

  return (
    <NeoPrintCard style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--np-surface-muted)' }}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    textAlign: column.align ?? 'left',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--np-line)',
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--np-muted)',
                  }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td
                    key={`${rowKey(row)}-${column.key}`}
                    style={{
                      textAlign: column.align ?? 'left',
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--np-line)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--np-ink)',
                      verticalAlign: 'top',
                    }}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NeoPrintCard>
  );
}
