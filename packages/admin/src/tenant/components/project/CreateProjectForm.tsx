import { Button, Divider, FieldContainer, Heading, Select, Stack, TextInput, useShowToast } from '@contember/ui'
import { FC, SyntheticEvent, useState } from 'react'
import { RoutingLinkTarget, useRedirect } from '../../../routing'
import { useForm } from '../../lib'
import { useCreateProject } from '../../mutations'

const emptyForm = {
	slug: '',
	name: '',
	dbHost: '',
	dbName: '',
	dbUser: '',
	dbPassword: '',
	dbPort: '',
	dbSsl: '',
}

interface CreateProjectForm {
	projectListLink: RoutingLinkTarget
}

export const CreateProjectForm: FC<CreateProjectForm> = ({ projectListLink }) => {
	const { register, values } = useForm(emptyForm)
	const [isSubmitting, setSubmitting] = useState(false)
	const createProject = useCreateProject()
	const toaster = useShowToast()
	const redirect = useRedirect()
	const onSubmit = async (e: SyntheticEvent) => {
		e.preventDefault()
		setSubmitting(true)
		const projectSlug = values.slug
		const secrets: { key: string; value: string }[] = []
		if (values.dbPassword) {
			secrets.push({ key: 'db.password', value: values.dbPassword })
		}
		try {
			const result = await createProject({
				projectSlug,
				name: values.name || undefined,
				config: {
					db: {
						host: values.dbHost || undefined,
						port: values.dbPort ? Number(values.dbPort) : undefined,
						user: values.dbUser || undefined,
						ssl: values.dbSsl ? values.dbSsl === 'yes' : undefined,
						database: values.dbName || undefined,
					},
				},
				secrets,
			})
			if (result.ok) {
				redirect(projectListLink)
				toaster({
					message: `Project ${projectSlug} created. Please save following deploy token: ${result.result.deployerApiKey.token}`,
					type: 'success',
				})
			} else {
				switch (result.error.code) {
					case 'ALREADY_EXISTS':
						toaster({ message: `Project ${projectSlug} already exists`, type: 'error' })
						break
					case 'INIT_ERROR':
						toaster({
							message: `Project ${projectSlug} initialization has failed: ${result.error.developerMessage}`,
							type: 'error',
						})
						break
				}
			}
		} catch (e) {
			console.error(e)
			toaster({ message: `Request has failed. Please try later.`, type: 'error' })

		} finally {
			setSubmitting(false)
		}
	}
	return (
		<form onSubmit={onSubmit}>
			<Stack direction="vertical" gap="xlarge">
				<Heading depth={3}>New project</Heading>

				<FieldContainer label={'Project slug'}>
					<TextInput {...register('slug')} pattern={'[a-z][-a-z0-9]*'} required />
				</FieldContainer>
				<FieldContainer label={'Project name'}>
					<TextInput {...register('name')} placeholder={values.slug} />
				</FieldContainer>

				<Divider />

				<Heading depth={3}>Database credentials</Heading>
				<p>You can leave some of this fields empty to use default values.</p>

				<FieldContainer label={'Host'}>
					<TextInput {...register('dbHost')} />
				</FieldContainer>
				<FieldContainer label={'Port'}>
					<TextInput {...register('dbPort')} />
				</FieldContainer>
				<FieldContainer label={'Database name'}>
					<TextInput {...register('dbName')} />
				</FieldContainer>
				<FieldContainer label={'User'}>
					<TextInput {...register('dbUser')} />
				</FieldContainer>
				<FieldContainer label={'Password'}>
					<TextInput {...register('dbPassword')} />
				</FieldContainer>
				<FieldContainer label={'SSL'}>
					<Select {...register('dbSsl')} options={[
						{ value: '', label: 'default' },
						{ value: 'yes', label: 'yes' },
						{ value: 'no', label: 'no' },
					]} />
				</FieldContainer>

				<Divider />

				<Button type="submit" distinction="primary" disabled={isSubmitting}>
					Create new project
				</Button>
			</Stack>
		</form>
	)
}
