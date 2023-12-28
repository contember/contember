import { deprecate } from '@contember/utilities'

/** @deprecated No alternative since 1.4.0 */
export const randomId = () => {
	deprecate('1.4.0', true, '`randomId`', null)
	return (Math.random() + 1).toString(36).substring(7)
}
