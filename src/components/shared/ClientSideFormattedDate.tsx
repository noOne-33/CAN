
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface ClientSideFormattedDateProps {
  isoDateString: string;
  formatString?: string;
}

export default function ClientSideFormattedDate({ isoDateString, formatString = 'PPpp' }: ClientSideFormattedDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>("..."); // Initial placeholder

  useEffect(() => {
    // This effect runs only on the client, after hydration
    try {
      const date = new Date(isoDateString);
      // Check if date is valid before formatting
      if (!isNaN(date.getTime())) {
        setFormattedDate(format(date, formatString));
      } else {
        setFormattedDate("Invalid Date");
      }
    } catch (error) {
      console.error("Error formatting date:", isoDateString, error);
      setFormattedDate("Error"); // Or handle error appropriately
    }
  }, [isoDateString, formatString]);

  // Render the placeholder on the server and during the initial client render.
  // The actual date will be filled in by useEffect on the client.
  // suppressHydrationWarning can be used if the placeholder itself might cause minor, benign warnings,
  // but the goal is for the server-rendered output and initial client output for this specific part to match.
  return <span suppressHydrationWarning>{formattedDate}</span>;
}
