import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="h-4 bg-gray-200 animate-pulse rounded-lg w-32 mb-2"></div>
          <div className="h-7 bg-gray-200 animate-pulse rounded-lg w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 animate-pulse rounded-lg w-48"></div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="h-4 bg-gray-200 animate-pulse rounded-lg w-40 mb-2"></div>
          <div className="h-2 bg-gray-200 animate-pulse rounded-lg w-48"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 bg-gray-200 animate-pulse rounded-lg w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="h-4 bg-gray-200 animate-pulse rounded-lg w-full mb-2"></div>
                    <div className="h-2 bg-gray-200 animate-pulse rounded-lg w-3/4"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-5 bg-gray-200 animate-pulse rounded-lg w-40"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-10 bg-gray-200 animate-pulse rounded-lg w-full"></div>
              <div className="h-10 bg-gray-200 animate-pulse rounded-lg w-full"></div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <div className="mb-4">
            <div className="flex border-b">
              <div className="h-8 bg-gray-200 animate-pulse rounded-lg w-24 mr-2"></div>
              <div className="h-8 bg-gray-200 animate-pulse rounded-lg w-24"></div>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="h-5 bg-gray-200 animate-pulse rounded-lg w-40"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="h-4 bg-gray-200 animate-pulse rounded-lg w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 animate-pulse rounded-lg w-full"></div>
                    <div className="h-3 bg-gray-200 animate-pulse rounded-lg w-4/5 mt-1"></div>
                  </div>
                  
                  <div>
                    <div className="h-4 bg-gray-200 animate-pulse rounded-lg w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 animate-pulse rounded-lg w-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="h-5 bg-gray-200 animate-pulse rounded-lg w-48"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="h-4 bg-gray-200 animate-pulse rounded-lg w-48 mb-2"></div>
                      <div className="h-3 bg-gray-200 animate-pulse rounded-lg w-full"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 