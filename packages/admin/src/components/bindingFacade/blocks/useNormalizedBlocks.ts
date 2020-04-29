import * as React from 'react'
import { NormalizedDiscriminatedData, useDiscriminatedData } from '../discrimination'
import { BlockCommonProps, LiteralBasedBlockProps, ScalarBasedBlockProps } from './Block'
import { useBlockProps } from './useBlockProps'

export type NormalizedBlocks = NormalizedDiscriminatedData<BlockCommonProps>

export const useNormalizedBlocks = (children: React.ReactNode): NormalizedBlocks => {
	const propList = useBlockProps(children)

	return useDiscriminatedData<LiteralBasedBlockProps, ScalarBasedBlockProps>(propList, {
		undiscriminatedItemMessage:
			`Each block must be discriminated by either exactly one of the ` +
			`'discriminateBy' or 'discriminateByScalar' props.`,
		mixedDiscriminationMessage:
			`Detected a set of Block components of non-uniform discrimination methods. ` +
			`They all have to use either 'discriminateBy' or 'discriminateByScalar'.`,
	})
}
