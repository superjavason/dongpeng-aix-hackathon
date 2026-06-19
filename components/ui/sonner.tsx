"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-lg border bg-white text-foreground shadow-lg text-sm",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
