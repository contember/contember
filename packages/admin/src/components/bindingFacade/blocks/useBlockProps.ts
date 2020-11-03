import * as React from 'react'
import { useEnvironment } from '@contember/binding'
import { BlockProps } from './Block'
import { blockAnalyzer } from './blockAnalyzer'

export const useBlockProps = (children: React.ReactNode): BlockProps[] => {
	const environment = useEnvironment()

	return React.useMemo(() => {
		if (children === undefined) {
			return []
		}
		return blockAnalyzer.processChildren(children, environment)
	}, [children, environment])
}
