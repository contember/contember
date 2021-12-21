import { Button, FormGroup, Stack, TextInput } from '@contember/ui'
import { FC, SyntheticEvent, useCallback, useState } from 'react'
import { useShowToast } from '../../../components'
import { EditMembership, RolesConfig } from '../member'
import { RoutingLinkTarget, useRedirect } from '../../../routing'
import { useCreateApiKey } from '../../mutations'
import { useForm } from '../../lib'
import { Membership } from '../../types'

interface CreateApiKeyFormProps {
	project: string
	rolesConfig?: RolesConfig
	apiKeyListLink: RoutingLinkTarget
}

const initialValues = {
	description: '',
}

export const CreateApiKeyForm: FC<CreateApiKeyFormProps> = ({ project, rolesConfig, apiKeyListLink }) => {
	const { register, values } = useForm(initialValues)
	const redirect = useRedirect()
	const addToast = useShowToast()
	const [isSubmitting, setSubmitting] = useState(false)
	const [memberships, setMemberships] = useState<(Membership | undefined)[]>([undefined])

	const createApiKey = useCreateApiKey()

	const submit = useCallback(
		async (e: SyntheticEvent) => {
			e.preventDefault()
			setSubmitting(true)
			const membershipsToSave = memberships.filter((it: Membership | undefined): it is Membership => it !== undefined)
			const response = await createApiKey({
				description: values.description,
				memberships: membershipsToSave,
				projectSlug: project,
			})
			setSubmitting(false)
			if (response.ok) {
				addToast({
					type: 'success',
					message: `API key has been created. Save following token: ${response.result.apiKey.token}`,
				})
				redirect(apiKeyListLink)
			} else {
				switch (response.error.code) {
					case 'INVALID_MEMBERSHIP':
						return addToast({ message: `Invalid membership definition`, type: 'error' })
					case 'PROJECT_NOT_FOUND':
						return addToast({ message: `Project not found`, type: 'error' })
				}
			}
		},
		[memberships, createApiKey, values.description, project, addToast, redirect, apiKeyListLink],
	)

	const editUserMembershipProps = { project, rolesConfig, memberships, setMemberships }

	return (
		<form onSubmit={submit}>
			<Stack direction="vertical">
				<FormGroup label="Description">
					<TextInput {...register('description')} />
				</FormGroup>

				<EditMembership {...editUserMembershipProps} />

				<Button intent="primary" size="large" type={'submit'} disabled={isSubmitting}>
					Create API key
				</Button>
			</Stack>
		</form>
	)
}
