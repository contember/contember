import { Children, isValidElement, ReactNode } from 'react'
import { describe, expect, it } from 'bun:test'
import { Environment } from '@contember/react-binding'
import { Link, RoutingLinkFields } from '../../src/index.js'

interface StaticRenderProvider {
	staticRender?: (props: any, environment: Environment) => ReactNode
}

// Mimics the marker static-analysis pass: descend the rendered tree and
// recursively invoke the `staticRender` of any nested component that exposes one.
const collectFieldNames = (node: ReactNode, env: Environment): string[] => {
	const fields: string[] = []
	Children.forEach(node, child => {
		if (!isValidElement(child)) {
			return
		}
		const props = child.props as { field?: string; children?: ReactNode }
		if (typeof props.field === 'string') {
			fields.push(props.field)
		}
		const staticRender = (child.type as StaticRenderProvider | undefined)?.staticRender
		if (typeof staticRender === 'function') {
			fields.push(...collectFieldNames(staticRender(child.props, env), env))
		}
		if (props.children !== undefined) {
			fields.push(...collectFieldNames(props.children, env))
		}
	})
	return fields
}

describe('RoutingLinkFields', () => {
	it('exposes a static render', () => {
		expect(typeof (RoutingLinkFields as StaticRenderProvider).staticRender).toBe('function')
	})

	it('registers fields referenced by a binding routing target', () => {
		const env = Environment.create()
		const rendered = (RoutingLinkFields as StaticRenderProvider).staticRender!(
			{ to: 'myPage(id: $entity.someField)' },
			env,
		)

		expect(collectFieldNames(rendered, env)).toEqual(['someField'])
	})

	it('registers no fields when the target has no binding parameters', () => {
		const env = Environment.create()
		const rendered = (RoutingLinkFields as StaticRenderProvider).staticRender!(
			{ to: 'myPage(id: 123)' },
			env,
		)

		expect(collectFieldNames(rendered, env)).toEqual([])
	})
})

describe('Link static render', () => {
	it('exposes a static render', () => {
		expect(typeof (Link as StaticRenderProvider).staticRender).toBe('function')
	})

	it('registers fields referenced by a binding routing target', () => {
		const env = Environment.create()
		const rendered = (Link as StaticRenderProvider).staticRender!(
			{ to: 'myPage(id: $entity.someField)' },
			env,
		)

		expect(collectFieldNames(rendered, env)).toEqual(['someField'])
	})
})
