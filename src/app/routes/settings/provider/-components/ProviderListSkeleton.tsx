import { Skeleton } from "@/app/components/ui/skeleton";

interface ProviderListSkeletonProps {
	/**
	 * Number of skeleton items to render
	 */
	count?: number;
}

export function ProviderListSkeleton({ count = 6 }: ProviderListSkeletonProps) {
	return (
		<div className="flex-1 p-4">
			<div className="space-y-3">
				{Array.from({ length: count }, () => (
					<div key={Math.random().toString(36)} className="flex items-center space-x-3">
						<Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
						<Skeleton className="h-4 w-full" />
					</div>
				))}
			</div>
		</div>
	);
}
