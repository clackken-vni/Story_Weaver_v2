import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/app/(user)/page';
import Link from 'next/link';

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />);
    expect(screen.getByText('StoryWeaver')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<HomePage />);
    expect(screen.getByText(/AI-powered Vietnamese story writing/)).toBeInTheDocument();
  });

  it('renders the call-to-action button', () => {
    render(<HomePage />);
    const button = screen.getByText('Start Writing');
    expect(button).toBeInTheDocument();
  });

  it('has a link to the wizard page', () => {
    render(<HomePage />);
    const link = screen.getByRole('link', { name: 'Start Writing' });
    expect(link).toHaveAttribute('href', '/wizard');
  });

  it('renders the main section with correct structure', () => {
    render(<HomePage />);
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('min-h-screen');
  });
});