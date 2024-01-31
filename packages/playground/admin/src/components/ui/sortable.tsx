import { uic } from '../../utils/uic'

export const DropIndicator = uic('div', {
	baseClass: 'bg-blue-300 absolute',
	variants: {
		placement: {
			top: 'w-full h-1 -top-2',
			bottom: 'w-full h-1 -bottom-2',
			left: 'w-1 h-full -left-2',
			right: 'w-1 h-full -right-2',
		},
	},
})
