import React from 'react';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';

interface TimelineConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewExisting: () => void;
  onAddNewEvent: () => void;
  onCancel: () => void;
}

const TimelineConflictDialog: React.FC<TimelineConflictDialogProps> = ({
  open,
  onOpenChange,
  onViewExisting,
  onAddNewEvent,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] rounded-2xl p-5 sm:p-5">
        <DialogHeader>
          <DialogTitle className="text-base">Events already scheduled</DialogTitle>
          <DialogDescription>
            There are already events at this time. What would you like to do?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:justify-start sm:space-x-0">
          <Button
            type="button"
            className="w-full"
            aria-label="View events that overlap this time"
            onClick={onViewExisting}
          >
            View Existing Events
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            aria-label="Add a new event at the selected time"
            onClick={onAddNewEvent}
          >
            Add New Event
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimelineConflictDialog;
