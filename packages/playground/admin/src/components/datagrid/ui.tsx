import * as React from 'react'
import { forwardRef, ReactEventHandler, ReactNode, SyntheticEvent, useCallback } from 'react'
import { CheckSquareIcon, FilterIcon, FilterXIcon, PlusIcon, SquareIcon, XIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../utils/cn'

/**
 * Button in a tooltip that triggers the filter action
 */
export const DataViewFilterActionButtonUI = forwardRef((props: {}, ref) => {
	return (
		<Button
			variant={'outline'}
			size={'sm'}
			className={'space-x-1 data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner'}
			ref={ref}
			{...props}
		>
			<FilterIcon className={'w-3 h-3'} />
			<span>Filter</span>
		</Button>
	)
})

/**
 * Button in a tooltip that triggers the exclude action
 */
export const DataViewExcludeActionButtonUI = forwardRef((props: {}, ref) => {
	return (
		<Button
			variant={'outline'}
			size={'sm'}
			className={'space-x-1 data-[active]:text-blue-600 data-[active]:bg-gray-50 data-[active]:shadow-inner'}
			ref={ref}
			{...props}
		>
			<FilterXIcon className={'w-3 h-3'} />
			<span>Exclude</span>
		</Button>
	)
})

/**
 * Button in a filter list that removes the filter
 */
export const DataViewActiveFilterUI = forwardRef(({ children, className, ...props }: { children: ReactNode, className?: string }, ref) => {
	return (
		<Button
			variant={'outline'}
			size="sm"
			className={cn('space-x-1 data-[current="none"]:hidden data-[current="exclude"]:line-through h-6', className)}
			ref={ref}
			{...props}
		>
			<span>
				{children}
			</span>
			<XIcon className={'w-2 h-2'} />
		</Button>
	)
})


export const DataViewSingleFilterUI = forwardRef<HTMLDivElement, { children: ReactNode }>((props, ref) => {
	return (
		<div className={'flex gap-2 rounded bg-gray-50 items-center text-sm px-2 py-1.5 border'} ref={ref} {...props} />
	)
})

export const DataViewFilterSelectTriggerUI = forwardRef<HTMLButtonElement, { children: ReactNode }>(({ children, ...props }, ref) => {
	return (
		<button className={'hover:underline inline-flex items-center gap-1 group'} ref={ref} {...props}>
			<span className={'text-xs font-semibold'}>
				{children}
			</span>
			<span
				className={'bg-gray-100 rounded-full border group-data-[state=open]:bg-white group-data-[state=open]:shadow-inner p-1'}
			>
				<PlusIcon className={'w-3 h-3'} />
			</span>
		</button>
	)
})

export interface DataViewFilterSelectItemProps {
	onInclude: () => void
	onExclude: () => void
	isIncluded: boolean
	isExcluded: boolean
	children: ReactNode
}

export const DataViewFilterSelectItemUI = forwardRef<HTMLButtonElement, DataViewFilterSelectItemProps>(({ children, onExclude, isExcluded, onInclude, isIncluded, ...props }, ref) => {
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
		<div className={'relative'} >
			<Button ref={ref} onClick={include} size={'sm'} className={'pl-1 w-full text-left justify-start gap-1 data-[highlighted]:bg-gray-200'} variant={'ghost'} {...props}>
				{isIncluded ? <CheckSquareIcon className={'w-3 h-3'} /> : <SquareIcon className={'w-3 h-3'} />}
				<span className={cn('font-normal', isIncluded && 'text-blue-700')}>
					{children}
				</span>
			</Button>
			<button onClick={exclude}
				  className={cn('absolute right-1 top-1/2 -translate-y-1/2 p-1 border rounded hover:bg-red-200', isExcluded ? 'bg-red-300 shadow-inner' : '')}>
				<FilterXIcon className={'h-3 w-3'} />
			</button>
		</div>

	)
})
