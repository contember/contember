import { uic } from '../utils/index.js'

export const Divider = uic('hr', {
	baseClass: 'border-t border-divider',
	variants: {
		gap: {
			true: 'my-4',
			false: 'my-0',
		},
	},
})
