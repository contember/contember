import { Environment, useEnvironment } from '@contember/react-binding'
import { ReactNode, useMemo } from 'react'
import type { BlockProps } from './Block'
import { blockAnalyzer } from './blockAnalyzer'

export const useBlockProps = (children: ReactNode, env: Environment): BlockProps[] => {
	return useMemo(() => {
		if (children === undefined) {
			return []
		}
		return blockAnalyzer.processChildren(children, env)
	}, [children, env])
}
