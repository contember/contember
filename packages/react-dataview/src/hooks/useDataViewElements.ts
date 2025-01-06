import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { useDataViewChildren } from '../contexts'
import { DataViewElement, DataViewElementProps } from '../components'
import { Environment } from '@contember/react-binding'
import { useMemo, useState } from 'react'
import { useEnvironment } from '@contember/react-binding'
import { DataViewSelectionValues } from '../types'
import { dataViewSelectionEnvironmentExtension } from '../env/dataViewSelectionEnvironmentExtension'

/**
 * Hook for getting all DataView elements from the children.
 * Used for visibility toggling.
 */
export const useDataViewElements = ({ selection }: {
	selection?: DataViewSelectionValues
} = {}) => {
	const children = useDataViewChildren()
	const env = useEnvironment()

	const [analyzer] = useState(() => {
		const elementLeaf = new Leaf(node => node.props, DataViewElement)

		return new ChildrenAnalyzer<
			DataViewElementProps,
			never,
			Environment
		>([elementLeaf], {
			staticRenderFactoryName: 'staticRender',
			staticContextFactoryName: 'generateEnvironment',
		})
	})

	return useMemo(() => {
		const envWithSelection = selection ? env.withExtension(dataViewSelectionEnvironmentExtension, selection) : env

		const elements = analyzer.processChildren(children, envWithSelection)
		const uniqueElements = Object.values(Object.fromEntries(elements.map(it => [it.name, it])))

		return uniqueElements
	}, [analyzer, children, env, selection])
}

