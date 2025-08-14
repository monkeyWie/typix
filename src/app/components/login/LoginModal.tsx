import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/app/components/ui/input-otp";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import { useAuth } from "@/app/hooks/useAuth";
import { authClient } from "@/app/lib/auth-client";
import { useUIStore } from "@/app/stores";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { AlertCircle, Eye, EyeOff, Lock, Mail, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SocialLoginButtons } from "./SocialLoginButtons";

type AuthModalState = "login" | "register" | "otp";

export function LoginModal() {
	const { isLoginModalOpen, closeLoginModal } = useUIStore();
	const { signIn, signUp, isLogin, user } = useAuth();
	const { t } = useTranslation();

	const [modalState, setModalState] = useState<AuthModalState>("login");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isResendingOtp, setIsResendingOtp] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [otpCode, setOtpCode] = useState("");
	const [pendingEmail, setPendingEmail] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
	});

	// Check if email verification is enabled via environment variable
	const isEmailVerificationEnabled = import.meta.env.AUTH_EMAIL_VERIFICATION_ENABLED === "true";

	const resetAllState = () => {
		setFormData({ name: "", email: "", password: "" });
		setShowPassword(false);
		setModalState("login");
		setError(null);
		setIsLoading(false);
		setIsResendingOtp(false);
		setOtpCode("");
		setPendingEmail("");
	};

	const getModalContent = () => {
		switch (modalState) {
			case "login":
				return {
					title: t("auth.welcomeBack"),
					description: t("auth.loginDescription"),
				};
			case "register":
				return {
					title: t("auth.createAccount"),
					description: t("auth.registerDescription"),
				};
			case "otp":
				return {
					title: t("auth.verifyEmail"),
					description: null,
				};
		}
	};

	// Close modal when user successfully logs in
	useEffect(() => {
		if (isLogin && user && isLoginModalOpen) {
			handleClose();
		}
	}, [isLogin, user, isLoginModalOpen]);

	// Handle form input changes
	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Toggle between login and register mode
	const toggleMode = () => {
		setModalState(modalState === "login" ? "register" : "login");
		setFormData({ name: "", email: "", password: "" });
		setShowPassword(false);
		setError(null);
		setOtpCode("");
		setPendingEmail("");
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			if (modalState === "login") {
				// Login
				const response = await signIn.email({
					email: formData.email,
					password: formData.password,
				});

				if (response.error) {
					const errorCode = response.error.code;

					// Handle specific error types with localized messages based on error codes
					switch (errorCode) {
						case "INVALID_EMAIL":
							setError(t("auth.invalidEmail"));
							break;
						case "INVALID_EMAIL_OR_PASSWORD":
							setError(t("auth.invalidEmailOrPassword"));
							break;
						case "EMAIL_NOT_VERIFIED":
							// Email not verified, redirect to OTP verification
							setPendingEmail(formData.email);
							setModalState("otp");
							setError(null); // Clear any existing errors
							return;
						default:
							setError(response.error.message || t("auth.loginFailed"));
							break;
					}
					return;
				}

				window.location.reload();
				return;
			}

			// Register
			const response = await signUp.email({
				name: formData.name,
				email: formData.email,
				password: formData.password,
			});

			if (response.error) {
				const errorCode = response.error.code;

				// Handle specific error types with localized messages based on error codes
				switch (errorCode) {
					case "INVALID_EMAIL":
						setError(t("auth.invalidEmail"));
						break;
					case "PASSWORD_TOO_SHORT":
						setError(t("auth.passwordTooShort"));
						break;
					case "PASSWORD_TOO_LONG":
						setError(t("auth.passwordTooLong"));
						break;
					case "USER_ALREADY_EXISTS":
						setError(t("auth.userAlreadyExists"));
						break;
					default:
						setError(response.error.message || t("auth.registerFailed"));
						break;
				}
				return;
			}

			// If email verification is enabled and registration was successful, show OTP verification
			if (isEmailVerificationEnabled && response.data) {
				setPendingEmail(formData.email);
				setModalState("otp");
				return; // Don't close modal, wait for OTP verification
			}

			window.location.reload();
		} catch (error: any) {
			console.error("Authentication error:", error);
			setError(error.message || t("auth.networkError"));
		} finally {
			setIsLoading(false);
		}
	};

	// Handle OTP verification with auto-submit
	const handleOTPVerification = async (code: string) => {
		setIsLoading(true);
		setError(null);

		try {
			// Verify the OTP - better-auth will automatically sign in the user if autoSignInAfterVerification is enabled
			const verificationResponse = await authClient.emailOtp.verifyEmail({
				email: pendingEmail,
				otp: code,
			});

			console.log("verificationResponse.error?.code", verificationResponse.error?.code);

			if (verificationResponse.error) {
				const errorCode = verificationResponse.error.code;

				// Handle specific error types with localized messages based on error codes
				switch (errorCode) {
					case "INVALID_OTP":
						setError(t("auth.invalidVerificationCode"));
						// Don't clear the code for invalid OTP - user might just need to fix one digit
						break;
					case "OTP_EXPIRED":
						setError(t("auth.verificationCodeExpired"));
						// Clear the code when expired since it's no longer valid
						setOtpCode("");
						break;
					case "TOO_MANY_ATTEMPTS":
						setError(t("auth.tooManyAttempts"));
						// Clear the code when too many attempts
						setOtpCode("");
						break;
					case "INVALID_EMAIL":
						setError(t("auth.invalidEmail"));
						// Don't clear for these errors
						break;
					case "USER_NOT_FOUND":
						setError(t("auth.userNotFound"));
						// Don't clear for these errors
						break;
					default:
						setError(verificationResponse.error.message || t("auth.otpVerificationFailed"));
						// Don't clear for unknown errors
						break;
				}

				return;
			}

			window.location.reload();
		} catch (error: any) {
			console.error("OTP verification error:", error);
			setError(error.message || t("auth.otpVerificationError"));
			// Don't clear the code for network/generic errors
		} finally {
			setIsLoading(false);
		}
	};

	// Handle OTP input change with auto-submit
	const handleOTPChange = (value: string) => {
		setOtpCode(value);
		setError(null); // Clear error when user starts typing

		// Auto-submit when 6 digits are entered
		if (value.length === 6) {
			handleOTPVerification(value);
		}
	};

	// Resend OTP
	const handleResendOTP = async () => {
		setIsResendingOtp(true);
		setError(null);

		try {
			const response = await authClient.emailOtp.sendVerificationOtp({
				email: pendingEmail,
				type: "email-verification",
			});

			if (response.error) {
				setError(response.error.message || t("auth.otpResendFailed"));
				return;
			}

			// Show success message or handle success
			console.log("OTP resent successfully");
		} catch (error: any) {
			console.error("OTP resend error:", error);
			setError(error.message || t("auth.otpResendError"));
		} finally {
			setIsResendingOtp(false);
		}
	};

	// Reset form when modal closes
	const handleClose = () => {
		closeLoginModal();
		resetAllState();
	};

	return (
		<Dialog open={isLoginModalOpen} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="space-y-3">
					<DialogTitle className="text-center font-bold text-2xl">{getModalContent().title}</DialogTitle>
					{modalState === "otp" ? (
						<div className="space-y-1 text-center">
							<p className="text-muted-foreground text-sm">{t("auth.otpInstructions")}</p>
							<p className="text-muted-foreground text-xs">{pendingEmail}</p>
						</div>
					) : (
						<DialogDescription className="text-center text-muted-foreground">
							{getModalContent().description}
						</DialogDescription>
					)}
				</DialogHeader>

				{/* Global Error Message - Always at the top */}
				{error && (
					<div className="fade-in flex animate-in items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600 text-sm duration-200">
						<AlertCircle className="h-4 w-4 flex-shrink-0" />
						<span>{error}</span>
					</div>
				)}

				<div className="space-y-6">
					{modalState === "otp" ? (
						<div className="space-y-4">
							{/* Main OTP Content - Centered */}
							<div className="flex flex-col items-center justify-center py-4">
								{/* OTP Input Container */}
								<div className="flex flex-col items-center space-y-3">
									<div className="flex justify-center">
										<InputOTP
											value={otpCode}
											onChange={handleOTPChange}
											maxLength={6}
											disabled={isLoading}
											className="gap-3"
											pattern={REGEXP_ONLY_DIGITS}
											inputMode="numeric"
											autoComplete="one-time-code"
										>
											<InputOTPGroup className="gap-3">
												<InputOTPSlot
													index={0}
													className="h-12 w-12 rounded-lg border-2 font-semibold text-lg transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
												/>
												<InputOTPSlot
													index={1}
													className="h-12 w-12 rounded-lg border-2 font-semibold text-lg transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
												/>
												<InputOTPSlot
													index={2}
													className="h-12 w-12 rounded-lg border-2 font-semibold text-lg transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
												/>
												<InputOTPSlot
													index={3}
													className="h-12 w-12 rounded-lg border-2 font-semibold text-lg transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
												/>
												<InputOTPSlot
													index={4}
													className="h-12 w-12 rounded-lg border-2 font-semibold text-lg transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
												/>
												<InputOTPSlot
													index={5}
													className="h-12 w-12 rounded-lg border-2 font-semibold text-lg transition-all duration-200 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
												/>
											</InputOTPGroup>
										</InputOTP>
									</div>

									{/* Status Area - Fixed height to prevent layout shifts */}
									<div className="flex h-6 w-full items-center justify-center">
										{isLoading && (
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
										)}
									</div>
								</div>
							</div>

							{/* Resend Section */}
							<div className="space-y-2 text-center">
								<p className="text-muted-foreground text-sm">{t("auth.didntReceiveCode")}</p>
								<Button
									type="button"
									variant="ghost"
									className="font-medium text-primary hover:bg-primary/10 hover:text-primary/80"
									onClick={handleResendOTP}
									disabled={isLoading || isResendingOtp}
								>
									{isResendingOtp ? (
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									) : (
										t("auth.resendCode")
									)}
								</Button>
							</div>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							{modalState === "register" && (
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
											required={modalState === "register"}
										/>
									</div>
								</div>
							)}

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

							<Button type="submit" className="w-full" size="lg" disabled={isLoading}>
								{isLoading ? (
									<div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
								) : modalState === "login" ? (
									t("auth.login")
								) : (
									t("auth.register")
								)}
							</Button>
						</form>
					)}

					{modalState !== "otp" && (
						<>
							<SocialLoginButtons isLoading={isLoading} onError={setError} />

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<Separator className="w-full" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-background px-2 text-muted-foreground">{t("auth.or")}</span>
								</div>
							</div>

							<div className="text-center">
								<p className="text-muted-foreground text-sm">
									{modalState === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
								</p>
								<Button type="button" variant="link" className="h-auto p-0 font-semibold" onClick={toggleMode}>
									{modalState === "login" ? t("auth.signUpNow") : t("auth.goToLogin")}
								</Button>
							</div>
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
