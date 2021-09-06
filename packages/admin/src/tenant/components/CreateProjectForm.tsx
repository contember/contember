import { FC, SyntheticEvent, useState } from 'react'
import { Box, BoxSection, Button, FormGroup, Select, TextInput } from '@contember/ui'
import { useForm } from './useForm'
import { useCreateProject } from '../hooks'
import { useRedirect, useShowToast } from '../../components'
import { RoutingLinkTarget } from '../../routing'

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
		<Box heading={'Create a new project'}>
			<form onSubmit={onSubmit}>
				<BoxSection heading={false}>
					<FormGroup label={'Project slug'}>
						<TextInput {...register('slug')} pattern={'[a-z][-a-z0-9]*'} required />
					</FormGroup>
					<FormGroup label={'Project name'}>
						<TextInput {...register('name')} placeholder={values.slug} />
					</FormGroup>
				</BoxSection>
				<BoxSection heading={'Database credentials'}>
					<p>You can leave some of this fields empty to use default values.</p>
					<FormGroup label={'Host'}>
						<TextInput {...register('dbHost')} />
					</FormGroup>
					<FormGroup label={'Port'}>
						<TextInput {...register('dbPort')} />
					</FormGroup>
					<FormGroup label={'Database name'}>
						<TextInput {...register('dbName')} />
					</FormGroup>
					<FormGroup label={'User'}>
						<TextInput {...register('dbUser')} />
					</FormGroup>
					<FormGroup label={'Password'}>
						<TextInput {...register('dbPassword')} />
					</FormGroup>
					<FormGroup label={'SSL'}>
						<Select {...register('dbSsl')} options={[
							{ value: '', label: 'default' },
							{ value: 'yes', label: 'yes' },
							{ value: 'no', label: 'no' },
						]}/>
					</FormGroup>
				</BoxSection>
				<BoxSection heading={false}>
					<FormGroup label={undefined}>
						<Button type={'submit'} intent={'primary'} disabled={isSubmitting}>
							Create a project
						</Button>
					</FormGroup>
				</BoxSection>
			</form>
		</Box>
	)
}
