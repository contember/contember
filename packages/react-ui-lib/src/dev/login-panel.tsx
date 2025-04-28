import { useSessionTokenWithMeta, useSetSessionToken } from '@contember/react-client'
import { CreateSessionTokenForm, useCreateSessionTokenForm } from '@contember/react-client-tenant'
import { dict } from '../dict'
import { TenantFormError, TenantFormField } from '../tenant/forms/common'
import { Button } from '../ui/button'
import { Loader } from '../ui/loader'

/**
 * `LoginWithEmail` component handles user authentication using email.
 * It integrates with session token management to facilitate authentication.
 *
 * #### Example: Basic Usage
 * ```tsx
 * <LoginWithEmail />
 * ```
 */
export const LoginWithEmail = () => {
	const sessionToken = useSessionTokenWithMeta()
	const setSessionToken = useSetSessionToken()

	return <>
		<CreateSessionTokenForm
			expiration={3600 * 24 * 7}
			apiToken={sessionToken.propsToken}
			onSuccess={it => {
				setSessionToken(it.result.token)
			}}
		>
			<form>
				<CreateSessionTokenFormFields />
			</form>
		</CreateSessionTokenForm>
	</>
}


const CreateSessionTokenFormFields = () => {
	const form = useCreateSessionTokenForm()

	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form} messages={dict.tenant.createSessionToken.errorMessages}
			/>

			<TenantFormField
				form={form} messages={dict.tenant.createSessionToken.errorMessages} field="email"
				type="text" required autoFocus
			>
				{dict.tenant.createSessionToken.email}
			</TenantFormField>

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.createSessionToken.login}
			</Button>
		</div>
	)
}
