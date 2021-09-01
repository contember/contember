import * as ReactDOM from 'react-dom'
import { ApplicationEntrypoint, CreateProjectForm, GenericPage, Layout, Menu, Pages } from '@contember/admin'
import './index.sass'
import { FC } from 'react'


const PanelLayout: FC = props => {
	return (
		<Layout
			children={props.children}
			topStart={'Contember Admin Panel'}
			sideBar={<Menu>
				<Menu.Item title="Dashboard" to={'dashboard'}/>
				<Menu.Item title="Create project" to={'projectCreate'}/>
			</Menu>}
		/>
	)
}


window.addEventListener('DOMContentLoaded', () => {
	const el = document.getElementById('contember-config')
	const config = JSON.parse(el?.innerHTML ?? '{}')

	ReactDOM.render(
		<ApplicationEntrypoint
			sessionToken={config.sessionToken}
			apiBaseUrl={config.apiBaseUrl}
			basePath={'/_panel/'}
			routes={{
				dashboard: { path: '/' },
				projectCreate: { path: '/project/create' },
			}}
			children={<Pages layout={PanelLayout} children={[
				<GenericPage pageName={'dashboard'}>Dashboard</GenericPage>,
				<GenericPage pageName={'projectCreate'}>
					<CreateProjectForm />
				</GenericPage>,
			]} />}
		/>,
		document.getElementById('root'),
	)
})
