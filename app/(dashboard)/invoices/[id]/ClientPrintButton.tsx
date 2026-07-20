"use client";

import { MdPrint } from "react-icons/md";
import { Button } from "@/components/ui/button";

export default function ClientPrintButton() {
  return (
    <Button 
      onClick={() => window.print()}
      className="rounded-xl font-bold bg-primary hover:bg-primary/95 text-white shadow-md flex items-center gap-2"
    >
      <MdPrint className="h-5 w-5" />
      Print Invoice
    </Button>
  );
}
