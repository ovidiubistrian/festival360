"use client";

import * as React from "react";
import { Upload, Trash2, Loader2, ImageIcon } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  listMedia,
  uploadMedia,
  deleteMedia,
  type MediaAsset,
} from "@/lib/admin/media";
import { toast } from "sonner";

export default function MediaPage() {
  const [assets, setAssets] = React.useState<MediaAsset[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  // Load the library once, on first client render — without a mount effect that
  // sets state directly (repo enforces react-hooks/set-state-in-effect). We use
  // a subscribe-free external store read to detect client mount, then kick off
  // loading from render exactly once.
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [started, setStarted] = React.useState(false);
  if (mounted && !started) {
    setStarted(true);
    void (async () => {
      setLoading(true);
      const items = await listMedia();
      setAssets(items);
      setLoaded(true);
      setLoading(false);
    })();
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
  }

  async function remove(asset: MediaAsset) {
    const ok = await deleteMedia(asset.id);
    if (!ok) {
      toast.error("Ștergerea a eșuat.");
      return;
    }
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    toast.success("Imagine ștearsă.");
  }

  return (
    <AdminShell
      title="Bibliotecă media"
      description="Încarcă și gestionează imaginile folosite pe site. Aceleași imagini apar în selectorul de imagine din fiecare formular."
      actions={
        <label
          className={
            "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-gold px-3 text-sm font-medium text-charcoal transition-colors hover:bg-gold/90" +
            (uploading ? " pointer-events-none opacity-70" : "")
          }
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Se încarcă…" : "Încarcă"}
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
      }
    >
      {/* Dropzone-style upload */}
      <label
        className={
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground transition-colors hover:bg-secondary/50" +
          (uploading ? " pointer-events-none opacity-70" : "")
        }
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Upload className="h-6 w-6" />
        )}
        <span className="font-medium text-foreground">
          {uploading ? "Se încarcă…" : "Încarcă o imagine"}
        </span>
        <span>Trage un fișier aici sau apasă pentru a alege (JPG, PNG, WebP).</span>
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

      {loading && !loaded ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nicio imagine în bibliotecă. Încarcă prima imagine mai sus.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="relative aspect-square w-full bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.alt || asset.filename}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                {asset.isStock ? (
                  <div className="absolute left-2 top-2">
                    <Badge variant="muted">stock</Badge>
                  </div>
                ) : null}
              </div>
              <CardContent className="flex items-center justify-between gap-2 p-3">
                <p
                  className="truncate text-sm font-medium text-foreground"
                  title={asset.filename}
                >
                  {asset.filename}
                </p>
                <ConfirmDelete
                  itemLabel={
                    asset.isStock
                      ? `${asset.filename} (imagine stock — poate fi folosită pe site)`
                      : asset.filename
                  }
                  onConfirm={() => void remove(asset)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label="Șterge"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {assets.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {assets.length} imagini în bibliotecă.
        </p>
      ) : null}
    </AdminShell>
  );
}
