'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function CreatorsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Creators</h1>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Users size={48} className="mb-4 text-teal-500" />
          <p className="text-lg font-medium">Creator Management</p>
          <p className="text-sm mt-1">Creator success tools coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
