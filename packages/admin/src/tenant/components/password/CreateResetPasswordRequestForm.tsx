import { FC, useCallback } from 'react'
import { useRedirect, useShowToast } from '../../../components'
import { RoutingLinkTarget } from '../../../routing'
import { Button, FormGroup, TextInput } from '@contember/ui'
import { useCreateResetPasswordRequest } from '../../mutations'
import { useForm } from '../../lib'

interface CreateResetPasswordRequestFormProps {
	redirectOnSuccess: RoutingLinkTarget
}

const initialValues = {
	email: '',
}

export const CreateResetPasswordRequestForm: FC<CreateResetPasswordRequestFormProps> = ({ redirectOnSuccess }) => {
	const redirect = useRedirect()
	const addToast = useShowToast()
	const createResetPasswordRequest = useCreateResetPasswordRequest()

	const { register, isSubmitting, onSubmit } = useForm(initialValues, useCallback(
			async values => {
				const response = await createResetPasswordRequest({
					email: values.email,
				})
				if (response.ok) {
					addToast({
						type: 'success',
						message: `Check your inbox for the instructions.`,
						dismiss: true,
					})
					redirect(redirectOnSuccess)
				} else {
					switch (response.error.code) {
						case 'PERSON_NOT_FOUND':
							return addToast({ message: `E-mail not found`, type: 'error' })
					}
				}
			},
			[addToast, createResetPasswordRequest, redirect, redirectOnSuccess],
		),
	)


	return (
		<form onSubmit={onSubmit}>
			<FormGroup label="E-mail">
				<TextInput {...register('email')} required={true} type={'email'} />
			</FormGroup>
			<FormGroup label={undefined}>
				<Button intent="primary" type={'submit'} disabled={isSubmitting}>
					Reset password
				</Button>
			</FormGroup>
		</form>
	)
}
