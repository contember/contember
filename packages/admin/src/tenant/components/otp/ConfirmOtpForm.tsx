import { Button, FieldContainer, TextInput, useShowToast } from '@contember/ui'
import { FC, useCallback, useContext } from 'react'
import { IdentityRefreshContext } from '../../../components'
import { RoutingLinkTarget, useRedirect } from '../../../routing'
import { useForm } from '../../lib'
import { useConfirmOtp } from '../../mutations'

export interface ConfirmOtpFormProps {
	redirectOnSuccess?: RoutingLinkTarget
	onSuccess?: () => void
}

const initialValues = {
	token: '',
}

export const ConfirmOtpForm: FC<ConfirmOtpFormProps> = ({ redirectOnSuccess, onSuccess }) => {
	const redirect = useRedirect()
	const addToast = useShowToast()
	const confirmOtp = useConfirmOtp()
	const refreshIdentity = useContext(IdentityRefreshContext)

	const { isSubmitting, onSubmit, register } = useForm<typeof initialValues>(initialValues, useCallback(
		async (values: typeof initialValues) => {
			const response = await confirmOtp({ token: values.token })
			if (response.ok) {
				addToast({
					type: 'success',
					message: `Two-factor authentication has been enabled`,
					dismiss: true,
				})
				refreshIdentity()
				redirectOnSuccess && redirect(redirectOnSuccess)
				onSuccess && onSuccess()
			} else {
				switch (response.error.code) {
					case 'INVALID_OTP_TOKEN':
						return addToast({ message: `Provided code is not valid`, type: 'error' })
					case 'NOT_PREPARED':
						return addToast({ message: `Two factor setup was not initialized`, type: 'error' })
				}
			}
		},
		[addToast, confirmOtp, onSuccess, redirect, redirectOnSuccess, refreshIdentity],
	),
	)


	return (
		<form onSubmit={onSubmit}>
			<FieldContainer label="Two-factor code">
				<TextInput {...register('token')} required={true} />
			</FieldContainer>
			<br />
			<Button distinction="primary" type={'submit'} disabled={isSubmitting}>
				Confirm two-factor authentication
			</Button>
		</form>
	)
}
