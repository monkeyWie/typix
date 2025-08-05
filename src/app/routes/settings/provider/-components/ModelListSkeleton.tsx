import { Skeleton } from "@/app/components/ui/skeleton";

export function ModelListSkeleton() {
	return (
		<div className="space-y-4">
			<h3 className="font-medium text-lg">Models</h3>
			<div className="space-y-0">
				{[1, 2, 3].map((i) => (
					<div key={i} className="-mx-1 flex items-center justify-between rounded px-1 py-3">
						{/* Left side: Icon and model info skeleton */}
						<div className="flex min-w-0 flex-1 items-center gap-3">
							<Skeleton className="h-5 w-5 flex-shrink-0" />
							<div className="min-w-0 flex-1 space-y-1">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-24" />
							</div>
						</div>

						{/* Right side: Switch skeleton */}
						<Skeleton className="h-5 w-8 flex-shrink-0" />
					</div>
				))}
			</div>
		</div>
	);
}
