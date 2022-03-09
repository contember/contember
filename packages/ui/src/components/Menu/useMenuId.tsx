import { createContext, ReactNode, useContext } from 'react'

const MenuIdContext = createContext<string>('unknown')

export function MenuIdProvider({ menuId, children }: {
	menuId: string,
	children?: ReactNode,
}) {
	return (
		<MenuIdContext.Provider value={menuId}>
			{children}
		</MenuIdContext.Provider>
	)
}

export function useMenuId(): string {
	return useContext(MenuIdContext)
}
