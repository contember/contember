import * as React from 'react'
import { forwardRef, ReactNode, useCallback } from 'react'
import { SelectListItemUI } from './ui'
import { DataViewHighlightRow, DataViewInteractionContext, DataViewKeyboardEventHandler } from './highlight'
import { ScrollArea } from '../ui/scroll-area'
import { DataViewLoaderOverlay } from '../datagrid'
import { SelectPagination } from './pagination'
import { Loader } from '../ui/loader'
import { EntityAccessor, useEntity } from '@contember/interface'
import { DataView, DataViewEachRow, DataViewLoaderState, DataViewProps } from '@contember/react-dataview'
import { Slot } from '@radix-ui/react-slot'


export type SelectListProps =
	& DataViewProps
	& {
		onSelect?: (entity: EntityAccessor) => void
		children: ReactNode
		filterToolbar?: ReactNode
	}

const SelectListItem = forwardRef<HTMLButtonElement, {
	children: ReactNode,
	onSelect?: (entity: EntityAccessor) => void
}>(({ onSelect, ...props }, ref) => {
	const entity = useEntity()
	const onClick = useCallback(() => {
		onSelect?.(entity)
	}, [entity, onSelect])
	return <Slot ref={ref} onClick={onClick} {...props}/>
})

export const SelectList = ({ children, filterToolbar, onSelect, ...props }: SelectListProps) => {
	return (
		<DataView {...props}>
			<DataViewInteractionContext onSelectHighlighted={onSelect}>
				<DataViewKeyboardEventHandler>
					<div className={'flex flex-col gap-4 group-data-[side="top"]:flex-col-reverse'}>
						{filterToolbar && <div className={'px-4'}>
							{filterToolbar}
						</div>}
						<ScrollArea className={'max-h-96'}>
							<div className={'flex flex-col gap-1 px-4'}>
								<DataViewLoaderState refreshing>
									<DataViewLoaderOverlay/>
								</DataViewLoaderState>
								<DataViewLoaderState refreshing loaded>
									<DataViewEachRow>
										<DataViewHighlightRow>
											<SelectListItem onSelect={onSelect}>
												{children}
											</SelectListItem>
										</DataViewHighlightRow>
									</DataViewEachRow>
									<SelectPagination/>
								</DataViewLoaderState>

							</div>
						</ScrollArea>
						<DataViewLoaderState initial>
							<Loader position={'static'} size={'small'}/>
						</DataViewLoaderState>
					</div>
				</DataViewKeyboardEventHandler>
			</DataViewInteractionContext>
		</DataView>
	)
}
