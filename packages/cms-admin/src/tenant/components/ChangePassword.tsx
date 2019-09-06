import * as React from 'react'
import { useChangePassword } from '../hooks'
import { Box, Button, FormGroup, TextInput, TitleBar } from '@contember/ui'

export const ChangePassword: React.FC<{}> = ({}) => {
	const [newPassword, setNewPassword] = React.useState('')
	const [newPasswordRepeated, setNewPasswordRepeated] = React.useState('')
	const [changePassword, changePasswordState] = useChangePassword()
	const [notEqualError, setNotEqualError] = React.useState(false)
	const [errorsResolved, setErrorsResolved] = React.useState(false)
	const cb = React.useCallback(() => {
		setErrorsResolved(true)
		if (newPassword !== newPasswordRepeated) {
			setNotEqualError(true)
		} else {
			changePassword(newPassword)
		}
	}, [changePassword, newPassword, newPasswordRepeated])
	const resolveErrors = React.useCallback(() => {
		setNotEqualError(false)
		setErrorsResolved(true)
	}, [setNotEqualError, setErrorsResolved])
	const changeNewPasswordAndRemoveErrors = React.useCallback(
		newValue => {
			resolveErrors()
			setNewPassword(newValue)
		},
		[resolveErrors, setNewPassword],
	)
	const changeNewPasswordRepeatedAndRemoveErrors = React.useCallback(
		newValue => {
			resolveErrors()
			setNewPasswordRepeated(newValue)
		},
		[resolveErrors, setNewPasswordRepeated],
	)

	const success = changePasswordState.finished && changePasswordState.success
	const error = notEqualError
		? 'Passwords are different'
		: changePasswordState.finished && !changePasswordState.success && !errorsResolved
		? changePasswordState.errors.join(', ')
		: undefined
	const validation = error ? 'invalid' : success ? 'valid' : 'default'
	const disabled = changePasswordState.loading || success

	return (
		<div>
			<TitleBar>Change your password</TitleBar>
			<Box>
				<div style={{ marginBottom: '1em' }}>
					<FormGroup label="New password" errors={error === undefined ? undefined : [{ message: error }]}>
						<TextInput
							validationState={validation}
							disabled={disabled}
							value={newPassword}
							onChange={e => changeNewPasswordAndRemoveErrors(e.target.value)}
							allowNewlines={false}
							type="password"
							autoComplete="new-password"
						/>
					</FormGroup>
					<FormGroup label="New password (once more)">
						<TextInput
							validationState={validation}
							disabled={disabled}
							value={newPasswordRepeated}
							onChange={e => changeNewPasswordRepeatedAndRemoveErrors(e.target.value)}
							allowNewlines={false}
							type="password"
							autoComplete="new-password"
						/>
					</FormGroup>
				</div>
				<Button
					intent={success ? 'success' : 'primary'}
					onClick={cb}
					isLoading={changePasswordState.loading}
					disabled={disabled}
				>
					{success ? 'Password changed' : 'Change password'}
				</Button>
			</Box>
		</div>
	)
}
