import { api } from '@/lib/api';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="container py-20">
        <h1 className="text-5xl font-bold mb-6">StoryWeaver</h1>
        <p className="text-xl text-muted-foreground mb-8">
          AI-powered Vietnamese story writing made simple
        </p>
        <Link
          href="/wizard"
          className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Writing
        </Link>
      </section>
    </main>
  );
}