import { Children, ReactNode, useMemo } from 'react'

export function useChildrenAsLabel(children: ReactNode): string | undefined {
	return useMemo(() => {
		let label: string[] = []

		Children.map(children, child => {
			if (typeof child === 'string') {
				label.push(child)
			}
		})

		return label.length > 0 ? label.join(' ') : undefined
	}, [children])
}
