import { Button, FormGroup, LayoutPage, TextInput } from '@contember/ui'
import { FC, useCallback } from 'react'
import { useShowToast } from '../../components'
import { useChangePassword } from '../hooks'
import { useForm } from './useForm'

const initialValues = {
	currentPassword: '',
	newPassword: '',
	newPasswordAgain: '',
}

export const ChangePassword: FC<{}> = ({}) => {
	const changePassword = useChangePassword()
	const addToast = useShowToast()
	const { register, errors, isSubmitting, onSubmit } = useForm(initialValues, useCallback(async (val: typeof initialValues, setError) => {
		if (val.newPassword !== val.newPasswordAgain) {
			return setError('newPasswordAgain', 'Password confirmation doesn\'t match')
		}
		const response = await changePassword({ currentPassword: val.currentPassword, newPassword: val.newPassword })
		if (response.ok) {
			addToast({
				message: 'Password changed',
				type: 'success',
				dismiss: true,
			})
		} else {
			switch (response.error.code) {
				case 'INVALID_PASSWORD':
					return setError('currentPassword', 'Current password is invalid')
				case 'TOO_WEAK':
					return setError('newPassword', 'Password is too weak')
				default:
					return addToast({
						message: 'Unknown error',
						type: 'error',
						dismiss: true,
					})
			}
		}
	}, [addToast, changePassword]))

	return (
			<LayoutPage title="Change your password">
				<form onSubmit={onSubmit}>
					<FormGroup
						label="Current password"
						errors={errors.currentPassword === undefined ? undefined : [{ message: errors.currentPassword }]}
					>
						<TextInput
							allowNewlines={false}
							type="password"
							autoComplete="password"
							{...register('currentPassword')}
						/>
					</FormGroup>
					<FormGroup
						label="New password"
						errors={errors.newPassword === undefined ? undefined : [{ message: errors.newPassword }]}
					>
						<TextInput
							allowNewlines={false}
							type="password"
							autoComplete="new-password"
							{...register('newPassword')}
						/>
					</FormGroup>
					<FormGroup
						label="Confirm new password"
						errors={errors.newPasswordAgain === undefined ? undefined : [{ message: errors.newPasswordAgain }]}
					>
						<TextInput
							allowNewlines={false}
							type="password"
							autoComplete="new-password"
							{...register('newPasswordAgain')}
						/>
					</FormGroup>
					<br />
					<Button intent={'primary'} type={'submit'} disabled={isSubmitting}>
						Change password
					</Button>
				</form>
			</LayoutPage>
	)
}
