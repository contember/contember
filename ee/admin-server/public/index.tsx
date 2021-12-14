import { LoginEntrypoint, Project, runReactApp } from '@contember/admin'
import './index.sass'
import { useMemo } from 'react'
import { loginConfigSchema } from '../src/loginConfig'

const Entry = () => {
	const config = useMemo(() => {
		const el = document.getElementById('contember-config')
		return loginConfigSchema(JSON.parse(el?.innerHTML ?? '{}'))
	}, [])
	const formatProjectUrl = (project: Project) => `/${project.slug}/`

	return <LoginEntrypoint {...config} formatProjectUrl={formatProjectUrl} />
}

runReactApp(<Entry/>)
