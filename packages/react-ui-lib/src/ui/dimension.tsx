import { uic } from '../utils'

export const DimensionLabelWrapperUI = uic('div', {
	baseClass: 'flex justify-between items-center',
})

export const DimensionLabelUI = uic('span', {
	baseClass: 'bg-gray-100 border px-1 rounded text-xs pointer-events-none',
})
