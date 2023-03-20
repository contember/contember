import { isValidElement, ReactNode } from 'react'

import {
	CreatePage,
	DataBindingProvider,
	DataGrid,
	DataGridPage,
	DetailPage,
	EditPage,
	EntityListSubTree,
	EntitySubTree,
	GenericPage,
	ListPage,
	MultiEditPage,
	TablePage,
} from '@contember/admin'

export const createNode = (value: any): ReactNode | undefined => {
	if (typeof value === 'function') {
		value = value() as any
	}
	if ('staticRender' in value) {
		return undefined
	}

	if (!isValidElement(value)) {
		return undefined
	}

	const props = value.props as any
	if (value.type === EditPage || value.type === DetailPage) {
		return <EntitySubTree {...props as any} />
	} else if (value.type === CreatePage) {
		return <EntitySubTree {...props as any} isCreating />
	} else if (value.type === DataGridPage) {
		return <DataGrid {...props as any} />
	} else if (value.type === ListPage || value.type === TablePage || value.type === MultiEditPage) {
		return <EntityListSubTree {...props as any} />
	} else if (value.type === GenericPage) {
		for (const child of Array.isArray(props.children) ? props.children : [props.children]) {
			if (isValidElement(child) && child.type === DataBindingProvider) {
				return <>{(child.props as any).children}</>
			}
		}
	}

	return undefined
}
