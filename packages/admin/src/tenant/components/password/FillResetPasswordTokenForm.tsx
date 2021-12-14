import { FC, useCallback } from 'react'
import { useRedirect } from '../../../components'
import { RoutingLinkTarget } from '../../../routing'
import { Button, FormGroup, TextInput } from '@contember/ui'
import { useForm } from '../../lib/useForm'

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
			<FormGroup label="Token">
				<TextInput {...register('token')} required={true} />
			</FormGroup>
			<FormGroup label={undefined}>
				<Button intent="primary" type={'submit'} disabled={isSubmitting}>
					Continue
				</Button>
			</FormGroup>
		</form>
	)
}
