import { Button } from "@/app/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { useIsMobile } from "@/app/hooks/useMobile";
import { useToast } from "@/app/hooks/useToast";
import type { ApiProviderSettingsItem } from "@/server/ai/types/provider";
import type { aiService } from "@/server/service/ai";
import { zodResolver } from "@hookform/resolvers/zod";
import { LucideEye, LucideEyeOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

export type ProviderData = Awaited<ReturnType<typeof aiService.getAiProviderById>>;
export type UpdateProviderParams = Parameters<typeof aiService.updateAiProvider>[0];

interface ProviderSettingsFormProps {
	provider: ProviderData;
	onSave: (params: UpdateProviderParams) => Promise<void>;
	className?: string;
}

// Create validation schema based on settings configuration
function createValidationSchema(
	settings: readonly ApiProviderSettingsItem[] | ApiProviderSettingsItem[],
	t: (key: string, options?: any) => string,
) {
	const schema: Record<string, z.ZodType<any>> = {};

	for (const setting of settings) {
		let fieldSchema: z.ZodType<any>;

		switch (setting.type) {
			case "string":
			case "password":
				if (setting.options && setting.options.length > 0) {
					// If has options, validate against the option values
					fieldSchema = setting.required
						? z.enum(setting.options as [string, ...string[]], {
								required_error: t("settings.validation.selectOption"),
							})
						: z.enum(setting.options as [string, ...string[]]).optional();
				} else {
					fieldSchema = setting.required
						? z.string({ required_error: t("settings.validation.required") }).min(1, t("settings.validation.required"))
						: z.string().optional();
				}
				break;

			case "url":
				fieldSchema = setting.required
					? z
							.string({ required_error: t("settings.validation.required") })
							.url(t("settings.validation.validUrl"))
							.min(1, t("settings.validation.required"))
					: z.string().url(t("settings.validation.validUrl")).optional();
				break;

			case "number": {
				let numberSchema = z.number({
					invalid_type_error: t("settings.validation.validNumber"),
					required_error: t("settings.validation.required"),
				});
				if (setting.min !== undefined) {
					numberSchema = numberSchema.min(setting.min, t("settings.validation.minValue", { min: setting.min }));
				}
				if (setting.max !== undefined) {
					numberSchema = numberSchema.max(setting.max, t("settings.validation.maxValue", { max: setting.max }));
				}
				fieldSchema = setting.required ? numberSchema : numberSchema.optional();
				break;
			}

			case "boolean":
				fieldSchema = setting.required
					? z.boolean({ required_error: t("settings.validation.required") })
					: z.boolean().optional();
				break;

			default:
				fieldSchema = z.any();
		}

		schema[setting.key] = fieldSchema;
	}

	return z.object(schema);
}

export function ProviderSettingsForm({ provider, onSave, className }: ProviderSettingsFormProps) {
	const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
	const [localEnabled, setLocalEnabled] = useState(provider.enabled);
	const { toast } = useToast();
	const isMobile = useIsMobile();
	const { t, i18n } = useTranslation();

	// Extract data from provider
	const { settings = [], enabled } = provider;

	// Update local enabled state when provider changes
	useEffect(() => {
		setLocalEnabled(enabled);
	}, [enabled]);

	// Get current settings from provider.settings (includes existing values)
	const currentSettings = useMemo(() => {
		const result: Record<string, any> = {};
		for (const setting of settings) {
			if (setting.value !== undefined && setting.value !== null) {
				result[setting.key] = setting.value;
			}
		}
		return result;
	}, [settings]);

	// Create validation schema based on settings
	const validationSchema = createValidationSchema(settings, t);
	type FormData = z.infer<typeof validationSchema>;

	// Initialize form with react-hook-form
	const form = useForm<FormData>({
		resolver: zodResolver(validationSchema),
		defaultValues: currentSettings as FormData,
		mode: "onChange",
	});

	const {
		control,
		reset,
		trigger,
		getValues,
		formState: { errors, isValid },
	} = form;

	// Unified save function for both settings and enable/disable
	const saveProvider = useCallback(
		async (params: Partial<UpdateProviderParams>) => {
			try {
				await onSave({
					providerId: provider.id,
					...params,
				});
				toast({
					title: t("settings.provider.settingsSaved"),
				});
			} catch (error) {
				toast({
					title: t("settings.provider.saveFailed"),
					description: error instanceof Error ? error.message : t("settings.provider.saveError"),
					variant: "destructive",
				});
			}
		},
		[onSave, provider.id, toast],
	);

	// Manual save function with validation
	const handleSave = useCallback(async () => {
		// Trigger form validation
		const isFormValid = await trigger();

		if (isFormValid) {
			const formValues = getValues();

			// Additional validation: check required fields are not empty
			const hasEmptyRequiredFields = settings.some((setting) => {
				if (setting.required) {
					const value = formValues[setting.key];
					return value === undefined || value === null || value === "";
				}
				return false;
			});

			if (!hasEmptyRequiredFields) {
				await saveProvider({ settings: formValues as any });
			}
		}
	}, [trigger, getValues, settings, saveProvider]);

	// Reset form when currentSettings change
	useEffect(() => {
		reset(currentSettings as FormData);
	}, [currentSettings, reset]);

	const togglePasswordVisibility = (key: string) => {
		setShowPasswords((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	// Handle provider enable/disable toggle
	const handleToggleEnabled = useCallback(
		async (checked: boolean) => {
			setLocalEnabled(checked);
			await saveProvider({ enabled: checked });
		},
		[saveProvider],
	);

	const renderField = (setting: ApiProviderSettingsItem) => {
		const showPassword = showPasswords[setting.key];

		// Get title, description and placeholder from i18n
		const titleKey = `providers.${provider.id}.settings.${setting.key}.title`;
		const descriptionKey = `providers.${provider.id}.settings.${setting.key}.description`;
		const placeholderKey = `providers.${provider.id}.settings.${setting.key}.placeholder`;

		const title = t(titleKey);
		const description = i18n.exists(descriptionKey) ? t(descriptionKey) : null;
		const placeholder = t(placeholderKey);

		return (
			<FormField
				key={setting.key}
				control={control}
				name={setting.key as keyof FormData}
				render={({ field }) => (
					<FormItem>
						<div className={`flex ${isMobile ? "flex-col gap-4" : "items-start justify-between"}`}>
							{/* Label and description section */}
							<div className={isMobile ? "" : "w-1/3 min-w-0 flex-shrink-0"}>
								<FormLabel className="flex select-text items-center gap-2 font-medium text-lg">
									{title || setting.key}
									{setting.required && <span className="text-destructive">*</span>}
								</FormLabel>
								{description && <p className="text-muted-foreground text-sm">{description}</p>}
							</div>

							{/* Control section */}
							<div className={`${isMobile ? "" : "w-2/3 flex-1"}`}>
								<FormControl>
									{(() => {
										switch (setting.type) {
											case "string":
											case "password":
												// If has options, render as select dropdown
												if (setting.options && setting.options.length > 0) {
													return (
														<Select
															value={field.value || ""}
															onValueChange={(value) => {
																field.onChange(value);
																handleSave();
															}}
														>
															<SelectTrigger className="w-full">
																<SelectValue placeholder={placeholder || t("settings.provider.selectPlaceholder")} />
															</SelectTrigger>
															<SelectContent>
																{setting.options.map((option) => (
																	<SelectItem key={option} value={option}>
																		{option}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													);
												}
												// Otherwise render as input
												return (
													<div className="relative w-full">
														<Input
															{...field}
															type={setting.type === "password" && !showPassword ? "password" : "text"}
															placeholder={placeholder}
															value={field.value || ""}
															onChange={(e) => field.onChange(e.target.value)}
															onBlur={() => {
																field.onBlur();
																handleSave();
															}}
															className={`w-full ${setting.type === "password" ? "pr-10" : ""}`}
														/>
														{setting.type === "password" && (
															<Button
																type="button"
																variant="ghost"
																size="sm"
																className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
																onClick={() => togglePasswordVisibility(setting.key)}
															>
																{showPassword ? (
																	<LucideEyeOff className="h-4 w-4" />
																) : (
																	<LucideEye className="h-4 w-4" />
																)}
															</Button>
														)}
													</div>
												);

											case "url":
												return (
													<div className="relative w-full">
														<Input
															{...field}
															type="text"
															placeholder={placeholder}
															value={field.value || ""}
															onChange={(e) => field.onChange(e.target.value)}
															onBlur={() => {
																field.onBlur();
																handleSave();
															}}
															className="w-full"
														/>
													</div>
												);

											case "number":
												return (
													<Input
														{...field}
														type="number"
														placeholder={placeholder}
														value={field.value || ""}
														min={setting.min}
														max={setting.max}
														onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
														onBlur={() => {
															field.onBlur();
															handleSave();
														}}
														className="w-full"
													/>
												);

											case "boolean":
												return (
													<Switch
														checked={Boolean(field.value)}
														onCheckedChange={(checked) => {
															field.onChange(checked);
															handleSave();
														}}
													/>
												);

											default:
												return <div>Unsupported field type</div>;
										}
									})()}
								</FormControl>
								<FormMessage />
							</div>
						</div>
					</FormItem>
				)}
			/>
		);
	};

	return (
		<Form {...form}>
			<form className={className}>
				{/* Header */}
				<div className="mb-6">
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<h1 className="font-bold text-2xl">{provider.name}</h1>
							<p className="mt-1 text-muted-foreground">
								{i18n.exists(`providers.${provider.id}.description`)
									? t(`providers.${provider.id}.description`)
									: provider.name}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Switch checked={localEnabled} onCheckedChange={handleToggleEnabled} className="scale-125" />
						</div>
					</div>
				</div>

				{/* Settings */}
				<div className={`${isMobile ? "space-y-4" : "space-y-8"}`}>
					{settings.map((setting) => renderField(setting))}
				</div>
			</form>
		</Form>
	);
}
