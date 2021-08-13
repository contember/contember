import * as ReactDOM from 'react-dom'
import { LoginEntrypoint, Project } from '@contember/admin'
import './index.sass'

window.addEventListener('DOMContentLoaded', () => {
	const el = document.getElementById('contember-config')
	const config = JSON.parse(el?.innerHTML ?? '{}')
	const formatProjectUrl = (project: Project) => `/${project.slug}/`

	ReactDOM.render(
		<LoginEntrypoint {...config} formatProjectUrl={formatProjectUrl} />,
		document.getElementById('root'),
	)
})
