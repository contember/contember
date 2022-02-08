import { createContext, ReactNode, RefObject, useContext, useEffect, useState } from 'react'
import { TAB_INDEX_NEVER_FOCUSABLE } from './Types'

const ActiveMenuItemContext = createContext<HTMLElement | null>(null)

export function useActiveMenuItemContext() {
  return useContext(ActiveMenuItemContext)
}

export function ActiveMenuItemProvider({
  children,
  menuRef,
}: {
  children?: ReactNode,
  menuRef: RefObject<HTMLUListElement>,
}) {
	const [element, setElement] = useState<HTMLLIElement | null>(null)

	useEffect(() => {
		if (!menuRef.current) {
			return
		}

		const menu = menuRef.current

		function changeActiveElement(event: FocusEvent) {
			let focusedElement = event.target as HTMLElement | null

			while (focusedElement && !(focusedElement instanceof HTMLLIElement || focusedElement === menu)) {
				focusedElement = focusedElement.parentElement
			}

			setElement(focusedElement instanceof HTMLLIElement && focusedElement.tabIndex > TAB_INDEX_NEVER_FOCUSABLE ? focusedElement : null)
		}

		menu.addEventListener('focus', changeActiveElement, { capture: true, passive: true })

		return () => {
			menu.removeEventListener('focus', changeActiveElement, { capture: true })
		}
	}, [element, menuRef])

  return <ActiveMenuItemContext.Provider value={element}>
		{children}
	</ActiveMenuItemContext.Provider>
}
