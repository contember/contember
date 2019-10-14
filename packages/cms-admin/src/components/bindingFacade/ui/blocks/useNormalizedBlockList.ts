import * as React from 'react'
import { useEnvironment } from '../../../../binding/accessorRetrievers'
import { DataBindingError } from '../../../../binding/dao'
import { VariableInputTransformer } from '../../../../binding/model/VariableInputTransformer'
import { BlockCommonProps, NormalizedBlockList, NormalizedDynamicBlockProps, NormalizedStaticBlockProps } from './Block'
import { useBlockProps } from './useBlockProps'

export const useNormalizedBlockList = (children: React.ReactNode): NormalizedBlockList => {
	const environment = useEnvironment()
	const propList = useBlockProps(children)
	return React.useMemo(() => {
		const staticBlockProps: NormalizedStaticBlockProps[] = []
		const dynamicBlockProps: NormalizedDynamicBlockProps[] = []

		if (propList.length === 0) {
			return []
		}

		for (const props of propList) {
			const commonProps: BlockCommonProps = props
			if ('discriminateBy' in props) {
				staticBlockProps.push({
					...commonProps,
					discriminateBy: VariableInputTransformer.transformVariableLiteral(props.discriminateBy, environment),
				})
			} else if ('discriminateByScalar' in props) {
				dynamicBlockProps.push({
					...commonProps,
					discriminateBy: VariableInputTransformer.transformVariableScalar(props.discriminateByScalar, environment),
				})
			}
		}

		if (dynamicBlockProps.length && staticBlockProps.length === 0) {
			return dynamicBlockProps
		}
		if (staticBlockProps.length && dynamicBlockProps.length === 0) {
			return staticBlockProps
		}

		throw new DataBindingError(
			`Detected a set of Block components of non-uniform discrimination methods. ` +
				`They all have to use either 'discriminateBy' or 'discriminateByScalar'.`,
		)
	}, [environment, propList])
}
