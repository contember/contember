import { Component } from '@contember/binding'
import * as React from 'react'

export type FieldFallbackViewStyle = 'n/a' | 'nothing' | 'unknown'

export interface FieldFallbackViewProps {
	fallback: React.ReactNode | undefined
	fallbackStyle: FieldFallbackViewStyle | undefined
}

export type FieldFallbackViewPublicProps = Partial<FieldFallbackViewProps>

export const FieldFallbackView = Component<FieldFallbackViewProps>(
	props => {
		if (props.fallback !== undefined) {
			return <>{props.fallback}</>
		}
		switch (props.fallbackStyle) {
			case 'nothing':
				return null
			case 'n/a':
				return <i style={{ opacity: 0.4, fontSize: '0.75em' }}>N/A</i>
			case 'unknown':
				return <i style={{ opacity: 0.4, fontSize: '0.75em' }}>unknown</i>
			default:
				return null
		}
	},
	props => <>{props.fallback}</>,
	'FieldFallbackView',
)
