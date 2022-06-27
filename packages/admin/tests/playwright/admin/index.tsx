import { Schema } from '@contember/schema'
import { InputValidation, PermissionsBuilder, SchemaDefinition } from '@contember/schema-definition'
import { ApplicationEntrypoint, ContainerSpinner, Link, MiscPageLayout, Pages, ProjectSlugContext, runReactApp, useCurrentRequest } from '../../../src'
import { CSSProperties, ReactNode, useEffect, useState } from 'react'
import './index.sass'

const projectSlug = window.location.pathname.split('/')[1]
const pages = import.meta.glob('../cases/**/*.tsx')
const models = import.meta.glob('../cases/**/*.model.ts')

function buildSchema(definitions: SchemaDefinition.ModelDefinition<{}>): Schema {
	const model = SchemaDefinition.createModel(definitions)
	const permissions = PermissionsBuilder.create(model).allowAll().allowCustomPrimary().permissions

	const acl = {
		roles: {
			admin: {
				variables: {},
				stages: '*' as const,
				entities: permissions,
			},
		},
	}

	const validation = InputValidation.parseDefinition(definitions)
	return { acl, model, validation }
}

const ProjectInitializingLayout = ({ children }: { children?: ReactNode }) => {
	const request = useCurrentRequest()
	const [projectSlug, setProjectSlug] = useState<string | null>(null)
	const pageName = request?.pageName

	useEffect(
		() => {
			setProjectSlug(null)

			if (pageName === undefined) {
				return
			}

			(async () => {
				const modelPath = `../cases/${pageName}.model.ts`
				const model = models[modelPath] ? await models[modelPath]() : {}

				const initResponse = await fetch('/_init', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(buildSchema(model)),
				})

				const { projectSlug } = await initResponse.json()
				setProjectSlug(projectSlug)
			})()
		},
		[pageName],
	)

	if (projectSlug === null) {
		return <ContainerSpinner />

	} else {
		return <ProjectSlugContext.Provider value={projectSlug} children={children} />
	}
}

const IndexPage = () => {
	const pageNames = Object.keys(pages).map(it => it.slice(9, -4))

	return (
		<MiscPageLayout>
			<ul>
				{pageNames.map(it => (
					<li key={it}>
						<Link to={it}>{it.replace(/([A-Z])/g, ' $1').toLowerCase()}</Link>
					</li>
				))}
			</ul>
		</MiscPageLayout>
	)
}

if (import.meta.env.DEV) {
	runReactApp(
		<div style={{ '--cui-font-family': 'Inter var' } as CSSProperties}>
			<ApplicationEntrypoint
				apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string}
				sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string}
				stage={'live'}
				basePath={'/'}
				children={<Pages layout={ProjectInitializingLayout} children={{ index: IndexPage, ...pages }} />}
			/>
		</div>,
	)

} else {
	runReactApp(
		<ApplicationEntrypoint
			apiBaseUrl={import.meta.env.VITE_CONTEMBER_ADMIN_API_BASE_URL as string}
			sessionToken={import.meta.env.VITE_CONTEMBER_ADMIN_SESSION_TOKEN as string}
			project={projectSlug}
			stage={'live'}
			basePath={'/' + projectSlug + '/'}
			children={<Pages children={pages} />}
		/>,
	)
}
