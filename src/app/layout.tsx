import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider, Container } from '@mantine/core';
import { Providers } from '@/components/Providers';
import '@mantine/core/styles.css';
import { Navbar } from "@/components/Navbar";
import './globals.css';

export const metadata: Metadata = {
  title: 'Steam Year In Review',
  description: 'Generate your Steam Year in Review summary',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider defaultColorScheme="dark">
          <Providers>
            <Navbar />
            <Container size="md" py="xl">
              {children}
            </Container>
          </Providers>
        </MantineProvider>
      </body>
    </html>
  );
}
