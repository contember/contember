import { ChildrenAnalyzer, Leaf } from '@contember/react-multipass-rendering'
import { useDataViewChildren } from '../contexts'
import { DataViewElement, DataViewElementProps } from '../components'
import { Environment } from '@contember/binding'
import { useMemo } from 'react'
import { useEnvironment } from '@contember/react-binding'
import { DataViewSelectionValues } from '../types'
import { dataViewSelectionEnvironmentExtension } from '../env/dataViewSelectionEnvironmentExtension'

export const useDataViewElements = ({ selection }: {
	selection?: DataViewSelectionValues
} = {}) => {
	const children = useDataViewChildren()
	const env = useEnvironment()

	return useMemo(() => {
		const envWithSelection = selection ? env.withExtension(dataViewSelectionEnvironmentExtension, selection) : env

		const elements = dataviewElementAnalyzer.processChildren(children, envWithSelection)
		const uniqueElements = Object.values(Object.fromEntries(elements.map(it => [it.name, it])))

		return uniqueElements
	}, [children, env, selection])
}

const elementLeaf = new Leaf(node => node.props, DataViewElement)

const dataviewElementAnalyzer = new ChildrenAnalyzer<
	DataViewElementProps,
	never,
	Environment
>([elementLeaf], {
	staticRenderFactoryName: 'staticRender',
	staticContextFactoryName: 'generateEnvironment',
})
