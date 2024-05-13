import type { ReactNode } from 'react'
import { NormalizedDiscriminatedData, useDiscriminatedData } from '../discrimination'
import type { BlockProps } from './Block'
import { useBlockProps } from './useBlockProps'

export type NormalizedBlocks = NormalizedDiscriminatedData<BlockProps>

export const useNormalizedBlocks = (children: ReactNode): NormalizedBlocks => {
	const propList = useBlockProps(children)

	return useDiscriminatedData<BlockProps>(propList)
}
