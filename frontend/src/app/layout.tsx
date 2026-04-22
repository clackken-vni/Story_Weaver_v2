import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'StoryWeaver',
  description: 'AI-powered Vietnamese story writing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}