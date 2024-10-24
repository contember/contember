import { Binding } from '@app/lib/binding'
import { Slots } from '@app/lib/layout'
import * as React from 'react'
import { Fragment, ReactNode, useEffect, useRef, useState } from 'react'
import {
	DataView,
	useDataViewEntityListAccessor,
	useDataViewFilteringState,
	useDataViewPagingMethods,
	useDataViewPagingState,
	useDataViewSortingState,
} from '@contember/react-dataview'
import { Component, Entity, EntityListAccessor, Field } from '@contember/interface'
import { Button } from '@app/lib/ui/button'
import { DataGridLoader, DataGridPagination, DataGridToolbar } from '@app/lib/datagrid'
import { Card, CardHeader, CardTitle } from '@app/lib/ui/card'

export default () => {
	return <>
		<Slots.Title>
			<h1 className="text-3xl font-semibold">Articles infinite scroll</h1>
		</Slots.Title>

		<Binding>

			<DataView
				entities="GridArticle"
				initialItemsPerPage={5}
			>
				<DataGridToolbar/>
				<DataGridLoader>
					<div className="flex flex-col gap-2">
						<InfiniteScroll>
							<Card>
								<CardHeader>
									<CardTitle>
										<Field field="title"/>
									</CardTitle>
								</CardHeader>
							</Card>
						</InfiniteScroll>
					</div>
				</DataGridLoader>


				<DataGridPagination/>

			</DataView>
		</Binding>
	</>
}

const InfiniteScroll = Component(({ children }: {
	children: ReactNode
}) => {
	const entityList = useDataViewEntityListAccessor()
	const [accessors, setAccessors] = useState<EntityListAccessor[]>([])

	const stateChanged = useRef(false)


	const filteringState = useDataViewFilteringState()
	useEffect(() => {
		stateChanged.current = true
	}, [filteringState])

	const sortingState = useDataViewSortingState()
	useEffect(() => {
		stateChanged.current = true
	}, [sortingState])

	const pagingState = useDataViewPagingState()
	const { goToPage } = useDataViewPagingMethods()
	const isInfiniteScroll = useRef(false)
	useEffect(() => {
		if (isInfiniteScroll.current) {
			isInfiniteScroll.current = false
			return
		}
		stateChanged.current = true
	}, [pagingState])

	useEffect(() => {
		if (entityList) {
			if (stateChanged.current) {
				setAccessors([entityList])
			} else {
				setAccessors(it => [...it, entityList])
			}
			stateChanged.current = false
		}
	}, [entityList])

	return <>
		{accessors.map((accessor, index) => {
			return (
				<Fragment key={Array.from(accessor.ids()).join('__')}>
					{Array.from(accessor, entity => {
						return (
							<Entity key={entity.key} accessor={entity}>
								{children}
							</Entity>
						)
					})}
				</Fragment>
			)
		})}
		<Button onClick={() => {
			isInfiniteScroll.current = true
			goToPage('next')
		}}>Load more</Button>
	</>
}, ({ children }) => {
	return <>{children}</>
})
