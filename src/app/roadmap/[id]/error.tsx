"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 flex items-center justify-center min-h-[70vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-xl text-center text-red-500">
            Unable to load roadmap
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {error.message || "There was an issue loading this roadmap. The roadmap may not exist or you may not have permission to view it."}
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Button onClick={reset} variant="outline">Try again</Button>
            <Link href="/roadmap">
              <Button>Return to roadmaps</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 