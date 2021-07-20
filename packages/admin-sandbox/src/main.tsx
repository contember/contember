import './index.sass'
import { runAdmin } from '@contember/admin'
import Sandbox from './Sandbox'

window.addEventListener('DOMContentLoaded', () =>
	runAdmin(
		{
			sandbox: {
				project: 'sandbox',
				stage: 'live',
				component: <Sandbox />,
				routes: {
					dashboard: { path: '/' },
				},
			},
		},
		{
			config: {
				apiBaseUrl: 'http://localhost:4001',
				loginToken: '1111111111111111111111111111111111111111',
			},
		},
	),
)
