import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { getDb } from "@/app/lib/db-client";
import { Database } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface QueryResult {
	columns?: string[];
	rows?: Record<string, any>[];
	changes?: number;
	lastInsertRowid?: number | bigint;
	error?: string;
	executionTime?: number;
}

export function DatabaseStudio() {
	const [sql, setSql] = useState("");
	const [result, setResult] = useState<QueryResult | null>(null);
	const [isExecuting, setIsExecuting] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const executeSql = async () => {
		if (!sql.trim()) {
			toast.error("Please enter SQL query statement");
			return;
		}

		setIsExecuting(true);
		const startTime = performance.now();

		try {
			const db = getDb();

			// Check if it's a SELECT query
			const isSelectQuery = sql.trim().toLowerCase().startsWith("select");

			if (isSelectQuery) {
				// For SELECT queries, use db.all() to get results
				const selectResult = (await db.all(sql.trim())) as Record<string, any>[];
				const executionTime = performance.now() - startTime;

				if (Array.isArray(selectResult) && selectResult.length > 0) {
					const firstRow = selectResult[0];
					if (firstRow) {
						const columns = Object.keys(firstRow);
						setResult({
							columns,
							rows: selectResult,
							executionTime,
						});
					} else {
						setResult({
							columns: [],
							rows: [],
							executionTime,
						});
					}
				} else {
					setResult({
						columns: [],
						rows: [],
						executionTime,
					});
				}
			} else {
				// For INSERT/UPDATE/DELETE operations, use db.run()
				const queryResult = (await db.run(sql.trim())) as any;
				const executionTime = performance.now() - startTime;

				setResult({
					changes: queryResult.changes || 0,
					lastInsertRowid: queryResult.lastInsertRowid,
					executionTime,
				});
			}

			toast.success(`Query executed successfully (${(performance.now() - startTime).toFixed(2)}ms)`);
		} catch (error) {
			const executionTime = performance.now() - startTime;
			const errorMessage = error instanceof Error ? error.message : "Unknown error";

			setResult({
				error: errorMessage,
				executionTime,
			});

			toast.error(`Query execution failed: ${errorMessage}`);
		} finally {
			setIsExecuting(false);
		}
	};

	const clearResult = () => {
		setResult(null);
	};

	const resetAndClose = () => {
		setSql("");
		setResult(null);
		setIsOpen(false);
	};

	const renderTable = () => {
		if (!result?.columns || !result?.rows) return null;

		return (
			<div className="rounded-md border">
				<ScrollArea className="h-[400px]">
					<table className="w-full text-sm">
						<thead className="border-b bg-muted/50">
							<tr>
								{result.columns.map((column) => (
									<th key={column} className="p-2 text-left font-medium">
										{column}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{result.rows.map((row, rowIndex) => (
								<tr key={`row-${JSON.stringify(row)}-${rowIndex}`} className="border-b hover:bg-muted/50">
									{result.columns!.map((column) => (
										<td key={`${rowIndex}-${column}`} className="p-2">
											{row[column] !== null && row[column] !== undefined ? (
												String(row[column])
											) : (
												<span className="text-muted-foreground italic">NULL</span>
											)}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</ScrollArea>
			</div>
		);
	};

	const renderResult = () => {
		if (!result) return null;

		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-lg">Query Results</CardTitle>
					<div className="flex items-center gap-2">
						{result.executionTime && <Badge variant="secondary">{result.executionTime.toFixed(2)}ms</Badge>}
						<Button variant="outline" size="sm" onClick={clearResult}>
							Clear
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{result.error ? (
						<div className="rounded-md border border-destructive/20 bg-destructive/10 p-4">
							<p className="font-medium text-destructive">Error:</p>
							<p className="mt-1 text-destructive/80 text-sm">{result.error}</p>
						</div>
					) : result.columns && result.rows ? (
						<div>
							<div className="mb-4 flex items-center gap-4">
								<Badge variant="outline">{result.rows.length} rows</Badge>
								<Badge variant="outline">{result.columns.length} columns</Badge>
							</div>
							{renderTable()}
						</div>
					) : (
						<div>
							<div className="flex items-center gap-4">
								{typeof result.changes === "number" && <Badge variant="outline">Affected rows: {result.changes}</Badge>}
								{result.lastInsertRowid && <Badge variant="outline">Insert ID: {String(result.lastInsertRowid)}</Badge>}
							</div>
							<p className="mt-2 text-muted-foreground">Query execution completed</p>
						</div>
					)}
				</CardContent>
			</Card>
		);
	};

	return (
		<>
			{/* Floating Button */}
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogTrigger asChild>
					<Button
						size="icon"
						className="fixed right-6 bottom-6 z-50 h-12 w-12 rounded-full shadow-lg transition-shadow hover:shadow-xl"
						title="Database Management Tool"
					>
						<Database className="h-6 w-6" />
					</Button>
				</DialogTrigger>

				<DialogContent className="h-screen min-w-screen">
					<DialogHeader className="border-b p-6">
						<DialogTitle className="flex items-center gap-2">
							<Database className="h-5 w-5" />
							Database Management Tool
						</DialogTitle>
					</DialogHeader>

					<div className="flex h-[calc(100vh-80px)] flex-col">
						{/* SQL Input Area */}
						<div className="flex-shrink-0 border-b p-6">
							<p className="mb-4 text-muted-foreground text-sm">
								SQL query tool for debugging, supports all standard SQLite statements
							</p>

							<div className="space-y-4">
								<div>
									<label htmlFor="sql-input" className="mb-2 block font-medium text-sm">
										SQL Query Statement
									</label>
									<Textarea
										id="sql-input"
										placeholder="Enter SQL query statement, e.g.: SELECT * FROM chats; (Ctrl+Enter to execute)"
										value={sql}
										onChange={(e) => setSql(e.target.value)}
										onKeyDown={(e) => {
											if (e.ctrlKey && e.key === "Enter") {
												e.preventDefault();
												if (!isExecuting && sql.trim()) {
													executeSql();
												}
											}
										}}
										className="h-[200px] resize-none font-mono text-sm"
									/>
								</div>

								<div className="flex items-center gap-2">
									<Button onClick={executeSql} disabled={isExecuting || !sql.trim()} className="flex-shrink-0">
										{isExecuting ? "Executing..." : "Execute Query"}
									</Button>

									<Button variant="outline" onClick={() => setSql("")} disabled={!sql.trim()}>
										Clear
									</Button>

									<Button variant="outline" onClick={resetAndClose}>
										Close
									</Button>
								</div>
							</div>
						</div>

						{/* Results Display Area - Fill remaining space */}
						{result ? (
							<div className="flex flex-1 flex-col overflow-hidden">
								{/* Results Header */}
								<div className="flex-shrink-0 border-b p-4">
									<div className="flex items-center justify-between">
										<h3 className="font-semibold text-lg">Query Results</h3>
										<div className="flex items-center gap-2">
											{result.executionTime && <Badge variant="secondary">{result.executionTime.toFixed(2)}ms</Badge>}
											<Button variant="outline" size="sm" onClick={clearResult}>
												Clear Results
											</Button>
										</div>
									</div>
								</div>

								{/* Results Content - Fill remaining space */}
								<div className="flex-1 overflow-hidden">
									{result.error ? (
										<div className="p-6">
											<div className="rounded-md border border-destructive/20 bg-destructive/10 p-4">
												<p className="font-medium text-destructive">Error:</p>
												<p className="mt-1 text-destructive/80 text-sm">{result.error}</p>
											</div>
										</div>
									) : result.columns && result.rows ? (
										<div className="flex h-full flex-col">
											{/* Statistics */}
											<div className="flex-shrink-0 border-b p-4">
												<div className="flex items-center gap-4">
													<Badge variant="outline">{result.rows.length} rows</Badge>
													<Badge variant="outline">{result.columns.length} columns</Badge>
												</div>
											</div>

											{/* Table - Fill remaining space */}
											<div className="w-full flex-1 overflow-hidden">
												<ScrollArea className="h-full w-full">
													<table className="w-full text-sm" style={{ tableLayout: "auto", minWidth: "100%" }}>
														<thead className="sticky top-0 border-b bg-muted/50">
															<tr>
																{result.columns.map((column, index) => (
																	<th
																		key={column}
																		className="overflow-hidden text-ellipsis border-r p-4 text-left font-medium last:border-r-0"
																		style={{
																			width: `${100 / (result.columns?.length || 1)}%`,
																			minWidth: "150px",
																		}}
																	>
																		{column}
																	</th>
																))}
															</tr>
														</thead>
														<tbody>
															{result.rows.map((row, rowIndex) => (
																<tr
																	key={`row-${JSON.stringify(row)}-${rowIndex}`}
																	className="border-b hover:bg-muted/50"
																>
																	{result.columns!.map((column, index) => (
																		<td
																			key={`${rowIndex}-${column}`}
																			className="overflow-hidden border-r p-4 last:border-r-0"
																			style={{
																				width: `${100 / result.columns!.length}%`,
																				minWidth: "150px",
																			}}
																		>
																			{row[column] !== null && row[column] !== undefined ? (
																				<div className="w-full truncate" title={String(row[column])}>
																					{String(row[column])}
																				</div>
																			) : (
																				<span className="text-muted-foreground italic">NULL</span>
																			)}
																		</td>
																	))}
																</tr>
															))}
														</tbody>
													</table>
													<div className="h-6" />
												</ScrollArea>
											</div>
										</div>
									) : (
										<div className="p-6">
											<div className="flex items-center gap-4">
												{typeof result.changes === "number" && (
													<Badge variant="outline">Affected rows: {result.changes}</Badge>
												)}
												{result.lastInsertRowid && (
													<Badge variant="outline">Insert ID: {String(result.lastInsertRowid)}</Badge>
												)}
											</div>
											<p className="mt-2 text-muted-foreground">Query execution completed</p>
										</div>
									)}
								</div>
							</div>
						) : (
							<div className="flex flex-1 items-center justify-center text-muted-foreground">
								<p>SQL query results will be displayed here after execution</p>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
