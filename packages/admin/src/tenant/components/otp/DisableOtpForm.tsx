import { Button, useShowToast } from '@contember/ui'
import { FC, useCallback, useContext } from 'react'
import { IdentityRefreshContext } from '../../../components'
import { RoutingLinkTarget, useRedirect } from '../../../routing'
import { useForm } from '../../lib'
import { useDisableOtp } from '../../mutations'

interface DisableOtpFormProps {
	onSuccess?: () => void
	redirectOnSuccess?: RoutingLinkTarget
}

const initialValues = {
}

export const DisableOtpForm: FC<DisableOtpFormProps> = ({ redirectOnSuccess }) => {
	const redirect = useRedirect()
	const addToast = useShowToast()
	const disableOtp = useDisableOtp()
	const refreshIdentity = useContext(IdentityRefreshContext)

	const { isSubmitting, onSubmit } = useForm<typeof initialValues>(initialValues, useCallback(
		async () => {
			if (!confirm('Are you sure?')) {
				return
			}
			const response = await disableOtp({})
			if (response.ok) {
				addToast({
					type: 'success',
					message: `Two-factor authentication has been disabled`,
					dismiss: true,
				})
				refreshIdentity()
				redirectOnSuccess && redirect(redirectOnSuccess)

			} else {
				switch (response.error.code) {
					case 'OTP_NOT_ACTIVE':
						return addToast({ message: `Two factor is not active`, type: 'error' })
				}
			}
		},
		[addToast, disableOtp, redirect, redirectOnSuccess, refreshIdentity],
	),
	)


	return (
		<form onSubmit={onSubmit}>
			<Button intent="danger" type={'submit'} disabled={isSubmitting}>
				Disable two-factor
			</Button>
		</form>
	)
}
