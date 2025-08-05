import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import { useAuth } from "@/app/hooks/useAuth";
import { useUIStore } from "@/app/stores";
import { AlertCircle, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function LoginModal() {
	const { isLoginModalOpen, closeLoginModal } = useUIStore();
	const { signIn, signUp } = useAuth();
	const { t } = useTranslation();
	const [isLoginMode, setIsLoginMode] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
	});

	// Handle form input changes
	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Toggle between login and register mode
	const toggleMode = () => {
		setIsLoginMode(!isLoginMode);
		setFormData({ name: "", email: "", password: "" });
		setShowPassword(false);
		setError(null);
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			if (isLoginMode) {
				// Login
				const response = await signIn.email({
					email: formData.email,
					password: formData.password,
				});

				if (response.error) {
					setError(response.error.message || t("auth.loginFailed"));
					return;
				}
			} else {
				// Register
				const response = await signUp.email({
					name: formData.name,
					email: formData.email,
					password: formData.password,
				});

				if (response.error) {
					setError(response.error.message || t("auth.registerFailed"));
					return;
				}
			}

			// Close modal on success
			handleClose();
		} catch (error: any) {
			console.error("Authentication error:", error);
			setError(error.message || t("auth.networkError"));
		} finally {
			setIsLoading(false);
		}
	};

	// Reset form when modal closes
	const handleClose = () => {
		closeLoginModal();
		setFormData({ name: "", email: "", password: "" });
		setShowPassword(false);
		setIsLoginMode(true);
		setError(null);
		setIsLoading(false);
	};

	return (
		<Dialog open={isLoginModalOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="space-y-3">
					<DialogTitle className="text-center font-bold text-2xl">
						{isLoginMode ? t("auth.welcomeBack") : t("auth.createAccount")}
					</DialogTitle>
					<DialogDescription className="text-center text-muted-foreground">
						{isLoginMode ? t("auth.loginDescription") : t("auth.registerDescription")}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Error Message */}
					{error && (
						<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
							<AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
							<p className="text-red-700 text-sm">{error}</p>
						</div>
					)}

					{/* Login/Register Form */}
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Name field - only for register */}
						{!isLoginMode && (
							<div className="space-y-2">
								<Label htmlFor="name">{t("auth.username")}</Label>
								<div className="relative">
									<User className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="name"
										type="text"
										placeholder={t("auth.enterUsername")}
										value={formData.name}
										onChange={(e) => handleInputChange("name", e.target.value)}
										className="pl-10"
										required={!isLoginMode}
									/>
								</div>
							</div>
						)}

						{/* Email field */}
						<div className="space-y-2">
							<Label htmlFor="email">{t("auth.email")}</Label>
							<div className="relative">
								<Mail className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="email"
									type="email"
									placeholder={t("auth.enterEmail")}
									value={formData.email}
									onChange={(e) => handleInputChange("email", e.target.value)}
									className="pl-10"
									required
								/>
							</div>
						</div>

						{/* Password field */}
						<div className="space-y-2">
							<Label htmlFor="password">{t("auth.password")}</Label>
							<div className="relative">
								<Lock className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder={t("auth.enterPassword")}
									value={formData.password}
									onChange={(e) => handleInputChange("password", e.target.value)}
									className="pr-10 pl-10"
									required
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8 p-0"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</Button>
							</div>
						</div>

						{/* Submit Button */}
						<Button type="submit" className="w-full" size="lg" disabled={isLoading}>
							{isLoading ? (
								<>
									<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									{t("auth.processing")}
								</>
							) : isLoginMode ? (
								t("auth.login")
							) : (
								t("auth.register")
							)}
						</Button>
					</form>

					{/* Divider */}
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<Separator className="w-full" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">{t("auth.or")}</span>
						</div>
					</div>

					{/* Toggle between login and register */}
					<div className="text-center">
						<p className="text-muted-foreground text-sm">{isLoginMode ? t("auth.noAccount") : t("auth.hasAccount")}</p>
						<Button type="button" variant="link" className="h-auto p-0 font-semibold" onClick={toggleMode}>
							{isLoginMode ? t("auth.signUpNow") : t("auth.goToLogin")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
