import * as React from 'react'
import { useEnvironment } from '../../../../binding/accessorRetrievers'
import { BlockProps } from './Block'
import { blockAnalyzer } from './blockAnalyzer'

export const useBlockProps = (children: React.ReactNode): BlockProps[] => {
	const environment = useEnvironment()

	return React.useMemo(() => blockAnalyzer.processChildren(children, environment), [children, environment])
}
