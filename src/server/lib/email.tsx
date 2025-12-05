import { render } from "@react-email/render";
import { getContext } from "../service/context";

export async function sendEmail(to: string, code: string) {
	const { resend } = getContext();
	const html = await render(VerificationCodeTemplate({ code }));
	await resend!.instance.emails.send({
		from: resend!.from,
		to,
		subject: "Typix - Verification Code",
		html,
	});
}

interface VerificationCodeTemplateProps {
	code: string;
}

function VerificationCodeTemplate({ code }: VerificationCodeTemplateProps) {
	return (
		<div
			style={{
				fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
				lineHeight: "1.6",
				color: "#09090b",
				backgroundColor: "#f8fafc",
				padding: "40px 20px",
				textAlign: "center",
			}}
		>
			<div
				style={{
					maxWidth: "480px",
					margin: "0 auto",
					backgroundColor: "#ffffff",
					borderRadius: "12px",
					boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
					border: "1px solid #e4e4e7",
					overflow: "hidden",
				}}
			>
				{/* Header with Brand */}
				<div
					style={{
						padding: "32px 32px 24px 32px",
						borderBottom: "1px solid #e4e4e7",
						textAlign: "center",
					}}
				>
					<h1
						style={{
							color: "#09090b",
							fontSize: "24px",
							fontWeight: "600",
							margin: "0 0 4px 0",
							letterSpacing: "-0.025em",
						}}
					>
						Typix
					</h1>
				</div>

				{/* Verification Code - Prominently displayed */}
				<div
					style={{
						padding: "32px",
						textAlign: "center",
						backgroundColor: "#fafafa",
						borderBottom: "1px solid #e4e4e7",
					}}
				>
					<p
						style={{
							fontSize: "14px",
							color: "#71717a",
							margin: "16px 0 0 0",
							fontWeight: "500",
							textTransform: "uppercase",
							letterSpacing: "0.05em",
						}}
					>
						Your Verification Code
					</p>
					<div
						style={{
							fontSize: "48px",
							fontWeight: "700",
							color: "#09090b",
							fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
							letterSpacing: "8px",
							margin: "0",
							padding: "16px 0",
							lineHeight: "1",
						}}
					>
						{code}
					</div>
				</div>

				{/* Main Content */}
				<div
					style={{
						padding: "32px",
						textAlign: "center",
					}}
				>
					<h2
						style={{
							fontSize: "20px",
							fontWeight: "600",
							color: "#09090b",
							margin: "0 0 16px 0",
							lineHeight: "1.3",
						}}
					>
						Complete your email verification
					</h2>

					<p
						style={{
							fontSize: "16px",
							color: "#71717a",
							margin: "0 0 24px 0",
							lineHeight: "1.5",
						}}
					>
						Enter this code in the verification form to complete your email verification.
					</p>
				</div>
			</div>
		</div>
	);
}
