import { Button, FieldContainer, Heading, PasswordInput, Spacer, Stack, useShowToast } from '@contember/ui'
import { FC, useCallback } from 'react'
import { FormHandler, useForm } from '../../lib'
import { useChangePassword } from '../../mutations'

const initialValues = {
	currentPassword: '',
	newPassword: '',
	newPasswordAgain: '',
}

/**
 * @group Tenant
 */
export const ChangePassword: FC<{}> = ({ }) => {
	const changePassword = useChangePassword()
	const addToast = useShowToast()
	const { register, errors, isSubmitting, onSubmit } = useForm(initialValues, useCallback<FormHandler<typeof initialValues>>(async (val, setError, setValues) => {
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
			setValues(initialValues)
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

	return <>
		<Heading depth={3}>Change password</Heading>
		<form onSubmit={onSubmit}>
			<Stack gap="large">
				<FieldContainer
					label="Current password"
					errors={errors.currentPassword === undefined ? undefined : [{ message: errors.currentPassword }]}
				>
					<PasswordInput autoComplete="password" {...register('currentPassword')} />
				</FieldContainer>
				<FieldContainer
					label="New password"
					errors={errors.newPassword === undefined ? undefined : [{ message: errors.newPassword }]}
				>
					<PasswordInput autoComplete="new-password" {...register('newPassword')} />
				</FieldContainer>
				<FieldContainer
					label="Confirm new password"
					errors={errors.newPasswordAgain === undefined ? undefined : [{ message: errors.newPasswordAgain }]}
				>
					<PasswordInput autoComplete="new-password" {...register('newPasswordAgain')} />
				</FieldContainer>
				<Spacer />
				<Button intent={'primary'} type={'submit'} disabled={isSubmitting}>
					Change password
				</Button>
			</Stack>
		</form>
	</>
}
