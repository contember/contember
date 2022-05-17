import React, { ReactElement } from 'react'
import { ChildrenAnalyzerError } from '../ChildrenAnalyzerError'

export const wrapError = (e: unknown, currentComponentName: string, methodName: string, path: ReactElement[]): never => {
	if (!(e instanceof Error)) {
		throw e
	}

	const componentPath = path.map((it, index) => {
		const { children, ...props } = it.props
		const printProps = (props: any) => {
			let result = ''
			for (const [key, value] of Object.entries(props)) {
				if (value === undefined) {
					continue
				}
				try {
					const valuePrinted = JSON.stringify(value, (key, value) => {
							if (typeof value === 'function') {
								return '(function)'
							}
							if (React.isValidElement(value)) {
								return '(react element)'
							}
							return value
						},
					)
					result += ` ${key}=${valuePrinted}`
				} catch {
					result += ` ${key}=(failed to print a value)`
				}
			}
			return result
		}
		const componentName = typeof it.type === 'object' && 'displayName' in it.type ? (it.type as any).displayName : null
		const propsPrinted = printProps(props)
		const indent = '  '.repeat(index)
		return `${indent}<${componentName ?? '???'}${propsPrinted}>`
	})
	const errorMessage = `Error during static render of ${currentComponentName} in ${methodName}:\n${e.message || 'unknown error'}`

	throw new ChildrenAnalyzerError(errorMessage, {
		cause: e,
		details: `Component path:\n${componentPath.join('\n')}`,
	})
}
