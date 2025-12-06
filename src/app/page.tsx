import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { Box } from '@mantine/core';

export default function Home() {
  return (
    <Box>
      <Header />
      <main>
        <Dashboard />
      </main>
    </Box>
  );
}
