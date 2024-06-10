import { useEnvironment } from '@contember/react-binding'
import { ReactNode, useMemo } from 'react'
import type { BlockProps } from './Block'
import { blockAnalyzer } from './blockAnalyzer'

export const useBlockProps = (children: ReactNode): BlockProps[] => {
	const environment = useEnvironment()

	return useMemo(() => {
		if (children === undefined) {
			return []
		}
		return blockAnalyzer.processChildren(children, environment)
	}, [children, environment])
}
