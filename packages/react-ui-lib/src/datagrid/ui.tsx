import { CheckSquareIcon, FilterIcon, FilterXIcon, PlusIcon, SquareIcon, XIcon } from 'lucide-react'
import { forwardRef, ReactEventHandler, ReactNode, useCallback } from 'react'
import { dict } from '../dict'
import { Button } from '../ui/button'
import { cn, uic } from '../utils'

export const DataGridTooltipLabel = uic('span', {
	baseClass: 'cursor-pointer border-dashed border-b border-b-gray-400 hover:border-gray-800',
})

/**
 * Button in a tooltip that triggers the filter action
 */
export const DataGridFilterActionButtonUI = forwardRef<HTMLButtonElement, {}>((props: {}, ref) => {
	return (
		<Button
			variant="outline"
			size="sm"
			className="space-x-1 data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner"
			ref={ref}
			{...props}
		>
			<FilterIcon className="w-3 h-3" />
			<span>{dict.datagrid.filter}</span>
		</Button>
	)
})

/**
 * Button in a tooltip that triggers the exclude action
 */
export const DataGridExcludeActionButtonUI = forwardRef<HTMLButtonElement, {}>((props: {}, ref) => {
	return (
		<Button
			variant="outline"
			size="sm"
			className="space-x-1 data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner"
			ref={ref}
			{...props}
		>
			<FilterXIcon className="w-3 h-3" />
			<span>{dict.datagrid.exclude}</span>
		</Button>
	)
})

/**
 * Button in a filter list that removes the filter
 */
export const DataGridActiveFilterUI = forwardRef<HTMLButtonElement, {
	children: ReactNode
	className?: string
}>(({ children, className, ...props }, ref) => {
	return (
		<Button
			variant="outline"
			size="sm"
			className={cn('space-x-1 data-[current="none"]:hidden data-[current="exclude"]:line-through h-6', className)}
			ref={ref}
			{...props}
		>
			<span>
				{children}
			</span>
			<XIcon className="w-2 h-2" />
		</Button>
	)
})


export const DataGridSingleFilterUI = forwardRef<HTMLDivElement, { children: ReactNode }>((props, ref) => {
	return (
		<div className="flex flex-wrap gap-2 rounded bg-gray-50 items-center text-sm px-2 py-1.5 border" ref={ref} {...props} />
	)
})

export const DataGridFilterSelectTriggerUI = forwardRef<HTMLButtonElement, { children: ReactNode }>(({
	children,
	...props
}, ref) => {
	return (
		<button className="hover:underline inline-flex items-center gap-2 group px-1" ref={ref} {...props}>
			{children && <span className="text-xs font-medium">
				{children}
			</span>}
			<span
				className="bg-gray-100 rounded-full border group-data-[state=open]:bg-white group-data-[state=open]:shadow-inner h-5 w-5 inline-flex items-center justify-center"
			>
				<PlusIcon className="w-3 h-3" />
			</span>
		</button>
	)
})

export interface DataGridFilterSelectItemProps {
	onInclude: () => void
	onExclude: () => void
	isIncluded: boolean
	isExcluded: boolean
	children: ReactNode
}

export const DataGridFilterSelectItemUI = forwardRef<HTMLButtonElement, DataGridFilterSelectItemProps>(({
	children,
	onExclude,
	isExcluded,
	onInclude,
	isIncluded,
	...props
}, ref) => {
	const include = useCallback<ReactEventHandler>(e => {
		onInclude()
		e.preventDefault()
	}, [onInclude])
	const exclude = useCallback<ReactEventHandler>(e => {
		onExclude()
		e.preventDefault()
		e.stopPropagation()
	}, [onExclude])

	return (
		<div className="relative flex gap-1 justify-between items-center">
			<Button
				ref={ref}
				onClick={include}
				size="sm"
				className="pl-1 w-full text-left justify-start gap-1 data-[highlighted]:bg-gray-200"
				variant="ghost" {...props}>
				{isIncluded ? <CheckSquareIcon className="w-3 h-3" /> : <SquareIcon className="w-3 h-3" />}
				<span className={cn('font-normal', isIncluded && 'text-blue-700')}>
					{children}
				</span>
			</Button>
			<button
				onClick={exclude}
				className={cn(
					'p-1 border rounded hover:bg-red-200',
					isExcluded ? 'bg-red-300 shadow-inner' : '',
				)}
			>
				<FilterXIcon className="h-3 w-3" />
			</button>
		</div>

	)
})


export const DataGridToolbarUI = uic('div', {
	baseClass: 'flex flex-col md:flex-row gap-2 md:items-end mb-4 items-stretch',
	variants: {
		sticky: {
			true: 'sticky top-0 z-50 border-b bg-white border-gray-200 pb-4',
		},
	},
})
