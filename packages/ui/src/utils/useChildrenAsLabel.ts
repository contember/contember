import { useChildrenAsLabel as _useChildrenAsLabel } from '@contember/react-utils'
import { ReactNode } from 'react'

export function useChildrenAsLabel(children: ReactNode): string | undefined {
	return _useChildrenAsLabel(children)
}
