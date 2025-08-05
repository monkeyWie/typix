import { authClient } from "@/app/lib/auth-client";
import { mode } from "@/server/lib/env";

function useAuthWrap() {
	const session = authClient.useSession();

	return {
		// User data and authentication status
		user: session.data?.user || null,
		isLogin: !!session.data?.user,
		isLoading: session.isPending,
		error: session.error,

		// Authentication methods
		logout: authClient.signOut,
		signIn: authClient.signIn,
		signUp: authClient.signUp,
	};
}

type UseAuthReturnType = ReturnType<typeof useAuthWrap>;

// Custom hook that wraps BetterAuth's useSession
export function useAuth() {
	if (mode === "client") {
		// In client mode, do nothing
		return {
			user: null,
			isLogin: false,
			isLoading: false,
			error: null,
		} as UseAuthReturnType;
	}

	return useAuthWrap();
}
