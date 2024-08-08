import React, { ReactElement, ReactNode } from 'react'
import { BranchMarkerProvider, EnvironmentDeltaProvider, LeafMarkerProvider, StaticRenderProvider } from './MarkerProvider'
import {
	EntityFieldMarkersContainer,
	EntityFieldsWithHoistablesMarker,
	Environment,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
} from '@contember/binding'
import { IncrementalMarkerBuilder } from './IncrementalMarkerBuilder'

type Markers = FieldMarker | HasOneRelationMarker | EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker | HasManyRelationMarker

export class MarkerStaticAnalyzer {
	public processChildren(
		children: ReactNode,
		env: Environment,
	): EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer {
		return IncrementalMarkerBuilder.build(this.processNode(children, env, []))
	}

	private processNode(
		node: ReactNode,
		env: Environment,
		componentPath: ReactElement[],
	): Markers[] {
		if (node === false || node === undefined || node === null || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
			return []
		}
		if (typeof node === 'function') {
			throw new ChildrenAnalyzerError(`Render props (functions as React component children) are not supported within the schema. ` +
				`You have likely used a bare custom component as opposed to wrapping in with \`Component\` ` +
				`from the \`@contember/admin\` package. Please refer to the documentation.`)
		}

		if (Array.isArray(node)) {
			return node.flatMap(subNode => this.processNode(subNode, env, componentPath))
		}

		if (!('type' in node)) {
			return []
		}

		if (typeof node.type === 'symbol' || typeof node.type === 'string') {
			// Fragment, Portal or other non-component
			return this.processNode(node.props.children, env, componentPath)
		}

		componentPath = [...componentPath, node]

		const nodeDisplayName = 'displayName' in node.type ? (node.type.displayName as string) : '???'

		try {
			if ('generateEnvironment' in node.type) {
				env = (node.type as EnvironmentDeltaProvider).generateEnvironment(node.props, env)
			}
		} catch (e) {
			wrapError(e, nodeDisplayName, 'static context factory', componentPath)
		}
		if ('generateLeafMarker' in node.type) {
			return [(node.type as LeafMarkerProvider).generateLeafMarker(node.props, env)]
		}
		let children: ReactNode = node.props.children
		try {
			if ('staticRender' in node.type) {
				children = (node.type as StaticRenderProvider).staticRender(node.props, env)
			}
		} catch (e) {
			wrapError(e, nodeDisplayName, 'static render', componentPath)
		}
		const processedChildren = this.processNode(children, env, componentPath)
		if ('generateBranchMarker' in node.type) {
			const marker = IncrementalMarkerBuilder.build(processedChildren)
			return [(node.type as BranchMarkerProvider).generateBranchMarker(node.props, marker, env)]
		}
		return processedChildren
	}
}

export class ChildrenAnalyzerError extends Error {
	public details?: string

	constructor(message: string, options?: { cause: Error; details?: string }) {
		super(message, options)
		this.details = options?.details
	}
}

const wrapError = (e: unknown, currentComponentName: string, methodName: string, path: ReactElement[]): never => {
	if (!(e instanceof Error)) {
		throw e
	}

	const componentPath = path.map((it, index) => {
		const { children, ...props } = it.props
		const printProps = (props: any) => {
			let result = ''
			for (const [key, value] of Object.entries(props)) {
				if (value === undefined) {
					continue
				}
				try {
					const valuePrinted = JSON.stringify(value, (key, value) => {
						if (typeof value === 'function') {
							return '(function)'
						}
						if (React.isValidElement(value)) {
							return '(react element)'
						}
						return value
					},
					)
					result += ` ${key}=${valuePrinted}`
				} catch {
					result += ` ${key}=(failed to print a value)`
				}
			}
			return result
		}
		const componentName = typeof it.type === 'object' && 'displayName' in it.type ? (it.type as any).displayName : null
		const propsPrinted = printProps(props)
		const indent = '  '.repeat(index)
		return `${indent}<${componentName ?? '???'}${propsPrinted}>`
	})
	const errorMessage = `Error during static render of ${currentComponentName} in ${methodName}:\n${e.message || 'unknown error'}`

	throw new ChildrenAnalyzerError(errorMessage, {
		cause: e,
		details: `Component path:\n${componentPath.join('\n')}`,
	})
}
