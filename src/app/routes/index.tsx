import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
	component: IndexPage,
});

function IndexPage() {
	const navigate = useNavigate();

	useEffect(() => {
		// Navigate to chat page since database is already initialized at root level
		navigate({ to: "/chat", search: {} });
	}, [navigate]);

	return null;
}
