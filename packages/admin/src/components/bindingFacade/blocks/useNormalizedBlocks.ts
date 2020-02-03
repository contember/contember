import { BindingError, useEnvironment, VariableInputTransformer } from '@contember/binding'
import * as React from 'react'
import { BlockCommonProps, NormalizedBlock, NormalizedLiteralBasedBlock, NormalizedScalarBasedBlock } from './Block'
import { useBlockProps } from './useBlockProps'

export const useNormalizedBlocks = (children: React.ReactNode): NormalizedBlock[] => {
	const environment = useEnvironment()
	const propList = useBlockProps(children)
	return React.useMemo(() => {
		const literalBased: NormalizedLiteralBasedBlock[] = []
		const scalarBased: NormalizedScalarBasedBlock[] = []

		if (propList.length === 0) {
			return literalBased
		}

		for (const props of propList) {
			const commonProps: BlockCommonProps = props
			if ('discriminateBy' in props) {
				literalBased.push({
					...commonProps,
					discriminateBy: VariableInputTransformer.transformVariableLiteral(props.discriminateBy, environment),
				})
			} else if ('discriminateByScalar' in props) {
				scalarBased.push({
					...commonProps,
					discriminateBy: VariableInputTransformer.transformVariableScalar(props.discriminateByScalar, environment),
				})
			}
		}

		if (scalarBased.length && literalBased.length === 0) {
			return scalarBased
		}
		if (literalBased.length && scalarBased.length === 0) {
			return literalBased
		}

		throw new BindingError(
			`Detected a set of Block components of non-uniform discrimination methods. ` +
				`They all have to use either 'discriminateBy' or 'discriminateByScalar'.`,
		)
	}, [environment, propList])
}
