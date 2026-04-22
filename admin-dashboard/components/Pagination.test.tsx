import { describe, it, expect } from '@jest/globals';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return '<div class="pagination">Page 1 of 1</div>';
  }

  const pages: (number | 'ellipsis')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis');
    }
  }

  const pageButtons = pages.map(page => {
    if (page === 'ellipsis') {
      return '<span class="ellipsis">...</span>';
    }
    const isActive = page === currentPage;
    return `<button class="page-btn ${isActive ? 'active' : ''}" data-page="${page}">${page}</button>`;
  }).join('');

  return `
    <div class="pagination">
      <button class="prev-btn" ${currentPage === 1 ? 'disabled' : ''} data-action="prev">Previous</button>
      ${pageButtons}
      <button class="next-btn" ${currentPage === totalPages ? 'disabled' : ''} data-action="next">Next</button>
    </div>
  `;
}

describe('Pagination', () => {
  it('should render current page info for single page', () => {
    const handlePageChange = () => {};
    const html = Pagination({ currentPage: 1, totalPages: 1, onPageChange: handlePageChange });
    expect(html).toContain('Page 1 of 1');
  });

  it('should render page buttons', () => {
    const handlePageChange = () => {};
    const html = Pagination({ currentPage: 1, totalPages: 5, onPageChange: handlePageChange });
    expect(html).toContain('data-page="1"');
    expect(html).toContain('data-page="5"');
  });

  it('should mark current page as active', () => {
    const handlePageChange = () => {};
    const html = Pagination({ currentPage: 3, totalPages: 5, onPageChange: handlePageChange });
    expect(html).toContain('active');
  });

  it('should disable previous button on first page', () => {
    const handlePageChange = () => {};
    const html = Pagination({ currentPage: 1, totalPages: 5, onPageChange: handlePageChange });
    expect(html).toContain('disabled');
  });

  it('should not disable previous button on later pages', () => {
    const handlePageChange = () => {};
    const html = Pagination({ currentPage: 2, totalPages: 5, onPageChange: handlePageChange });
    expect(html).not.toContain('prev-btn" disabled');
  });

  it('should disable next button on last page', () => {
    const handlePageChange = () => {};
    const html = Pagination({ currentPage: 5, totalPages: 5, onPageChange: handlePageChange });
    expect(html).toContain('next-btn" disabled');
  });

  it('should not disable next button on earlier pages', () => {
    const handlePageChange = () => {};
    const html = Pagination({ currentPage: 4, totalPages: 5, onPageChange: handlePageChange });
    expect(html).not.toContain('next-btn" disabled');
  });

  it('should render ellipsis for large page ranges', () => {
    const handlePageChange = () => {};
    const html = Pagination({ currentPage: 5, totalPages: 10, onPageChange: handlePageChange });
    expect(html).toContain('ellipsis');
  });

  it('should show nearby pages with ellipsis', () => {
    const handlePageChange = () => {};
    const html = Pagination({ currentPage: 5, totalPages: 10, onPageChange: handlePageChange });
    expect(html).toContain('data-page="4"');
    expect(html).toContain('data-page="5"');
    expect(html).toContain('data-page="6"');
  });

  it('should always show first and last page', () => {
    const handlePageChange = () => {};
    const html = Pagination({ currentPage: 5, totalPages: 10, onPageChange: handlePageChange });
    expect(html).toContain('data-page="1"');
    expect(html).toContain('data-page="10"');
  });

  it('should render all pages for small ranges', () => {
    const handlePageChange = () => {};
    const html = Pagination({ currentPage: 1, totalPages: 3, onPageChange: handlePageChange });
    expect(html).toContain('data-page="1"');
    expect(html).toContain('data-page="2"');
    expect(html).toContain('data-page="3"');
    expect(html).not.toContain('ellipsis');
  });
});
