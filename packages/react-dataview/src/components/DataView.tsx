import { ReactNode } from 'react'
import { Component, QueryLanguage } from '@contember/react-binding'
import { useDataView, UseDataViewArgs } from '../hooks'
import { ControlledDataView } from './ControlledDataView'
import { DataViewLoader } from '../internal/components/DataViewLoader'
import { DATA_VIEW_DEFAULT_ITEMS_PER_PAGE } from '../internal/hooks/useDataViewPaging'
import { EntityAccessor } from '@contember/binding'


export type DataViewProps =
	& {
		children: ReactNode
		onSelectHighlighted?: (entity: EntityAccessor) => void
	}
	& UseDataViewArgs

export const DataView = Component<DataViewProps>(props => {
	const { state, methods, info } = useDataView(props)

	return (
		<ControlledDataView state={state} methods={methods} info={info} onSelectHighlighted={props.onSelectHighlighted}>
			{props.children}
		</ControlledDataView>
	)
}, (props, env) => {
	return (
		<DataViewLoader children={props.children} state={{
			key: '_',
			entities: QueryLanguage.desugarQualifiedEntityList({ entities: props.entities }, env),
			paging: {
				pageIndex: 0,
				itemsPerPage: props.initialItemsPerPage ?? DATA_VIEW_DEFAULT_ITEMS_PER_PAGE,
			},
			filtering: {
				filter: {
					and: [{}],
				},
				filterTypes: {},
				artifact: {},
			},
			sorting: {
				orderBy: [],
				directions: {},
			},
			selection: {
				values: props.initialSelection && typeof props.initialSelection !== 'function' ? props.initialSelection : {},
				fallback: props.selectionFallback === undefined ? true : props.selectionFallback,
			},
		}} />
	)
})
