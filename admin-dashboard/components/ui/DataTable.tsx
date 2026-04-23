import { ArrowDownAZ, ArrowUpAZ, Database } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SkeletonLoader } from './SkeletonLoader';
import { NeoPrintCard } from '../neo-print';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyLabel?: string;
  mobileCard: (row: T) => React.ReactNode;
}

type SortDirection = 'asc' | 'desc';

export function DataTable<T>({
  data,
  columns,
  rowKey,
  loading = false,
  emptyLabel = 'No data',
  mobileCard,
}: DataTableProps<T>) {
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [direction, setDirection] = useState<SortDirection>('asc');

  const sortedData = useMemo(() => {
    if (!sortBy) {
      return data;
    }

    const column = columns.find((item) => item.key === sortBy);
    if (!column) {
      return data;
    }

    const sorted = [...data].sort((a, b) => {
      const left = column.sortValue ? column.sortValue(a) : String(column.render(a));
      const right = column.sortValue ? column.sortValue(b) : String(column.render(b));

      if (left < right) {
        return direction === 'asc' ? -1 : 1;
      }
      if (left > right) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [columns, data, direction, sortBy]);

  const onSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) {
      return;
    }

    if (sortBy === column.key) {
      setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(column.key);
    setDirection('asc');
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <SkeletonLoader variant="row" />
        <SkeletonLoader variant="row" />
        <SkeletonLoader variant="row" />
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <NeoPrintCard style={{ display: 'grid', justifyItems: 'center', textAlign: 'center', gap: 'var(--space-2)' }}>
        <Database size={20} aria-hidden="true" />
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--np-muted)' }}>{emptyLabel}</p>
      </NeoPrintCard>
    );
  }

  return (
    <>
      <div className="data-table-desktop">
        <NeoPrintCard style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--np-surface-muted)' }}>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      aria-sort={
                        !column.sortable
                          ? undefined
                          : sortBy === column.key
                            ? direction === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                      }
                      style={{
                        textAlign: column.align ?? 'left',
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--np-line)',
                        fontSize: 11,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'var(--np-muted)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onSort(column)}
                        disabled={!column.sortable}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          border: 'none',
                          background: 'transparent',
                          color: 'inherit',
                          cursor: column.sortable ? 'pointer' : 'default',
                          fontSize: 'inherit',
                          letterSpacing: 'inherit',
                          textTransform: 'inherit',
                        }}
                      >
                        {column.header}
                        {column.sortable &&
                          (sortBy === column.key && direction === 'desc' ? (
                            <ArrowDownAZ size={14} aria-hidden="true" />
                          ) : (
                            <ArrowUpAZ size={14} aria-hidden="true" />
                          ))}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row) => (
                  <tr key={rowKey(row)} className="data-row">
                    {columns.map((column) => (
                      <td
                        key={`${rowKey(row)}-${column.key}`}
                        style={{
                          textAlign: column.align ?? 'left',
                          padding: '14px 16px',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--np-ink)',
                          borderBottom: '1px solid var(--np-line)',
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
      </div>

      <div className="data-table-mobile" style={{ display: 'none' }}>
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>{sortedData.map((row) => <div key={rowKey(row)}>{mobileCard(row)}</div>)}</div>
      </div>

      <style jsx>{`
        .data-row:hover {
          background: var(--np-accent-soft);
        }

        @media (max-width: 767px) {
          .data-table-desktop {
            display: none;
          }

          .data-table-mobile {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
