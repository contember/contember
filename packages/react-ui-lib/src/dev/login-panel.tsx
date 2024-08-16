import { Button } from '../ui/button'
import { useSessionTokenWithMeta, useSetSessionToken } from '@contember/react-client'
import { CreateSessionTokenForm, useCreateSessionTokenForm } from '@contember/react-client-tenant'
import { Loader } from '../ui/loader'
import { TenantFormError, TenantFormField } from '../tenant/forms/common'

export const LoginWithEmail = () => {
	const sessionToken = useSessionTokenWithMeta()
	const setSessionToken = useSetSessionToken()

	return <>
		<CreateSessionTokenForm
			expiration={3600 * 24 * 7}
			apiToken={sessionToken.propsToken}
			onSuccess={it => {
				setSessionToken(it.result.token)
			}}>
			<form>
				<CreateSessionTokenFormFields />
			</form>
		</CreateSessionTokenForm>
	</>
}


const CreateSessionTokenFormFields = () => {
	const form = useCreateSessionTokenForm()

	const messages = {
		FIELD_REQUIRED: 'This field is required',
		UNKNOWN_ERROR: 'An unknown error occurred',
		PERSON_DISABLED: 'Person is disabled',
		UNKNOWN_EMAIL: 'Person with given email not found',
		UNKNOWN_PERSON_ID: 'Person with given ID not found',
	}
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form} messages={messages}
			/>

			<TenantFormField
				form={form} messages={messages} field="email"
				type="text" required autoFocus
			>
				E-mail
			</TenantFormField>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				Login
			</Button>
		</div>
	)
}
