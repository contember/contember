import { uic } from '../../utils/uic'
import { InputLike } from '../ui/input'
import { Button } from '../ui/button'
import * as React from 'react'
import { CheckIcon, XIcon } from 'lucide-react'
import { PopoverContent } from '../ui/popover'

export const SelectInputUI = uic(InputLike, {
	baseClass: 'cursor-pointer hover:border-gray-400 relative flex gap-2 flex-wrap py-1 pr-6',
})
export const SelectInputActionsUI = uic('div', {
	baseClass: 'absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 items-center',
})

export const SelectListItemUI = uic(Button, {
	baseClass: 'w-full text-left justify-start gap-1 data-[highlighted]:bg-gray-200 group pl-1',
	defaultProps: {
		variant: 'ghost',
		size: 'sm',
	},
	beforeChildren: <CheckIcon className="h-3 w-3 opacity-0 group-data-[selected]:opacity-100"/>,
})

export const SelectDefaultPlaceholderUI = () => <span className={'text-gray-400'}>{'Select'}</span>

export const MultiSelectItemUI = uic('div', {
	baseClass: 'flex items-stretch border rounded hover:shadow transition-all',
})
export const MultiSelectItemContentUI = uic('div', {
	baseClass: 'rounded-l px-2 py-1 bg-white  ',
})
export const MultiSelectSortableItemContentUI = uic('div', {
	baseClass: 'rounded-l px-2 py-1 bg-white hover:bg-gray-50 cursor-move transition-all',
})
export const MultiSelectItemDragOverlayUI = uic('div', {
	baseClass: 'rounded px-2 py-1 bg-gray-100 inline-flex gap-2 items-center bg-opacity-20 backdrop-blur text-sm border shadow',
})

export const MultiSelectItemRemoveButtonUI = uic('button', {
	baseClass: 'bg-gray-100 border-l py-1 px-2 rounded-r text-black flex-inline hover:bg-gray-300',
	afterChildren: <XIcon className={'w-3 h-3'}/>,
})

export const SelectPopoverContent = uic(PopoverContent, {
	baseClass: 'p-0 py-4  group w-[max(16rem,var(--radix-popover-trigger-width))]',
})
