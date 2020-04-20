import { BindingError, Scalar, useEnvironment, VariableInputTransformer } from '@contember/binding'
import * as React from 'react'
import { BlockCommonProps, NormalizedBlocks, NormalizedLiteralBasedBlock, NormalizedScalarBasedBlock } from './Block'
import { useBlockProps } from './useBlockProps'

export const useNormalizedBlocks = (children: React.ReactNode): NormalizedBlocks => {
	const environment = useEnvironment()
	const propList = useBlockProps(children)
	return React.useMemo<NormalizedBlocks>(() => {
		const literalBased: Map<string, NormalizedLiteralBasedBlock> = new Map()
		const scalarBased: Map<Scalar, NormalizedScalarBasedBlock> = new Map()

		if (propList.length === 0) {
			return {
				discriminationKind: 'literal',
				blocks: literalBased,
			}
		}

		for (const props of propList) {
			const commonProps: BlockCommonProps = props
			if ('discriminateBy' in props) {
				const literal = VariableInputTransformer.transformVariableLiteral(props.discriminateBy, environment)
				literalBased.set(literal.value, {
					...commonProps,
					discriminateBy: literal,
				})
			} else if ('discriminateByScalar' in props) {
				const scalar = VariableInputTransformer.transformVariableScalar(props.discriminateByScalar, environment)
				scalarBased.set(scalar, {
					...commonProps,
					discriminateBy: scalar,
				})
			}
		}

		if (scalarBased.size && literalBased.size === 0) {
			return {
				discriminationKind: 'scalar',
				blocks: scalarBased,
			}
		}
		if (literalBased.size && scalarBased.size === 0) {
			return {
				discriminationKind: 'literal',
				blocks: literalBased,
			}
		}

		throw new BindingError(
			`Detected a set of Block components of non-uniform discrimination methods. ` +
				`They all have to use either 'discriminateBy' or 'discriminateByScalar'.`,
		)
	}, [environment, propList])
}
