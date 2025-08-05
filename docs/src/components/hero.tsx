"use client";

import { Github, Send, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

// Simple Typewriter Component
function Typewriter({ text, onComplete }: { text: string; onComplete: () => void }) {
	const [displayText, setDisplayText] = useState("");
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isComplete, setIsComplete] = useState(false);

	useEffect(() => {
		setDisplayText("");
		setCurrentIndex(0);
		setIsComplete(false);
	}, [text]);

	useEffect(() => {
		if (currentIndex < text.length) {
			const timeout = setTimeout(() => {
				setDisplayText((prev) => prev + text[currentIndex]);
				setCurrentIndex((prev) => prev + 1);
			}, 80);
			return () => clearTimeout(timeout);
		}
		if (currentIndex === text.length && text.length > 0 && !isComplete) {
			// Typing completed, trigger callback immediately
			setIsComplete(true);
			onComplete();
		}
	}, [currentIndex, text, onComplete, isComplete]);

	return (
		<div className="min-h-[24px] font-mono text-base text-foreground">
			<span>{displayText}</span>
			<motion.span
				className="text-primary"
				animate={{ opacity: [0, 1, 0] }}
				transition={{
					duration: 1,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
				}}
			>
				|
			</motion.span>
		</div>
	);
}

export function Hero() {
	const t = useTranslations("hero");
	const [currentStep, setCurrentStep] = useState(0);
	const [isGenerating, setIsGenerating] = useState(false);
	const [showImage, setShowImage] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);
	const [typingComplete, setTypingComplete] = useState(false);
	const [buttonClicked, setButtonClicked] = useState(false);

	const prompts = [
		{
			text: "A futuristic cityscape at sunset with flying cars",
			image: "images/demo/future-city-sunset.png",
		},
		{
			text: "A magical forest with glowing mushrooms",
			image: "images/demo/glow-forest-mushrooms.png",
		},
		{
			text: "A cyberpunk street with neon lights",
			image: "images/demo/neon-cyberpunk-street.png",
		},
		{
			text: "An underwater city with coral reefs",
			image: "images/demo/coral-underwater-city.png",
		},
	];

	const currentPrompt = prompts[currentStep % prompts.length];

	const handleTypingComplete = () => {
		setTypingComplete(true);
		// Immediately trigger generation after typing completes
		setTimeout(() => {
			handleSendClick();
		}, 100);
	};

	const handleSendClick = () => {
		if (buttonClicked) return;

		setButtonClicked(true);
		handleGenerate();
	};

	const handleGenerate = () => {
		setIsGenerating(true);
		setShowImage(true);
		setImageLoaded(false);

		// Start with blurred image, then clear it after a short delay
		setTimeout(() => {
			setImageLoaded(true);
		}, 500);

		setTimeout(() => {
			setShowImage(false);
			setImageLoaded(false);
			setIsGenerating(false);
			setTypingComplete(false);
			setButtonClicked(false);
			setCurrentStep((prev) => prev + 1);
		}, 3000);
	};

	return (
		<motion.section
			className="px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-48"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{
				duration: 1,
				staggerChildren: 0.2,
				delayChildren: 0.3,
			}}
		>
			<div className="container mx-auto max-w-7xl">
				<div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
					{/* Left Content - Simplified */}
					<motion.div
						className="text-center lg:text-left"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						{/* Main Title */}
						<motion.h1
							className="mb-8 font-bold text-5xl leading-tight sm:text-6xl lg:text-7xl"
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.8, delay: 0.2 }}
						>
							<span className="ai-text-gradient">{t("title")}</span>
						</motion.h1>

						{/* Subtitle */}
						<motion.p
							className="mx-auto mb-12 max-w-2xl text-muted-foreground text-xl leading-relaxed lg:mx-0"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.3 }}
						>
							{t("subtitle")}
						</motion.p>

						{/* CTA Buttons */}
						<motion.div
							className="mx-auto flex max-w-lg flex-col justify-center gap-4 sm:flex-row lg:mx-0 lg:justify-start"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.4 }}
						>
							<motion.a
								href="https://typix.art"
								target="_blank"
								className="linear-button glow inline-flex flex-1 cursor-pointer items-center justify-center px-8 py-5 font-semibold"
								style={{ fontSize: "1.25rem" }}
								whileHover={{
									scale: 1.05,
									boxShadow: "0 8px 25px rgba(168, 85, 247, 0.4)",
								}}
								whileTap={{ scale: 0.95 }}
								transition={{ duration: 0.3 }}
								rel="noreferrer"
							>
								{t("primaryBtn")}
							</motion.a>

							<motion.a
								href="https://github.com/monkeyWie/typix"
								target="_blank"
								className="glow flex flex-1 items-center justify-center gap-3 rounded-2xl border border-border/20 bg-card/50 px-8 py-5 font-semibold text-foreground text-xl backdrop-blur-sm transition-all duration-300 hover:bg-card/70"
								whileHover={{
									scale: 1.05,
									boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
								}}
								whileTap={{ scale: 0.95 }}
								transition={{ duration: 0.3 }}
								rel="noreferrer"
							>
								<Github className="h-6 w-6" />
								GitHub
							</motion.a>
						</motion.div>
					</motion.div>

					{/* Right Content - Interactive Demo */}
					<motion.div
						className="relative"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.2 }}
					>
						<motion.div
							className="glow rounded-3xl border border-border/20 bg-card/50 p-8 backdrop-blur-sm"
							whileHover={{ scale: 1.02 }}
							transition={{ duration: 0.3 }}
						>
							{/* Generated Image Area */}
							<div className="mb-8">
								<AnimatePresence mode="wait">
									{showImage ? (
										<motion.div
											className="relative aspect-video overflow-hidden rounded-2xl border border-border/10"
											initial={{
												opacity: 0,
												scale: 0.8,
												filter: "blur(20px)",
											}}
											animate={{
												opacity: 1,
												scale: 1,
												filter: imageLoaded ? "blur(0px)" : "blur(10px)",
											}}
											exit={{ opacity: 0, scale: 0.8 }}
											transition={{
												duration: imageLoaded ? 1.5 : 0.3,
												ease: "easeOut",
											}}
											key="image"
										>
											<motion.img
												src={currentPrompt.image}
												alt={currentPrompt.text}
												className="h-full w-full rounded-2xl object-cover"
												initial={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
												animate={{
													opacity: 1,
													scale: 1,
													filter: imageLoaded ? "blur(0px)" : "blur(10px)",
												}}
												transition={{
													duration: imageLoaded ? 1.5 : 0.3,
													ease: "easeOut",
												}}
											/>
										</motion.div>
									) : (
										<motion.div
											className="flex aspect-video items-center justify-center rounded-2xl border-2 border-muted/40 border-dashed bg-muted/20"
											key="placeholder"
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.9 }}
											whileHover={{ borderColor: "rgba(168, 85, 247, 0.3)" }}
										>
											<motion.div
												animate={{
													rotate: [0, 10, -10, 0],
													scale: [1, 1.1, 1],
												}}
												transition={{
													duration: 3,
													repeat: Number.POSITIVE_INFINITY,
													ease: "easeInOut",
												}}
											>
												<Sparkles className="h-8 w-8 text-muted-foreground/50" />
											</motion.div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>

							{/* Input Area */}
							<motion.div
								className="relative mb-6 overflow-visible rounded-2xl bg-muted/30 p-4"
								whileHover={{ backgroundColor: "rgba(0,0,0,0.05)" }}
							>
								<div className="flex items-center space-x-4">
									<div className="flex-1 text-left">
										<Typewriter key={currentPrompt.text} text={currentPrompt.text} onComplete={handleTypingComplete} />
									</div>
									<div className="relative">
										<motion.button
											className="glow relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500"
											animate={
												typingComplete && !buttonClicked
													? {
															x: [0, -4, 4, -4, 4, 0],
															scale: [1, 1.1, 1.1, 1.1, 1.1, 1],
															boxShadow: [
																"0 4px 15px rgba(168, 85, 247, 0.2)",
																"0 0 25px rgba(168, 85, 247, 0.8)",
																"0 0 25px rgba(168, 85, 247, 0.8)",
																"0 0 25px rgba(168, 85, 247, 0.8)",
																"0 0 25px rgba(168, 85, 247, 0.8)",
																"0 4px 15px rgba(168, 85, 247, 0.2)",
															],
														}
													: {
															x: 0,
															scale: 1,
															boxShadow: "0 4px 15px rgba(168, 85, 247, 0.2)",
														}
											}
											whileHover={
												!buttonClicked
													? {
															scale: 1.05,
															boxShadow: "0 8px 25px rgba(168, 85, 247, 0.4)",
														}
													: undefined
											}
											whileTap={!buttonClicked ? { scale: 0.95 } : undefined}
											onClick={handleSendClick}
											disabled={buttonClicked}
											transition={{
												duration: 0.6,
												repeat: typingComplete && !buttonClicked ? Number.POSITIVE_INFINITY : 0,
												repeatDelay: 1,
											}}
										>
											<Send className="h-5 w-5 text-white" />
										</motion.button>
									</div>
								</div>
							</motion.div>

							{/* Progress dots */}
							<motion.div
								className="flex justify-center space-x-2"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.6, delay: 0.8 }}
							>
								{prompts.map((p, index) => (
									<motion.div
										key={p.text}
										className={`h-2 rounded-full transition-all duration-300 ${
											index === currentStep % prompts.length
												? "bg-gradient-to-r from-purple-500 to-cyan-500"
												: "bg-muted"
										}`}
										initial={{ width: 8 }}
										animate={{
											width: index === currentStep % prompts.length ? 24 : 8,
											scale: index === currentStep % prompts.length ? 1.2 : 1,
										}}
										transition={{ duration: 0.3, ease: "easeOut" }}
										whileHover={{ scale: 1.3 }}
									/>
								))}
							</motion.div>
						</motion.div>

						{/* Floating elements */}
						<motion.div
							className="-top-4 -right-4 absolute h-20 w-20 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 blur-xl"
							animate={{
								scale: [1, 1.2, 1],
								opacity: [0.3, 0.6, 0.3],
							}}
							transition={{
								duration: 4,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
							}}
						/>
						<motion.div
							className="-bottom-4 -left-4 absolute h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl"
							animate={{
								scale: [1, 1.3, 1],
								opacity: [0.2, 0.5, 0.2],
							}}
							transition={{
								duration: 3,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
								delay: 1,
							}}
						/>

						{/* Animated Sparkles */}
						<motion.div
							className="absolute bottom-12 left-8"
							animate={{
								rotate: [360, 0],
								scale: [1, 1.3, 1],
								opacity: [0.4, 0.8, 0.4],
							}}
							transition={{
								duration: 4,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
								delay: 2,
							}}
						>
							<Sparkles className="h-4 w-4 text-cyan-400/60" />
						</motion.div>
					</motion.div>
				</div>
			</div>
		</motion.section>
	);
}
