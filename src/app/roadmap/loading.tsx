import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="space-y-8">
        <div className="text-center">
          <div className="h-8 bg-gray-200 animate-pulse rounded-lg w-64 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 animate-pulse rounded-lg w-96 mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 animate-pulse rounded-lg w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 animate-pulse rounded-lg w-72"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 animate-pulse rounded-lg w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 animate-pulse rounded-lg w-72"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 bg-gray-200 animate-pulse h-8 w-8 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 animate-pulse rounded-lg w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 animate-pulse rounded-lg w-48"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <div className="h-6 bg-gray-200 animate-pulse rounded-lg w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-5 bg-gray-200 animate-pulse rounded-lg w-48 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 animate-pulse rounded-lg"></div>
                    <div className="h-3 bg-gray-200 animate-pulse rounded-lg"></div>
                    <div className="h-3 bg-gray-200 animate-pulse rounded-lg w-3/4"></div>
                  </div>
                  <div className="mt-4 h-2 bg-gray-200 animate-pulse rounded-lg"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 