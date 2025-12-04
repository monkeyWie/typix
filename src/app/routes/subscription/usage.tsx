import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { useToast } from "@/app/hooks/useToast";
import { apiClient } from "@/app/lib/api-client";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type UsageData = {
	totalCredits: number;
	usedCredits: number;
	remainingCredits: number;
	currentPeriodStart?: string;
	currentPeriodEnd?: string;
};

type UsageHistoryItem = {
	id: string;
	source: "registration" | "order" | "gift" | "promotion" | "refund";
	changeAmount: number;
	beforeCredits: number;
	afterCredits: number;
	createdAt: string;
};

export const Route = createFileRoute("/subscription/usage")({
	component: SubscriptionUsagePage,
});

function SubscriptionUsagePage() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const [loading, setLoading] = useState(true);
	const [usageData, setUsageData] = useState<UsageData | null>(null);
	const [history, setHistory] = useState<UsageHistoryItem[]>([]);

	useEffect(() => {
		let mounted = true;
		setLoading(true);

		Promise.all([
			apiClient.api.subscription.usage.$post({}).then((res) => res.json()),
			apiClient.api.subscription.usageHistory.$post({}).then((res) => res.json()),
		])
			.then(([usageRes, historyRes]) => {
				if (!mounted) return;
				if (usageRes.code === "ok" && usageRes.data) {
					setUsageData(usageRes.data as UsageData);
				}
				if (historyRes.code === "ok" && historyRes.data) {
					setHistory(historyRes.data as UsageHistoryItem[]);
				}
			})
			.catch((err: Error) => {
				toast({ title: t("common.error"), description: String(err) });
			})
			.finally(() => setLoading(false));

		return () => {
			mounted = false;
		};
	}, []);

	const getSourceBadge = (source: string) => {
		const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
			registration: { variant: "secondary", label: "注册赠送" },
			order: { variant: "default", label: "套餐变动" },
			gift: { variant: "outline", label: "礼品赠送" },
			promotion: { variant: "secondary", label: "活动奖励" },
			refund: { variant: "destructive", label: "退款返还" },
		};
		const config = variants[source] || { variant: "outline" as const, label: source };
		return (
			<Badge variant={config.variant} className="text-xs">
				{config.label}
			</Badge>
		);
	};

	const getChangeTypeLabel = (changeAmount: number) => {
		return changeAmount > 0 ? "添加" : "扣除";
	};

	const usagePercent =
		usageData && usageData.totalCredits > 0 ? Math.round((usageData.usedCredits / usageData.totalCredits) * 100) : 0;

	return (
		<div className="p-6">
			<div className="mx-auto max-w-7xl space-y-6">
				<h1 className="mb-6 font-semibold text-3xl">使用明细</h1>

				{loading && <div className="text-muted-foreground text-sm">{t("common.loading")}</div>}

				{!loading && usageData && (
					<>
						{/* 额度汇总卡片 */}
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="font-medium text-muted-foreground text-sm">积分使用情况</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex items-end justify-between">
										<div>
											<div className="text-muted-foreground text-xs">剩余可用</div>
											<div className="font-bold text-3xl text-primary">{usageData.remainingCredits}</div>
										</div>
										<div className="text-right">
											<div className="text-muted-foreground text-xs">总积分</div>
											<div className="font-bold text-2xl">{usageData.totalCredits}</div>
										</div>
									</div>
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">使用进度</span>
											<span className="font-medium">{usagePercent}%</span>
										</div>
										<div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
											<div
												className="h-full bg-primary transition-all"
												style={{ width: `${Math.min(usagePercent, 100)}%` }}
											/>
										</div>
										<p className="text-muted-foreground text-xs">已使用 {usageData.usedCredits} 积分</p>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="font-medium text-muted-foreground text-sm">订阅信息</CardTitle>
								</CardHeader>
								<CardContent className="space-y-3">
									{usageData.currentPeriodStart && usageData.currentPeriodEnd ? (
										<>
											<div>
												<div className="text-muted-foreground text-xs">当前周期</div>
												<div className="font-bold text-lg">
													{new Date(usageData.currentPeriodStart).toLocaleDateString("zh-CN")} -{" "}
													{new Date(usageData.currentPeriodEnd).toLocaleDateString("zh-CN")}
												</div>
											</div>
											<div>
												<div className="text-muted-foreground text-xs">到期时间</div>
												<div className="font-bold text-xl">
													{new Date(usageData.currentPeriodEnd).toLocaleDateString("zh-CN", {
														year: "numeric",
														month: "long",
														day: "numeric",
													})}
												</div>
											</div>
										</>
									) : usageData.totalCredits > 0 ? (
										<div className="py-4 text-center">
											<div className="font-semibold">当前额度</div>
											<div className="text-muted-foreground text-sm">无有效期限制</div>
										</div>
									) : (
										<div className="py-4 text-center text-muted-foreground text-sm">暂无订阅信息</div>
									)}
								</CardContent>
							</Card>
						</div>

						{/* 使用明细表格 */}
						<Card>
							<CardHeader>
								<CardTitle>积分变动记录</CardTitle>
							</CardHeader>
							<CardContent>
								{history.length === 0 && (
									<div className="py-12 text-center">
										<p className="text-muted-foreground">暂无使用记录</p>
									</div>
								)}

								{history.length > 0 && (
									<div className="overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>时间</TableHead>
													<TableHead>类型</TableHead>
													<TableHead>来源</TableHead>
													<TableHead className="text-right">变动积分</TableHead>
													<TableHead className="text-right">余额</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{history.map((item) => (
													<TableRow key={item.id} className="hover:bg-muted/50">
														<TableCell className="text-muted-foreground text-sm">
															{new Date(item.createdAt).toLocaleString("zh-CN")}
														</TableCell>
														<TableCell>
															<Badge variant={item.changeAmount > 0 ? "default" : "secondary"} className="text-xs">
																{getChangeTypeLabel(item.changeAmount)}
															</Badge>
														</TableCell>
														<TableCell>{getSourceBadge(item.source)}</TableCell>
														<TableCell className="text-right font-medium">
															<span className={item.changeAmount > 0 ? "text-green-600" : "text-red-600"}>
																{item.changeAmount > 0 ? "+" : ""}
																{item.changeAmount}
															</span>
														</TableCell>
														<TableCell className="text-right font-medium">{item.afterCredits}</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								)}
							</CardContent>
						</Card>
					</>
				)}
			</div>
		</div>
	);
}
