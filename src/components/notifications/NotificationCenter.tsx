
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotificationCenter() {
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
      >
        <Bell className="h-4 w-4" />
      </Button>
    </div>
  );
}
