import { useCloseOnEscape as _useCloseOnEscape } from '@contember/react-utils'
import { deprecate } from '@contember/utilities'

/** @deprecated Use `import { useCloseOnEscape } from '@contember/react-utils'` */
export const useCloseOnEscape: typeof _useCloseOnEscape = props => {
	deprecate('1.4.0', true, '`useCloseOnEscape`', 'import { useCloseOnEscape } from "@contember/react-utils"')
	return _useCloseOnEscape(props)
}
