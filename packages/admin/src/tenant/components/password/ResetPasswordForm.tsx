import { Button, FieldContainer, PasswordInput, Stack, useShowToast } from '@contember/ui'
import { FC, useCallback } from 'react'
import { RoutingLinkTarget, useRedirect } from '../../../routing'
import { useForm } from '../../lib'
import { useResetPassword } from '../../mutations'

export interface ResetPasswordFormProps {
	token: string
	redirectOnSuccess: RoutingLinkTarget
}

const initialValues = {
	password: '',
	passwordAgain: '',
}

export const ResetPasswordForm: FC<ResetPasswordFormProps> = ({ redirectOnSuccess, token }) => {
	const redirect = useRedirect()
	const addToast = useShowToast()
	const resetPassword = useResetPassword()

	const { register, isSubmitting, onSubmit } = useForm<typeof initialValues>(initialValues, useCallback(
		async (values: typeof initialValues) => {
			if (values.password !== values.passwordAgain) {
				return addToast({ message: `Passwords does not match`, type: 'error', dismiss: true })
			}
			const response = await resetPassword({
				password: values.password,
				token,
			})
			if (response.ok) {
				addToast({
					type: 'success',
					message: `Password successfully set.`,
					dismiss: true,
				})
				redirect(redirectOnSuccess)
			} else {
				switch (response.error.code) {
					case 'PASSWORD_TOO_WEAK':
						return addToast({ message: `Password is too weak`, type: 'error', dismiss: true })
					case 'TOKEN_NOT_FOUND':
					case 'TOKEN_USED':
					case 'TOKEN_EXPIRED':
						return addToast({ message: `Reset link is not valid`, type: 'error', dismiss: true })
				}
			}
		},
		[addToast, redirect, redirectOnSuccess, resetPassword, token],
	),
	)

	return (
		<form onSubmit={onSubmit}>
			<Stack gap="large">
				<FieldContainer label="Password">
					<PasswordInput {...register('password')} required={true} />
				</FieldContainer>
				<FieldContainer label="Password again">
					<PasswordInput {...register('passwordAgain')} required={true} />
				</FieldContainer>
				<FieldContainer label={undefined}>
					<Button distinction="primary" type={'submit'} disabled={isSubmitting}>
						Set new password
					</Button>
				</FieldContainer>
			</Stack>
		</form>
	)
}
