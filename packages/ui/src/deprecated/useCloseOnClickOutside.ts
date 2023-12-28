import { useCloseOnClickOutside as _useCloseOnClickOutside } from '@contember/react-utils'
import { deprecate } from '@contember/utilities'

/** @deprecated Use `import { useCloseOnClickOutside } from '@contember/react-utils'` */
export const useCloseOnClickOutside: typeof _useCloseOnClickOutside = props => {
	deprecate('1.4.0', true, '`useCloseOnClickOutside`', 'import { useCloseOnClickOutside } from "@contember/react-utils"')
	return _useCloseOnClickOutside(props)
}
