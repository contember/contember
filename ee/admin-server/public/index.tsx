import { AnchorButton, Icon, LoginEntrypoint, Project, runReactApp } from '@contember/admin'
import './index.sass'
import { useCallback, useMemo } from 'react'
import { loginConfigSchema } from '../src/config'

const Entry = () => {
	const config = useMemo(() => {
		const el = document.getElementById('contember-config')
		return loginConfigSchema(JSON.parse(el?.innerHTML ?? '{}'))
	}, [])
	const formatProjectUrl = (project: Project) => `/${project.slug}/`

	const panelButton = (
		<AnchorButton href={'/_panel/'} size={'small'} distinction={'seamless'}>
			<Icon blueprintIcon={'cog'} />
		</AnchorButton>
	)

	const listProjects = useCallback(async () => {
		const me = await fetch('/_me')
		const data = await me.json()
		return data.projects.map((it: any) => it.slug)
	}, [])

	return <LoginEntrypoint
		{...config}
		projects={listProjects}
		formatProjectUrl={formatProjectUrl}
		projectsPageActions={panelButton}
	/>
}

runReactApp(<Entry/>)
