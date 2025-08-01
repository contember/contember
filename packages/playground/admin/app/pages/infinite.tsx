import { Binding } from '~/lib/binding'
import { Slots } from '~/lib/layout'
import {
	DataView,
	DataViewInfiniteLoadEachRow,
	DataViewInfiniteLoadProvider,
	DataViewInfiniteLoadScrollObserver,
	DataViewInfiniteLoadTrigger,
} from '@contember/react-dataview'
import { Field } from '@contember/interface'
import { Button } from '~/lib/ui/button'
import { DataGridLoader, DataGridPagination, DataGridToolbar } from '~/lib/datagrid'
import { Card, CardHeader, CardTitle } from '~/lib/ui/card'
import { GenericPage } from '~/lib/pages'

export default () => (
	<GenericPage title={<h1 className="text-3xl font-semibold">Articles infinite scroll</h1>}>
		<DataView
			entities="GridArticle"
			initialItemsPerPage={6}
			initialSorting={{ title: 'asc' }}
		>
			<DataGridToolbar />
			<DataViewInfiniteLoadProvider>
				<DataGridLoader>
					<div className="grid grid-cols-3 gap-4">
						<DataViewInfiniteLoadEachRow>
							<Card className="h-72">
								<CardHeader>
									<CardTitle>
										<Field field="title" />
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

			<DataGridPagination />

		</DataView>
	</GenericPage>
)
