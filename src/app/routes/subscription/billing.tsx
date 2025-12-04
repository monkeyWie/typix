import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { useToast } from "@/app/hooks/useToast";
import { apiClient } from "@/app/lib/api-client";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type OrderItem = {
	id: string;
	planId: string;
	tier: "basic" | "advanced" | "professional";
	billingType: "one_time" | "subscription";
	billingInterval: "month" | "quarter" | "year";
	status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
	originalPrice: number;
	finalPrice: number;
	currency: string;
	paymentMethod?: string;
	orderDate: string;
	paidDate?: string;
	creditsAmount: number;
	createdAt: string;
};

export const Route = createFileRoute("/subscription/billing")({
	component: SubscriptionBillingPage,
});

function SubscriptionBillingPage() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const [loadingOrders, setLoadingOrders] = useState(true);
	const [orders, setOrders] = useState<OrderItem[]>([]);

	useEffect(() => {
		let mounted = true;
		setLoadingOrders(true);

		apiClient.api.subscription.orderHistory
			.$post({})
			.then((res) => res.json())
			.then((res) => {
				if (!mounted) return;
				if (res.code === "ok" && res.data) {
					setOrders(res.data as OrderItem[]);
				}
			})
			.catch((err: Error) => {
				toast({ title: t("common.error"), description: String(err) });
			})
			.finally(() => setLoadingOrders(false));

		return () => {
			mounted = false;
		};
	}, []);

	const getStatusBadge = (status: string) => {
		const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
			pending: { variant: "outline", label: "待支付" },
			paid: { variant: "default", label: "已支付" },
			failed: { variant: "destructive", label: "支付失败" },
			cancelled: { variant: "secondary", label: "已取消" },
			refunded: { variant: "destructive", label: "已退款" },
		};
		const config = variants[status] || { variant: "outline" as const, label: status };
		return (
			<Badge variant={config.variant} className="text-xs">
				{config.label}
			</Badge>
		);
	};

	const getTierLabel = (tier: string) => {
		const labels: Record<string, string> = {
			basic: "基础档",
			advanced: "进阶档",
			professional: "专业档",
		};
		return labels[tier] || tier;
	};

	const getIntervalLabel = (interval: string) => {
		const labels: Record<string, string> = {
			month: "月",
			quarter: "季",
			year: "年",
		};
		return labels[interval] || interval;
	};

	return (
		<div className="p-6">
			<div className="mx-auto max-w-7xl">
				<h1 className="mb-6 font-semibold text-3xl">订单历史</h1>
				<Card>
					<CardHeader>
						<CardTitle>订单历史</CardTitle>
					</CardHeader>
					<CardContent>
						{loadingOrders && (
							<div className="py-8 text-center text-muted-foreground text-sm">{t("common.loading")}</div>
						)}

						{!loadingOrders && orders.length === 0 && (
							<div className="py-12 text-center">
								<p className="text-muted-foreground">暂无订单记录</p>
							</div>
						)}

						{!loadingOrders && orders.length > 0 && (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>订单号</TableHead>
											<TableHead>套餐</TableHead>
											<TableHead>类型</TableHead>
											<TableHead>周期</TableHead>
											<TableHead className="text-right">积分</TableHead>
											<TableHead className="text-right">金额</TableHead>
											<TableHead>支付方式</TableHead>
											<TableHead>状态</TableHead>
											<TableHead>创建时间</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{orders.map((order) => (
											<TableRow key={order.id} className="hover:bg-muted/50">
												<TableCell className="font-mono text-xs">{order.id}</TableCell>
												<TableCell className="font-medium">{getTierLabel(order.tier)}</TableCell>
												<TableCell>
													{order.billingType === "subscription" ? (
														<Badge variant="default" className="text-xs">
															订阅制
														</Badge>
													) : (
														<Badge variant="secondary" className="text-xs">
															一次性
														</Badge>
													)}
												</TableCell>
												<TableCell>{getIntervalLabel(order.billingInterval)}</TableCell>
												<TableCell className="text-right font-medium">{order.creditsAmount.toLocaleString()}</TableCell>
												<TableCell className="text-right font-medium">
													<div className="flex flex-col items-end">
														<span>
															{order.currency} ${order.finalPrice}
														</span>
														{order.originalPrice !== order.finalPrice && (
															<span className="text-muted-foreground text-xs line-through">${order.originalPrice}</span>
														)}
													</div>
												</TableCell>
												<TableCell>{order.paymentMethod || "—"}</TableCell>
												<TableCell>{getStatusBadge(order.status)}</TableCell>
												<TableCell className="text-muted-foreground text-sm">
													{new Date(order.orderDate).toLocaleString("zh-CN")}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
