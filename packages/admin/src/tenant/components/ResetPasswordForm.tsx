import { FC, useCallback } from 'react'
import { useRedirect, useShowToast } from '../../components'
import { RoutingLinkTarget } from '../../routing'
import { Button, FormGroup, TextInput } from '@contember/ui'
import { useResetPassword } from '../hooks'
import { useForm } from './useForm'

interface ResetPasswordFormProps {
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
			async values => {
				if (values.password !== values.passwordAgain) {
						return addToast({ message: `Passwords does not match`, type: 'error' })
				}
				const response = await resetPassword({
					password: values.password,
					token,
				})
				if (response.ok) {
					addToast({
						type: 'success',
						message: `Password successfully set.`,
					})
					redirect(redirectOnSuccess)
				} else {
					switch (response.error.code) {
						case 'PASSWORD_TOO_WEAK':
							return addToast({ message: `Password is too weak`, type: 'error' })
						case 'TOKEN_NOT_FOUND':
						case 'TOKEN_USED':
						case 'TOKEN_EXPIRED':
							return addToast({ message: `Reset link is not valid`, type: 'error' })
					}
				}
			},
			[addToast, redirect, redirectOnSuccess, resetPassword, token],
		),
	)


	return (
		<form onSubmit={onSubmit}>
			<FormGroup label="Password">
				<TextInput {...register('password')} required={true} type={'password'} />
			</FormGroup>
			<FormGroup label="Password again">
				<TextInput {...register('passwordAgain')} required={true} type={'password'} />
			</FormGroup>
			<FormGroup label={undefined}>
				<Button intent="primary" type={'submit'} disabled={isSubmitting}>
					Set new password
				</Button>
			</FormGroup>
		</form>
	)
}
