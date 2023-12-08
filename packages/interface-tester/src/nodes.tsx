import { Children, isValidElement, ReactNode } from 'react'

import {
	CreatePage,
	CreateScope,
	DataBindingProvider,
	DataGrid,
	DataGridPage,
	DataGridScope,
	DetailPage,
	DetailScope,
	EditPage,
	EditScope,
	EntityListSubTree,
	EntitySubTree,
	GenericPage,
	ListPage,
	ListScope,
	MultiEditPage,
	MultiEditScope,
	TablePage,
} from '@contember/admin'

export const createNode = (value: any): ReactNode[] => {
	if (typeof value === 'function') {
		value = value() as any
	}
	if (value == null) {
		return []
	}

	if ('staticRender' in value) {
		return []
	}

	const props = value.props as any
	if (value.type === DataBindingProvider) {
		return [<>{props.children}</>]
	} else if (value.type === EditPage || value.type === EditScope || value.type === DetailPage || value.type === DetailScope) {
		return [<EntitySubTree {...props as any} />]
	} else if (value.type === CreatePage || value.type === CreateScope) {
		return [<EntitySubTree {...props as any} isCreating />]
	} else if (value.type === DataGridPage || value.type === DataGrid || value.type === DataGridScope) {
		return [<DataGrid {...props as any} />]
	} else if (value.type === ListPage || value.type === ListScope || value.type === TablePage || value.type === MultiEditPage || value.type === MultiEditScope) {
		return [<EntityListSubTree {...props as any} />]
	} else if (value.type === GenericPage || value.type === Symbol.for('react.fragment')) {
		return (Array.isArray(props.children) ? props.children : [props.children]).map(createNode).flat()
	}

	return []
}
