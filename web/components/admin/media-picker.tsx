"use client";

import * as React from "react";
import { ImageIcon, Upload, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listMedia,
  uploadMedia,
  type MediaAsset,
} from "@/lib/admin/media";
import { toast } from "sonner";

export interface MediaPickerProps {
  /** The current image URL held by the form field. */
  value: string;
  /** Called with the chosen image URL. */
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

/**
 * A controlled image picker for admin forms. Shows a preview of the current
 * value and opens a dialog with the media library (upload + pick + paste URL).
 * It only chooses a URL — the surrounding form still persists it.
 */
export function MediaPicker({
  value,
  onChange,
  label,
  className,
}: MediaPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [assets, setAssets] = React.useState<MediaAsset[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [urlDraft, setUrlDraft] = React.useState("");

  // Load the library lazily the first time the dialog opens. This runs from the
  // onOpenChange event (not a mount effect) to respect the repo's
  // set-state-in-effect rule.
  async function loadLibrary() {
    setLoading(true);
    const items = await listMedia();
    setAssets(items);
    setLoaded(true);
    setLoading(false);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !loaded && !loading) {
      void loadLibrary();
    }
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const asset = await uploadMedia(file);
    setUploading(false);
    if (!asset) {
      toast.error("Încărcarea imaginii a eșuat.");
      return;
    }
    setAssets((prev) => [asset, ...prev]);
    toast.success("Imagine încărcată.");
    onChange(asset.url);
  }

  function pick(url: string) {
    onChange(url);
    setOpen(false);
  }

  function applyUrlDraft() {
    const url = urlDraft.trim();
    if (!url) return;
    onChange(url);
    setUrlDraft("");
    setOpen(false);
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? <Label>{label}</Label> : null}
      <div className="flex items-center gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Previzualizare imagine"
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center border-dashed text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleOpenChange(true)}
        >
          <ImageIcon className="h-4 w-4" />
          Alege imagine
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bibliotecă media</DialogTitle>
            <DialogDescription>
              Alege o imagine din bibliotecă, încarcă una nouă sau lipește un
              URL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload */}
            <label
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary",
                uploading && "pointer-events-none opacity-70"
              )}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Se încarcă…" : "Încarcă o imagine nouă"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  void handleUpload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>

            {/* Library grid */}
            <div className="max-h-[45vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : assets.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Biblioteca este goală. Încarcă prima imagine.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {assets.map((asset) => {
                    const selected = asset.url === value;
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => pick(asset.url)}
                        title={asset.filename}
                        className={cn(
                          "group relative aspect-square overflow-hidden rounded-xl border-2 bg-secondary transition-colors",
                          selected
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-transparent hover:border-border"
                        )}
                        aria-pressed={selected}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset.url}
                          alt={asset.alt || asset.filename}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        {selected ? (
                          <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-warm-white">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Manual URL fallback */}
            <div className="space-y-1.5 border-t border-border pt-4">
              <Label htmlFor="media-picker-url">sau lipește un URL</Label>
              <div className="flex gap-2">
                <Input
                  id="media-picker-url"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  placeholder="https://..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyUrlDraft();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyUrlDraft}
                  disabled={!urlDraft.trim()}
                >
                  Folosește
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
