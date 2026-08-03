"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDeleteProps {
  /** Human label of the item being deleted, shown in the prompt. */
  itemLabel: string;
  onConfirm: () => void;
  /** The clickable element that opens the confirm dialog. */
  trigger: React.ReactNode;
}

export function ConfirmDelete({
  itemLabel,
  onConfirm,
  trigger,
}: ConfirmDeleteProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive [&_svg]:size-4">
              <Trash2 />
            </span>
            Confirmă ștergerea
          </DialogTitle>
          <DialogDescription>
            Ești sigur că vrei să ștergi{" "}
            <span className="font-medium text-foreground">{itemLabel}</span>?
            Acțiunea nu poate fi anulată în această demonstrație.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Renunță
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            Șterge definitiv
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
