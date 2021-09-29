import { Box, Button, FormGroup, TextInput, TitleBar } from '@contember/ui'
import { FC, useCallback, useState } from 'react'
import { useChangePassword } from '../hooks'

export const ChangePassword: FC<{}> = ({}) => {
	const [newPassword, setNewPassword] = useState('')
	const [newPasswordRepeated, setNewPasswordRepeated] = useState('')
	const [changePassword, changePasswordState] = useChangePassword()
	const [notEqualError, setNotEqualError] = useState(false)
	const [errorsResolved, setErrorsResolved] = useState(false)
	const onSubmit = useCallback(() => {
		setErrorsResolved(false)
		if (newPassword !== newPasswordRepeated) {
			setNotEqualError(true)
		} else {
			changePassword(newPassword)
		}
	}, [changePassword, newPassword, newPasswordRepeated])
	const resolveErrors = useCallback(() => {
		setNotEqualError(false)
		setErrorsResolved(true)
	}, [setNotEqualError, setErrorsResolved])
	const changeNewPasswordAndRemoveErrors = useCallback(
		newValue => {
			resolveErrors()
			setNewPassword(newValue)
		},
		[resolveErrors, setNewPassword],
	)
	const changeNewPasswordRepeatedAndRemoveErrors = useCallback(
		newValue => {
			resolveErrors()
			setNewPasswordRepeated(newValue)
		},
		[resolveErrors, setNewPasswordRepeated],
	)

	const success = changePasswordState.state === 'success'
	const errorFirstField = notEqualError
		? undefined
		: changePasswordState.state === 'error' && !errorsResolved
		? changePasswordState.errors.join(', ')
		: undefined
	const errorSecondField = notEqualError ? 'Passwords are different' : undefined
	const validation = errorFirstField ? 'invalid' : success ? 'valid' : 'default'
	const disabled = changePasswordState.state === 'loading' || success

	return (
		<div>
			<TitleBar>Change your password</TitleBar>
			<Box>
				<div style={{ marginBottom: '1em' }}>
					<FormGroup
						label="New password"
						errors={errorFirstField === undefined ? undefined : [{ message: errorFirstField }]}
					>
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
					<FormGroup
						label="New password (once more)"
						errors={errorSecondField === undefined ? undefined : [{ message: errorSecondField }]}
					>
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
					onClick={onSubmit}
					isLoading={changePasswordState.state === 'loading'}
					disabled={disabled}
				>
					{success ? 'Password changed' : 'Change password'}
				</Button>
			</Box>
		</div>
	)
}
