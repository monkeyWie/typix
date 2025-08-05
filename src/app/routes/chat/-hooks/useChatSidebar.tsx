import { type ReactElement, type ReactNode, createContext, useContext, useEffect, useState } from "react";
import { useIsMobile } from "../../../hooks/useMobile";

interface ChatSidebarContextType {
	// Unified sidebar state
	isOpen: boolean;
	toggle: () => void;
	setOpen: (open: boolean) => void;

	// Utility
	isMobile: boolean;
}

const SidebarContext = createContext<ChatSidebarContextType | undefined>(undefined);

export function ChatSidebarProvider({ children }: { children: ReactNode }): ReactElement {
	const isMobile = useIsMobile();
	const [isOpen, setIsOpen] = useState(() => {
		// Desktop sidebar is open by default, mobile sidebar is closed by default
		return !isMobile;
	});

	// Auto-close mobile sidebar when switching to desktop
	// Auto-open desktop sidebar when switching from mobile
	useEffect(() => {
		if (isMobile && isOpen) {
			// When switching to mobile, close the sidebar
			setIsOpen(false);
		} else if (!isMobile && !isOpen) {
			// When switching to desktop, open the sidebar
			setIsOpen(true);
		}
	}, [isMobile]);

	const toggle = () => setIsOpen(!isOpen);

	return (
		<SidebarContext.Provider
			value={{
				isOpen,
				toggle,
				setOpen: setIsOpen,
				isMobile,
			}}
		>
			{children}
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (context === undefined) {
		throw new Error("useSidebar must be used within a SidebarProvider");
	}
	return context;
}
