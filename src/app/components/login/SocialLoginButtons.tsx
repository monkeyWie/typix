import { Button } from "@/app/components/ui/button";
import { authClient } from "@/app/lib/auth-client";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface SocialLoginButtonsProps {
	isLoading?: boolean;
	onError?: (error: string) => void;
}

export function SocialLoginButtons({ isLoading = false, onError }: SocialLoginButtonsProps) {
	const { t } = useTranslation();
	const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

	// Social providers configuration
	const socialProviders = [
		{
			id: "google" as const,
			name: "Google",
			enabled: import.meta.env.AUTH_SOCIAL_GOOGLE_ENABLED === "true",
			continueText: t("auth.continueWithGoogle"),
		},
		{
			id: "github" as const,
			name: "GitHub",
			enabled: import.meta.env.AUTH_SOCIAL_GITHUB_ENABLED === "true",
			continueText: t("auth.continueWithGithub"),
		},
	];

	// Filter enabled providers
	const enabledProviders = socialProviders.filter((provider) => provider.enabled);

	// If no social providers are enabled, don't render anything
	if (enabledProviders.length === 0) {
		return null;
	}

	const handleSocialLogin = async (provider: "google" | "github") => {
		if (isLoading || loadingProvider) return;

		try {
			setLoadingProvider(provider);

			const response = await authClient.signIn.social({
				provider,
				// callbackURL: "/", // Redirect to home page after successful login
			});

			if (response.error) {
				onError?.(response.error.message || t("auth.socialLoginFailed"));
				setLoadingProvider(null);
				return;
			}

			// If we reach here, the redirect should happen automatically
			// Keep loading state - page will redirect to OAuth provider
		} catch (error: any) {
			console.error(`${provider} login error:`, error);
			onError?.(error.message || t("auth.socialLoginFailed"));
			setLoadingProvider(null);
		}
	};

	return (
		<div className="space-y-3">
			{enabledProviders.map((provider) => {
				const isCurrentProviderLoading = loadingProvider === provider.id;

				return (
					<Button
						key={provider.id}
						type="button"
						variant="outline"
						className="w-full transition-all duration-200"
						onClick={() => handleSocialLogin(provider.id)}
						disabled={isLoading || !!loadingProvider}
					>
						{isCurrentProviderLoading ? (
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						) : (
							<>
								<img
									src={`https://unpkg.com/simple-icons@v15/icons/${provider.id}.svg`}
									className="mr-2 h-5 w-5 dark:brightness-0 dark:contrast-100 dark:invert"
									alt={`${provider.name} icon`}
								/>
								{provider.continueText}
							</>
						)}
					</Button>
				);
			})}
		</div>
	);
}
