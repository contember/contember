import { ApplicationEntrypoint, ContainerSpinner, MiscPageLayout, Pages, ProjectSlugContext, runReactApp, useCurrentRequest } from '../../../src'
import { CSSProperties, ReactNode, useEffect, useState } from 'react'
import './index.sass'

const ProjectInitializingLayout = ({ children }: { children?: ReactNode }) => {
	const request = useCurrentRequest()
	const pageName = request?.pageName
	const [projectSlug, setProjectSlug] = useState<string | null>(null)

	useEffect(
		() => {
			if (pageName === undefined) {
				return
			}

			(async () => {
				const initResponse = await fetch('/_init', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ testSlug: pageName }),
				})

				const { projectSlug } = await initResponse.json()
				setProjectSlug(projectSlug)
			})()
		},
		[pageName],
	)

	if (projectSlug === null) {
		return (
			<MiscPageLayout>
				<ContainerSpinner />
				<p>Initializing</p>
			</MiscPageLayout>
		)

	} else {
		return (
			<ProjectSlugContext.Provider value={projectSlug}>
				<div style={{ '--cui-font-family': 'Inter var' } as CSSProperties}>
					{children}
				</div>
			</ProjectSlugContext.Provider>
		)
	}
}

const projectSlug = window.location.pathname.split('/')[1]
const pages = import.meta.glob('../cases/**/*.tsx')

const IndexPage = () => {
	const tests = Object.keys(pages).map(it => it.slice(9, -4))

	return (
		<MiscPageLayout>
			<ul>
				{tests.map(it => <li key={it}><a href={`/${it}`}>{it}</a></li>)}
			</ul>
		</MiscPageLayout>
	)
}

runReactApp(
	<ApplicationEntrypoint
		apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string}
		sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string}
		project={projectSlug}
		stage={'live'}
		basePath={import.meta.env.DEV ? '/' : '/' + projectSlug + '/'}
		children={<Pages layout={import.meta.env.DEV ? ProjectInitializingLayout : undefined} children={{ index: IndexPage, ...pages }} />}
	/>,
)
