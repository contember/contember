import { uic } from '../utils'
import { Button } from '../ui/button'
import { forwardRef } from 'react'
import { CheckIcon, PlusIcon, XIcon } from 'lucide-react'
import { PopoverContent } from '../ui/popover'
import { dict } from '../dict'

/**
* `SelectInputWrapperUI` is the UI input wrapper for the select component.
*
* See more {@link SelectInput}
*
* @group SelectInput
*/
export const SelectInputWrapperUI = uic('div', {
	baseClass: 'w-full max-w-md relative',
})

/**
* `SelectInputUI` is the UI input wrapper for the select component.
*
* See more {@link SelectInput}
*
* @group SelectInput
*/
export const SelectInputUI = uic('button', {
	baseClass: [
		'flex gap-2 justify-between items-center',
		'w-full min-h-10',
		'px-2 py-1',
		'bg-background',
		'rounded-md border border-input ring-offset-background',
		'text-sm text-left',
		'cursor-pointer',
		'hover:border-gray-400',
		'placeholder:text-muted-foreground',
		'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
		'disabled:cursor-not-allowed disabled:opacity-50',
	],
})

/**
* `SelectInputActionsUI` is the UI for the select action.
*
* See more {@link SelectInput}
*
* @group SelectInput
* @group MultiSelectInput
*/
export const SelectInputActionsUI = uic('span', {
	baseClass: 'flex gap-1 items-center',
})

/**
* `SelectListItemUI` is the UI for the select items list.
*
* See more {@link SelectInput}
*
* @group SelectInput
*/
export const SelectListItemUI = uic(Button, {
	baseClass: 'w-full text-left justify-start gap-1 data-[highlighted]:bg-gray-200 data-[selected]:bg-gray-100 group relative min-h-8 h-auto',
	defaultProps: {
		variant: 'ghost',
		size: 'sm',
	},
	afterChildren: <CheckIcon className="h-3 w-3 opacity-0 group-data-[selected]:opacity-100 ml-auto"/>,
})

/**
* `SelectDefaultPlaceholderUI` is the UI for the select default placeholder.
*
* See more {@link SelectInput}
*
* @group SelectInput
* @group MultiSelectInput
*/
export const SelectDefaultPlaceholderUI = () => <span className={'text-gray-400'}>{dict.select.placeholder}</span>

/**
* `MultiSelectItemWrapperUI` is the UI for the multi-select item wrapper.
*
* See more {@link MultiSelectInput}
*
* @group MultiSelectInput
*/
export const MultiSelectItemWrapperUI = uic('div', {
	baseClass: 'flex flex-wrap gap-1 items-center justify-start',
})

/**
* `MultiSelectItemUI` is the UI for the multi-select item.
*
* See more {@link MultiSelectInput}
*
* @group MultiSelectInput
*/
export const MultiSelectItemUI = uic('span', {
	baseClass: 'flex items-stretch border border-gray-200 rounded-sm hover:shadow-sm transition-all',
})

/**
* `MultiSelectItemContentUI` is the UI for the multi-select item content.
*
* See more {@link MultiSelectInput}
*
* @group MultiSelectInput
*/
export const MultiSelectItemContentUI = uic('span', {
	baseClass: 'rounded-l px-2 py-1 bg-background  ',
})

/**
* `MultiSelectSortableItemContentUI` is the UI for the multi-select sortable item content.
*
* See more {@link MultiSelectInput}
*
* @group MultiSelectInput
*/
export const MultiSelectSortableItemContentUI = uic('span', {
	baseClass: 'rounded-l px-2 py-1 bg-background hover:bg-gray-50 cursor-move transition-all',
})

/**
* `MultiSelectItemDragOverlayUI` is the UI for the multi-select item drag overlay.
*
* See more {@link MultiSelectInput}
*
* @group MultiSelectInput
*/
export const MultiSelectItemDragOverlayUI = uic('span', {
	baseClass: 'rounded-sm px-2 py-1 bg-gray-100/20 inline-flex gap-2 items-center backdrop-blur-sm text-sm border border-gray-200 shadow-sm',
})

/**
* `MultiSelectItemRemoveButtonUI` is the UI for the multi-select item remove button.
*
* See more {@link MultiSelectInput}
*
* @group MultiSelectInput
*/
export const MultiSelectItemRemoveButtonUI = uic('span', {
	baseClass: 'bg-gray-100 border-l border-gray-200 py-1 px-2 rounded-r text-black inline-flex items-center justify-center hover:bg-gray-300',
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

/**
* `SelectPopoverContent` is the UI for the select popover content.
*
* See more {@link SelectInput}
*
* @group SelectInput
*/
export const SelectPopoverContent = uic(PopoverContent, {
	baseClass: 'group w-[max(16rem,var(--radix-popover-trigger-width))]',
	defaultProps: {
		onWheel: e => e.stopPropagation(),
	},
})


/**
* `SelectCreateNewTrigger` is the UI for the select create new trigger.
*
* See more {@link SelectInput}
*
* @group SelectInput
*/
export const SelectCreateNewTrigger = forwardRef<HTMLButtonElement, {}>((props, ref) => <Button variant="outline" size="icon" ref={ref} {...props}><PlusIcon className="w-3 h-3" /></Button>)
