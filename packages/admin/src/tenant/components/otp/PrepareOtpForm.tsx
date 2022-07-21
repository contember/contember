import { Button, FieldContainer, Message, Stack, TextInput, useShowToast } from '@contember/ui'
import { FC, useCallback } from 'react'
import { useForm } from '../../lib'
import { PrepareOtpResult, usePrepareOtp } from '../../mutations'

interface PrepareOtpFormProps {
	onPrepared: (data: PrepareOtpResult) => void
	onCancel?: () => void
	isReSetup?: boolean
}

const initialValues = {
	label: 'Contember Admin',
}

export const PrepareOtpForm: FC<PrepareOtpFormProps> = ({ onPrepared, isReSetup, onCancel }) => {
	const addToast = useShowToast()
	const prepareOtp = usePrepareOtp()

	const { isSubmitting, onSubmit, register } = useForm<typeof initialValues>(initialValues, useCallback(
		async (values: typeof initialValues) => {
			const response = await prepareOtp({ label: values.label })
			if (response.ok) {
				onPrepared(response.result)
			} else {
				switch (response.error.code) {
					case 'OTP_NOT_ACTIVE':
						return addToast({ message: `Two factor is not active`, type: 'error', dismiss: true })
				}
			}
		},
		[addToast, prepareOtp, onPrepared],
	),
	)

	return (
		<form onSubmit={onSubmit}>
			<Stack direction="vertical" gap="large">
				<FieldContainer label="Label for an identification in two-factor app">
					<TextInput {...register('label')} />
				</FieldContainer>

				{isReSetup && <>
					<Message distinction="striking" intent="warn">
						You already have two-factor authentication active. By clicking &quot;Continue&quot;, the old one will no longer work.
					</Message>
				</>}

				<Stack direction="horizontal" style={{ alignSelf: 'flex-end' }}>
					<Button type="submit" distinction="seamless" onClick={onCancel}>
						Cancel
					</Button>

					<Button intent={isReSetup ? 'danger' : 'primary'} distinction="primary" type="submit" disabled={isSubmitting}>
						Continue
					</Button>

				</Stack>
			</Stack>
		</form>
	)
}
