"use client";

import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { Box } from '@mantine/core';
import { useEffect, useState } from 'react';
import ShareDictionary from './share/page';
import { isShareDomain } from '@/utils/domain';

export default function Home() {
  const [isShare, setIsShare] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isShareDomain()) {
      setIsShare(true);
    }
  }, []);

  if (!mounted) return null; // Avoid hydration mismatch

  if (isShare) {
    return <ShareDictionary />;
  }

  return (
    <Box>
      <Header />
      <main>
        <Dashboard />
      </main>
    </Box>
  );
}
