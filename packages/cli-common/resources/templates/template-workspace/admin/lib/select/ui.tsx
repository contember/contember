import { uic } from '../utils'
import { Button } from '../ui/button'
import * as React from 'react'
import { forwardRef } from 'react'
import { CheckIcon, PlusIcon, XIcon } from 'lucide-react'
import { PopoverContent } from '../ui/popover'
import { dict } from '../dict'


export const SelectInputWrapperUI = uic('div', {
	baseClass: `
		w-full max-w-md
		relative
		`,
})

export const SelectInputUI = uic('button', {
	baseClass: `
		flex gap-2 flex-wrap items-center
		w-full min-h-10
		p-2 py-1 pr-6
		bg-background
		rounded-md border border-input ring-offset-background
		text-sm
		cursor-pointer
		hover:border-gray-400
		placeholder:text-muted-foreground
		focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
		disabled:cursor-not-allowed disabled:opacity-50
		`,
})
export const SelectInputActionsUI = uic('span', {
	baseClass: 'absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 items-center',
})

export const SelectListItemUI = uic(Button, {
	baseClass: 'w-full text-left justify-start gap-1 data-[highlighted]:bg-gray-200 data-[selected]:bg-gray-100 group relative',
	defaultProps: {
		variant: 'ghost',
		size: 'sm',
	},
	afterChildren: <CheckIcon className="h-3 w-3 opacity-0 group-data-[selected]:opacity-100 ml-auto"/>,
})

export const SelectDefaultPlaceholderUI = () => <span className={'text-gray-400'}>{dict.select.placeholder}</span>

export const MultiSelectItemUI = uic('span', {
	baseClass: 'flex items-stretch border rounded hover:shadow transition-all',
})
export const MultiSelectItemContentUI = uic('span', {
	baseClass: 'rounded-l px-2 py-1 bg-white  ',
})
export const MultiSelectSortableItemContentUI = uic('span', {
	baseClass: 'rounded-l px-2 py-1 bg-white hover:bg-gray-50 cursor-move transition-all',
})
export const MultiSelectItemDragOverlayUI = uic('span', {
	baseClass: 'rounded px-2 py-1 bg-gray-100 inline-flex gap-2 items-center bg-opacity-20 backdrop-blur text-sm border shadow',
})

export const MultiSelectItemRemoveButtonUI = uic('span', {
	baseClass: 'bg-gray-100 border-l py-1 px-2 rounded-r text-black inline-flex items-center justify-center hover:bg-gray-300',
	afterChildren: <XIcon className={'w-3 h-3'}/>,
	defaultProps: {
		tabIndex: 0,
		role: 'button',
		onKeyDown: e => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.currentTarget.click()
				e.preventDefault()
			}
		},
	},
})

export const SelectPopoverContent = uic(PopoverContent, {
	baseClass: 'group w-[max(16rem,var(--radix-popover-trigger-width))]',
})


export const SelectCreateNewTrigger = forwardRef<HTMLButtonElement, {}>((props, ref) => <Button variant="outline" size="icon" ref={ref} {...props}><PlusIcon className="w-3 h-3" /></Button>)
