import { FeaturedModels } from "@/components/featured-models";
import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Providers } from "@/components/providers";

export function HomePage() {
	return (
		<main className="min-h-screen">
			<Header />
			<Hero />
			<Features />
			<FeaturedModels />
			<Providers />
			<Footer />
		</main>
	);
}
