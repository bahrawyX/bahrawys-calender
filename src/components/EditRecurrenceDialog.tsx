'use client';

import React, { useState } from 'react';
import type { EditScope } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EditRecurrenceDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (scope: EditScope) => void;
  action: 'edit' | 'delete';
}

const SCOPES: { value: EditScope; label: string; description: string }[] = [
  { value: 'this', label: 'This event', description: 'Only change this occurrence' },
  { value: 'this_and_following', label: 'This and following events', description: 'Change this and all future occurrences' },
  { value: 'all', label: 'All events', description: 'Change every occurrence in the series' },
];

export const EditRecurrenceDialog: React.FC<EditRecurrenceDialogProps> = ({
  open,
  onClose,
  onConfirm,
  action,
}) => {
  const [selected, setSelected] = useState<EditScope>('this');

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {action === 'delete' ? 'Delete recurring event' : 'Edit recurring event'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {SCOPES.map((scope) => (
            <button
              key={scope.value}
              type="button"
              onClick={() => setSelected(scope.value)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${
                selected === scope.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border/60 hover:bg-muted/30'
              }`}
            >
              <p className="text-sm font-medium text-foreground">{scope.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{scope.description}</p>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => { onConfirm(selected); onClose(); }}
            variant={action === 'delete' ? 'destructive' : 'default'}
          >
            {action === 'delete' ? 'Delete' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRecurrenceDialog;
