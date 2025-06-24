import { uic } from '../utils'

export const DimensionLabelWrapperUI = uic('div', {
	baseClass: 'flex justify-between items-center',
})

export const DimensionLabelUI = uic('span', {
	baseClass: 'ml-1 bg-gray-100 border border-gray-300 px-1 rounded text-xs pointer-events-none',
})
