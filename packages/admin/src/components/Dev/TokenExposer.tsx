import { useState } from 'react'
import { connect } from 'react-redux'
import State from '../../state'
import { Button } from '@contember/ui'
import { isDevMode } from './isDevMode'

interface TokenExposerStateProps {
	token: string | undefined
}

interface TokenExposerOwnProps {}

interface TokenExposerProps extends TokenExposerStateProps, TokenExposerOwnProps {}

const TokenExposerComponent = (props: TokenExposerProps) => {
	const [isCopying, setIsCopying] = useState(false)

	if (!navigator.clipboard || !isDevMode()) {
		return null
	}

	return (
		<Button
			style={{
				marginLeft: '.75em',
			}}
			onClick={() => {
				if (isCopying) {
					return
				}
				if (!props.token) {
					alert('Error: token unavailable!')
				}
				setIsCopying(true)
				navigator.clipboard
					.writeText(`{"Authorization": "Bearer ${props.token}"}`)
					.then(() => {
						alert('Copied!')
					})
					.catch(() => {
						alert('Error!')
					})
					.finally(() => {
						setIsCopying(false)
					})
			}}
		>
			Copy authenticated header
		</Button>
	)
}

export const TokenExposer = connect<TokenExposerStateProps, {}, TokenExposerOwnProps, State>(state => {
	return {
		token: state.auth.identity ? state.auth.identity.token : undefined,
	}
})(TokenExposerComponent)
