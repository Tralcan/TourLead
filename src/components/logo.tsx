import Link from "next/link";
import { Mountain } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-foreground">
      <div className="p-2 bg-accent rounded-md text-accent-foreground">
        <Mountain className="h-6 w-6" />
      </div>
      <span className="text-xl font-bold font-headline hidden sm:inline-block">
        TourLead Connect
      </span>
    </Link>
  );
}
