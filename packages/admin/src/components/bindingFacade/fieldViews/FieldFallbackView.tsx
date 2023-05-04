import { Component } from '@contember/binding'
import type { FunctionComponent, ReactNode } from 'react'
import { useMessageFormatter } from '../../../i18n'
import { fieldViewDictionary } from './fieldViewDictionary'

export type FieldFallbackViewStyle = 'n/a' | 'nothing' | 'unknown'

export interface FieldFallbackViewProps {
	fallback: ReactNode | undefined
	fallbackStyle: FieldFallbackViewStyle | undefined
}

export type FieldFallbackViewPublicProps = Partial<FieldFallbackViewProps>

/**
 * @group Field Views
 */
export const FieldFallbackView: FunctionComponent<FieldFallbackViewProps> = Component(
	props => {
		const formatMessage = useMessageFormatter(fieldViewDictionary)

		if (props.fallback !== undefined) {
			return <>{props.fallback}</>
		}
		switch (props.fallbackStyle) {
			case 'nothing':
				return null
			case 'unknown':
				return <i style={{ opacity: 0.4, fontSize: '0.75em' }}>{formatMessage('fieldView.fallback.unknown')}</i>
			case 'n/a':
			default:
				return <i style={{ opacity: 0.4, fontSize: '0.75em' }}>{formatMessage('fieldView.fallback.notAvailable')}</i>
		}
	},
	props => <>{props.fallback}</>,
	'FieldFallbackView',
)
