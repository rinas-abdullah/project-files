"use client";

import { Button } from "@/components/ui";

/** Uses the browser's print dialog, which offers "Save as PDF". */
export function PrintButton() {
  return (
    <Button type="button" variant="secondary" className="no-print" onClick={() => window.print()}>
      طباعة / حفظ PDF
    </Button>
  );
}
