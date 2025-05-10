import { Skeleton } from "../ui/skeleton"


export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[300px]" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}
