import { Component } from '@contember/binding'
import { FunctionComponent, ReactNode } from 'react'

export type FieldFallbackViewStyle = 'n/a' | 'nothing' | 'unknown'

export interface FieldFallbackViewProps {
	fallback: ReactNode | undefined
	fallbackStyle: FieldFallbackViewStyle | undefined
}

export type FieldFallbackViewPublicProps = Partial<FieldFallbackViewProps>

export const FieldFallbackView: FunctionComponent<FieldFallbackViewProps> = Component(
	props => {
		if (props.fallback !== undefined) {
			return <>{props.fallback}</>
		}
		switch (props.fallbackStyle) {
			case 'nothing':
				return null
			case 'unknown':
				return <i style={{ opacity: 0.4, fontSize: '0.75em' }}>unknown</i>
			case 'n/a':
			default:
				return <i style={{ opacity: 0.4, fontSize: '0.75em' }}>N/A</i>
		}
	},
	props => <>{props.fallback}</>,
	'FieldFallbackView',
)
