import { Skeleton } from "@/app/components/ui/skeleton";

export function ProviderDetailSkeleton() {
	return (
		<div className="mx-auto max-w-5xl space-y-6 p-4 px-8 pt-8 pb-4">
			{/* Header section */}
			<div className="mb-6">
				<div className="flex items-center justify-between">
					<div className="flex-1">
						<Skeleton className="h-8 w-48" /> {/* Provider name */}
						<Skeleton className="mt-1 h-4 w-64" /> {/* Provider description */}
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="h-6 w-12" /> {/* Switch */}
					</div>
				</div>
			</div>

			{/* Settings section */}
			<div className="space-y-8">
				{/* Setting field 1 */}
				<div className="flex flex-col gap-4 md:flex-row md:items-start">
					<div className="md:w-1/3">
						<Skeleton className="h-5 w-24" /> {/* Field label */}
						<Skeleton className="mt-1 h-4 w-32" /> {/* Field description */}
					</div>
					<div className="md:w-2/3 md:flex-1">
						<Skeleton className="h-10 w-full" /> {/* Input field */}
					</div>
				</div>

				{/* Setting field 2 */}
				<div className="flex flex-col gap-4 md:flex-row md:items-start">
					<div className="md:w-1/3">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="mt-1 h-4 w-40" />
					</div>
					<div className="md:w-2/3 md:flex-1">
						<Skeleton className="h-10 w-full" />
					</div>
				</div>
			</div>
		</div>
	);
}
