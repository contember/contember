import type { ReactNode } from 'react'
import { NormalizedDiscriminatedData, useDiscriminatedData } from '../discrimination'
import type { BlockProps } from './Block'
import { useBlockProps } from './useBlockProps'
import { Environment } from '@contember/react-binding'

export type NormalizedBlocks = NormalizedDiscriminatedData<BlockProps>

export const useNormalizedBlocks = (children: ReactNode, env: Environment): NormalizedBlocks => {
	const propList = useBlockProps(children, env)

	return useDiscriminatedData<BlockProps>(propList)
}
