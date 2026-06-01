import { BranchNode, ChildrenAnalyzer } from '@contember/react-multipass-rendering'
import { useDataViewChildren } from '../contexts.js'
import { DataViewElement } from '../components/index.js'
import { Environment, useEnvironment } from '@contember/react-binding'
import { ReactNode, useMemo, useState } from 'react'
import { DataViewSelectionValues } from '../types/index.js'
import { dataViewSelectionEnvironmentExtension } from '../env/dataViewSelectionEnvironmentExtension.js'

/**
 * Hook for getting all DataView elements from the children.
 * Used for visibility toggling.
 */
export const useDataViewElements = ({ selection }: {
	selection?: DataViewSelectionValues
} = {}): DataViewElementData[] => {
	const children = useDataViewChildren()
	const env = useEnvironment()

	const [analyzer] = useState(() => {
		const elementNode = new BranchNode(
			(node, child: undefined | DataViewElementData | DataViewElementData[], env: Environment): DataViewElementData => {
				return {
					name: node.props.name,
					label: node.props.label,
					fallback: node.props.fallback,
					children: Array.isArray(child) ? child : child ? [child] : [],
				}
			},
			DataViewElement,
			{
				childrenAreOptional: true,
			},
		)

		return new ChildrenAnalyzer<
			never,
			DataViewElementData,
			Environment
		>([], [elementNode], {
			staticRenderFactoryName: 'staticRender',
			staticContextFactoryName: 'generateEnvironment',
		})
	})

	return useMemo((): DataViewElementData[] => {
		const envWithSelection = selection ? env.withExtension(dataViewSelectionEnvironmentExtension, selection) : env

		const elements = analyzer.processChildren(children, envWithSelection)
		const uniqueElements = Object.values(Object.fromEntries(elements.map(it => [it.name, it])))

		return uniqueElements
	}, [analyzer, children, env, selection])
}

export type DataViewElementData = {
	name: string
	label?: ReactNode
	fallback?: boolean
	children?: DataViewElementData[]
}
