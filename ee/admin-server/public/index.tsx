import { LoginEntrypoint, Project, runReactApp } from '@contember/admin'
import './index.sass'
import * as schema from '../src/utils/schema'
import { useMemo } from 'react'

const Entry = () => {
	const config = useMemo(() => {
		const el = document.getElementById('contember-config')
		const configSchema = schema.object({
			apiBaseUrl: schema.string,
			loginToken: schema.string,
			sessionToken: schema.string,
			projects: schema.union(
				schema.null_,
				schema.array(
					schema.object({
						slug: schema.string,
						name: schema.string,
					}),
				),
			),
		})
		return configSchema(JSON.parse(el?.innerHTML ?? '{}'))
	}, [])
	const formatProjectUrl = (project: Project) => `/${project.slug}/`

	return <LoginEntrypoint {...config} formatProjectUrl={formatProjectUrl} />
}

runReactApp(<Entry/>)
