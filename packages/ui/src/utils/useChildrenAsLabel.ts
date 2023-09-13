import { useChildrenAsLabel as _useChildrenAsLabel } from '@contember/react-utils'
import { deprecate } from '@contember/utilities'
import { ReactNode } from 'react'

/**
 * @deprecated Use `import { useChildrenAsLabel } from '@contember/react-utils'` instead
 */
export function useChildrenAsLabel(children: ReactNode): string | undefined {
	deprecate('1.3.0', true, 'calling `useChildrenAsLabel`', `import { useChildrenAsLabel } from '@contember/react-utils'`)
	return _useChildrenAsLabel(children)
}
