import { Children, isValidElement, ReactNode } from 'react'

import {
	CreatePage,
	CreateScope,
	DataBindingProvider,
	DataGrid,
	DataGridPage,
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

export const createNode = (value: any): ReactNode | undefined => {
	if (typeof value === 'function') {
		value = value() as any
	}

	if (value.type === Symbol.for('react.fragment')) {
		value = getNodeForTesting(value.props.children)
	}

	if (value == null) {
		return undefined
	}

	if ('staticRender' in value) {
		return undefined
	}

	if (!isValidElement(value)) {
		return undefined
	}

	const props = value.props as any
	if (value.type === EditPage || value.type === EditScope || value.type === DetailPage || value.type === DetailScope) {
		return <EntitySubTree {...props as any} />
	} else if (value.type === CreatePage || value.type === CreateScope) {
		return <EntitySubTree {...props as any} isCreating />
	} else if (value.type === DataGridPage || value.type === DataGrid) {
		return <DataGrid {...props as any} />
	} else if (value.type === ListPage || value.type === ListScope || value.type === TablePage || value.type === MultiEditPage || value.type === MultiEditScope) {
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

function getNodeForTesting(children: ReactNode): ReactNode {
	let childToTest: ReactNode = null

	Children.forEach(children, child => {
		if (child && typeof child === 'object' && 'props' in child) {
			if ('entity' in child.props || 'entities' in child.props) {
				childToTest = child
			} else if (child.props.children) {
				childToTest = getNodeForTesting(child.props.children)
			}
		}
	})

	return childToTest
}
