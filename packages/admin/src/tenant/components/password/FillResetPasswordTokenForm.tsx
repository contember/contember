import { Button, FieldContainer, TextInput } from '@contember/ui'
import { FC, useCallback } from 'react'
import { RoutingLinkTarget, useRedirect } from '../../../routing'
import { useForm } from '../../lib'

interface FillResetPasswordTokenFormProps {
	resetLink: (token: string) => RoutingLinkTarget
}

const initialValues = {
	token: '',
}

export const FillResetPasswordTokenForm: FC<FillResetPasswordTokenFormProps> = ({ resetLink }) => {
	const redirect = useRedirect()

	const { register, isSubmitting, onSubmit } = useForm<typeof initialValues>(initialValues, useCallback(
			async values => {
				redirect(resetLink(values.token))
			},
			[redirect, resetLink],
		),
	)

	return (
		<form onSubmit={onSubmit}>
			<FieldContainer label="Token">
				<TextInput {...register('token')} required={true} />
			</FieldContainer>
			<FieldContainer label={undefined}>
				<Button intent="primary" type={'submit'} disabled={isSubmitting}>
					Continue
				</Button>
			</FieldContainer>
		</form>
	)
}
