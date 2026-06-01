import type { ReactNode } from 'react'
import { NormalizedDiscriminatedData, useDiscriminatedData } from '../discrimination/index.js'
import type { BlockProps } from './Block.js'
import { useBlockProps } from './useBlockProps.js'
import { Environment } from '@contember/react-binding'

export type NormalizedBlocks = NormalizedDiscriminatedData<BlockProps>

export const useNormalizedBlocks = (children: ReactNode, env: Environment): NormalizedBlocks => {
	const propList = useBlockProps(children, env)

	return useDiscriminatedData<BlockProps>(propList)
}
