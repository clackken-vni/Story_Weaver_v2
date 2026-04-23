import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [10, 20, 50];

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalPages <= 1 && totalCount <= pageSize) {
    return (
      <div style={{ color: 'var(--np-muted)', fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Showing {totalCount} of {totalCount}
      </div>
    );
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  const pages: (number | 'ellipsis')[] = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis');
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        borderTop: '1px solid var(--np-line)',
        paddingTop: 'var(--space-3)',
      }}
    >
      <p style={{ color: 'var(--np-muted)', fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Showing {start}-{end} of {totalCount}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <span className="sr-only">Page size</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            style={{
              appearance: 'none',
              background: 'var(--np-surface)',
              border: '1px solid var(--np-line)',
              color: 'var(--np-ink)',
              padding: '6px 28px 6px 10px',
              fontSize: 'var(--text-sm)',
            }}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: 8, pointerEvents: 'none' }} aria-hidden="true" />
        </label>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }} role="navigation" aria-label="Pagination">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={buttonStyle(currentPage === 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>

          {pages.map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} style={{ padding: '0 var(--space-2)', color: 'var(--np-muted)' }}>
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                style={buttonStyle(false, page === currentPage)}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={buttonStyle(currentPage === totalPages)}
            aria-label="Next page"
          >
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

function buttonStyle(disabled: boolean, active: boolean = false) {
  return {
    minWidth: 32,
    height: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    border: `1px solid ${active ? 'var(--np-accent)' : 'var(--np-line)'}`,
    background: active ? 'var(--np-accent)' : 'var(--np-surface)',
    color: active ? '#f5f1ea' : disabled ? 'var(--np-muted)' : 'var(--np-ink)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
  } as const;
}
