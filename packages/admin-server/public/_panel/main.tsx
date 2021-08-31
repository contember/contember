import * as ReactDOM from 'react-dom'
import { ApplicationEntrypoint, GenericPage, Layout, Menu, Pages } from '@contember/admin'
import './index.sass'
import { FC } from 'react'


const PanelLayout: FC = props => {
	return (
		<Layout
			children={props.children}
			topStart={'Contember Admin Panel'}
			sideBar={<Menu>
				<Menu.Item title="Dashboard" to={'dashboard'}/>
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
			}}
			children={<Pages layout={PanelLayout} children={[
				<GenericPage pageName={'dashboard'}>Dashboard</GenericPage>,
			]} />}
		/>,
		document.getElementById('root'),
	)
})
