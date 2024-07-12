import { uic } from '../utils'

export const DropIndicator = uic('div', {
	baseClass: 'bg-blue-300 rounded shadow-lg shadow-blue-700 absolute',
	variants: {
		placement: {
			top: 'w-full h-1 -top-1',
			bottom: 'w-full h-1 bottom-0',
			left: 'w-1 h-full -left-1',
			right: 'w-1 h-full right-0',
		},
	},
})
