import { useCreateGlobalApiKeyForm } from '@contember/react-identity'
import { Button, Input, Loader } from '@contember/react-ui-lib-base'
import { PlusIcon, XIcon } from 'lucide-react'
import { TenantFormError, TenantFormField, TenantFormLabel } from './common.js'
import { dict } from '../dict.js'

export const CreateGlobalApiKeyFormFields = () => {
	const form = useCreateGlobalApiKeyForm()
	const roles = form.values.roles
	return (
		<div className="relative flex flex-col gap-2">
			{form.state === 'submitting' ? <Loader position="absolute" /> : null}

			<TenantFormError
				form={form}
				messages={dict.tenant.createGlobalApiKey.errorMessages}
			/>

			<TenantFormField
				form={form}
				messages={dict.tenant.createGlobalApiKey.errorMessages}
				field="description"
				type="text"
				required
				autoFocus
			>
				{dict.tenant.createGlobalApiKey.description}
			</TenantFormField>

			<TenantFormLabel form={form} field="roles">{dict.tenant.createGlobalApiKey.roles}</TenantFormLabel>
			<div className="flex flex-col gap-2">
				{roles.map((role, index) => (
					<div key={index} className="flex gap-2 items-center">
						<Input
							type="text"
							value={role}
							placeholder={dict.tenant.createGlobalApiKey.rolePlaceholder}
							onChange={e => form.setValue('roles', roles.map((it, i) => i === index ? e.target.value : it))}
						/>
						<Button
							type="button"
							variant="outline"
							onClick={() => form.setValue('roles', roles.filter((_, i) => i !== index))}
						>
							<XIcon className="w-4 h-4" />
							<span className="sr-only">{dict.tenant.createGlobalApiKey.removeRole}</span>
						</Button>
					</div>
				))}
				<div>
					<Button
						type="button"
						variant="outline"
						className="flex gap-2"
						onClick={() => form.setValue('roles', [...roles, ''])}
					>
						<PlusIcon className="w-4 h-4" />
						{dict.tenant.createGlobalApiKey.addRole}
					</Button>
				</div>
			</div>
			<TenantFormError form={form} messages={dict.tenant.createGlobalApiKey.errorMessages} field="roles" />

			<Button type="submit" className="w-full" disabled={form.state === 'submitting'}>
				{dict.tenant.createGlobalApiKey.submit}
			</Button>
		</div>
	)
}
