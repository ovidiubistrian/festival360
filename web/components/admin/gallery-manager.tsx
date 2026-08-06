"use client";

import * as React from "react";
import {
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadMedia } from "@/lib/admin/media";
import { toast } from "sonner";

export interface GalleryManagerProps {
  /** The list of gallery photo URLs (extra photos). */
  images: string[];
  /** Called with the next list whenever it changes. */
  onImagesChange: (next: string[]) => void;
  /** The current cover / profile photo URL. */
  cover: string;
  /** Called when a photo is promoted to cover. */
  onCoverChange: (url: string) => void;
  className?: string;
}

/**
 * Photo gallery manager for admin forms. Uploads multiple files at once via
 * `uploadMedia`, supports a paste-URL fallback, and lets the admin reorder,
 * remove, and promote any photo to the cover ("profile") image.
 *
 * The cover lives in a separate form field (the "Imagine principală" picker);
 * "Fă profil" simply mirrors the chosen URL back through `onCoverChange`, so
 * both controls stay in sync.
 */
export function GalleryManager({
  images,
  onImagesChange,
  cover,
  onCoverChange,
  className,
}: GalleryManagerProps) {
  const [uploading, setUploading] = React.useState(false);
  const [urlDraft, setUrlDraft] = React.useState("");

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const selected = Array.from(files);
    const uploaded: string[] = [];
    let failures = 0;
    for (const file of selected) {
      const asset = await uploadMedia(file);
      if (asset) {
        uploaded.push(asset.url);
      } else {
        failures += 1;
      }
    }
    setUploading(false);

    if (uploaded.length > 0) {
      onImagesChange([...images, ...uploaded]);
      toast.success(
        uploaded.length === 1
          ? "Poză adăugată."
          : `${uploaded.length} poze adăugate.`
      );
    }
    if (failures > 0) {
      toast.error(
        failures === 1
          ? "O poză nu a putut fi încărcată."
          : `${failures} poze nu au putut fi încărcate.`
      );
    }
  }

  function addUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    if (images.includes(url)) {
      toast.error("Poza există deja în galerie.");
      return;
    }
    onImagesChange([...images, url]);
    setUrlDraft("");
  }

  function removeAt(index: number) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= images.length) return;
    const copy = [...images];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onImagesChange(copy);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label>Galerie foto</Label>
        <label
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary",
            uploading && "pointer-events-none opacity-70"
          )}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {uploading ? "Se încarcă…" : "Adaugă poze"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
          Nicio poză încă.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((src, i) => {
            const isCover = src === cover;
            return (
              <li
                key={`${src}-${i}`}
                className={cn(
                  "group relative aspect-[4/3] overflow-hidden rounded-xl border-2 bg-secondary",
                  isCover ? "border-primary" : "border-border"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Poză ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />

                {isCover ? (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-warm-white">
                    <Star className="h-3 w-3 fill-current" />
                    Profil
                  </span>
                ) : null}

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label="Șterge poza"
                  className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-charcoal/60 text-warm-white opacity-0 transition-opacity hover:bg-destructive focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Bottom controls: reorder + make cover */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-charcoal/70 to-transparent p-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Mută poza mai devreme"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-card text-charcoal transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === images.length - 1}
                      aria-label="Mută poza mai târziu"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-card text-charcoal transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCoverChange(src)}
                    disabled={isCover}
                    className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-charcoal transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Star
                      className={cn("h-3.5 w-3.5", isCover && "fill-current")}
                    />
                    {isCover ? "Profil" : "Fă profil"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* URL fallback */}
      <div className="flex gap-2">
        <Input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="sau adaugă prin URL: https://..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addUrl}
          disabled={!urlDraft.trim()}
        >
          Adaugă
        </Button>
      </div>
    </div>
  );
}
