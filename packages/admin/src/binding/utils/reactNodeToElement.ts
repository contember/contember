import { isEmptyObject } from '@contember/utils'
import * as React from 'react'

export const reactNodeToElement = function(node: React.ReactNode): React.ReactElement | null {
	if (
		node === undefined ||
		typeof node === 'string' ||
		typeof node === 'number' ||
		typeof node === 'boolean' ||
		(typeof node === 'object' && node !== null && isEmptyObject(node))
	) {
		return null
	}

	return node as React.ReactElement | null
}
