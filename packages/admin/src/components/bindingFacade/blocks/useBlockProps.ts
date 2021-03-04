import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { useEnvironment } from '@contember/binding'
import { BlockProps } from './Block'
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
