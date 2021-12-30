import { Button, FieldContainer, TextInput } from '@contember/ui'
import { FC, useCallback } from 'react'
import { useShowToast } from '../../../components'
import { RoutingLinkTarget, useRedirect } from '../../../routing'
import { useForm } from '../../lib'
import { useCreateResetPasswordRequest } from '../../mutations'

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
			<FieldContainer label="E-mail">
				<TextInput {...register('email')} required={true} type={'email'} />
			</FieldContainer>
			<FieldContainer label={undefined}>
				<Button intent="primary" type={'submit'} disabled={isSubmitting}>
					Reset password
				</Button>
			</FieldContainer>
		</form>
	)
}
