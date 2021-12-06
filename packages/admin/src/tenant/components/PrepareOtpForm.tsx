import { FC, useCallback } from 'react'
import { useShowToast } from '../../components'
import { Button, FormGroup, Message, TextInput } from '@contember/ui'
import { PrepareOtpResult, usePrepareOtp } from '../hooks'
import { useForm } from './useForm'

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
			async values => {
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
			<FormGroup label="Label for an identification in two-factor app">
				<TextInput {...register('label')} />
			</FormGroup>
			<br />
			{isReSetup && <>
				<Message type={'warn'}>
					You already have two-factor authentication active. By clicking "Continue", the old one will no longer work.
				</Message>
				<br />
			</>}

			<Button intent="primary" type={'submit'} disabled={isSubmitting}>
				Continue
			</Button>
			{isReSetup && <Button type={'submit'} onClick={onCancel}>
				Cancel
			</Button>}
		</form>
	)
}
