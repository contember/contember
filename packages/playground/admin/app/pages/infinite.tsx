import { Binding } from '@app/lib/binding'
import { Slots } from '@app/lib/layout'
import * as React from 'react'
import { Fragment } from 'react'
import {
	DataView,
	DataViewInfiniteLoadEachRow,
	DataViewInfiniteLoadProvider,
	DataViewInfiniteLoadScrollObserver,
	DataViewInfiniteLoadTrigger,
} from '@contember/react-dataview'
import { Field } from '@contember/interface'
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
				initialItemsPerPage={6}
				initialSorting={{ title: 'asc' }}
			>
				<DataGridToolbar/>
				<DataViewInfiniteLoadProvider>
					<DataGridLoader>
						<div className="grid grid-cols-3 gap-4">
							<DataViewInfiniteLoadEachRow>
								<Card className="h-72">
									<CardHeader>
										<CardTitle>
											<Field field="title"/>
										</CardTitle>
									</CardHeader>
								</Card>
							</DataViewInfiniteLoadEachRow>
						</div>
						<DataViewInfiniteLoadScrollObserver />
						<div className="flex justify-center mt-8">
							<DataViewInfiniteLoadTrigger>
								<Button size="lg">Load more</Button>
							</DataViewInfiniteLoadTrigger>
						</div>
					</DataGridLoader>
				</DataViewInfiniteLoadProvider>
				{/*<DataGridLoader>*/}
				{/*</DataGridLoader>*/}


				<DataGridPagination/>

			</DataView>
		</Binding>
	</>
}
