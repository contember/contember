import { ProjectConfig } from '@contember/admin'

const routes = {
	dashboard: { path: '/' },

	postList: { path: '/posts' },
	postCreate: { path: '/posts/new' },
	postEdit: { path: '/posts/:id' },
}
const config: ProjectConfig[] = [
	{
		project: '{projectName}',
		stage: 'live',
		component: () => import('./src'),
		routes: routes,
	},
]

export default config
