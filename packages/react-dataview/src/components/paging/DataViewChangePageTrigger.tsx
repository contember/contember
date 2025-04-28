import { forwardRef, useCallback, useMemo } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewPagingInfo, useDataViewPagingMethods, useDataViewPagingState } from '../../contexts'
import { dataAttribute } from '@contember/utilities'
import { composeEventHandlers } from '@radix-ui/primitive'

export interface DataViewChangePageTriggerAttributes {
	['data-active']?: ''
	['data-current']?: string
}

const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement> & DataViewChangePageTriggerAttributes>

export interface DataViewChangePageTriggerProps {
	/**
	 * The target page to navigate to:
	 * - A specific page number (0-based).
	 * - `'first'`: Navigates to the first page.
	 * - `'last'`: Navigates to the last page.
	 * - `'next'`: Navigates to the next page.
	 * - `'previous'`: Navigates to the previous page.
	 */
	page: number | 'first' | 'last' | 'next' | 'previous'
	/**
	 * The button or element used as the trigger.
	 */
	children: React.ReactNode
}

/**
 * A trigger component for changing pages in a data view.
 * Automatically disables the trigger when navigation is not possible (e.g., no next page).
 *
 * ## Props
 * - page, children
 *
 * See {@link DataViewChangePageTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the trigger corresponds to the current page.
 * - **`data-current`**: Reflects the current page index (0-based).
 * #### Example
 * ```tsx
 * <DataViewChangePageTrigger page="next">
 *     <button>Next</button>
 * </DataViewChangePageTrigger>
 * <DataViewChangePageTrigger page={1}>
 *     <button>Go to Page 2</button>
 * </DataViewChangePageTrigger>
 * ```
 */
export const DataViewChangePageTrigger = forwardRef<HTMLButtonElement, DataViewChangePageTriggerProps>(
	({ page, ...props }: DataViewChangePageTriggerProps, ref) => {
		const { goToPage } = useDataViewPagingMethods()
		const { pagesCount } = useDataViewPagingInfo()
		const { pageIndex } = useDataViewPagingState()

		const disabled = useMemo(() => {
			if (typeof page === 'number') {
				return page === pageIndex
			}
			switch (page) {
				case 'last':
					return pagesCount === undefined || pagesCount === 0 || pageIndex === pagesCount - 1
				case 'next':
					return pagesCount !== undefined && pageIndex === Math.max(pagesCount - 1, 0)
				case 'first':
				case 'previous':
					return pageIndex === 0
			}
			return false
		}, [page, pageIndex, pagesCount])

		const resolvedPage = (() => {
			switch (page) {
				case 'first':
					return 0
				case 'last':
					return pagesCount ? pagesCount - 1 : undefined
				default:
					return typeof page === 'number' ? page : undefined
			}
		})()

		const isActive = resolvedPage === pageIndex

		const goTo = useCallback(() => {
			if (!disabled) {
				goToPage(page)
			}
		}, [goToPage, page, disabled])

		const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

		return (
			<SlotType
				ref={ref}
				onClick={composeEventHandlers(onClick, goTo)}
				data-active={dataAttribute(isActive)}
				data-current={dataAttribute(pageIndex)}
				disabled={disabled}
				{...otherProps}
			/>
		)
	},
)

DataViewChangePageTrigger.displayName = 'DataViewChangePageTrigger'
