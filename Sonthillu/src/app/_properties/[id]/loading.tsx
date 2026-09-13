import { Skeleton } from '@/components/ui/Skeleton';

export default function PropertyDetailLoading() {
  return (
    <div className="bg-white">
      <div className="container-page py-6 lg:py-8">
        <Skeleton className="h-4 w-48 mb-6" />

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />

            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-muted rounded-xl border border-border">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
