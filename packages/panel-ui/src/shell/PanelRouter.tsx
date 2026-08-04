import { EnvironmentContext, useEnvironment } from '@contember/interface'
import { useIdentity } from '@contember/react-client-tenant'
import { useCurrentRequest, useRedirect } from '@contember/react-routing'
import { lazy, Suspense, useEffect, useMemo } from 'react'
import { panelRegistry } from '../modules/index.js'
import { indexPageName, type PanelPage, resetRequestPageName } from '../modules/registry.js'
import { ProjectScopeProvider } from './ProjectScopeProvider.js'
import { stringParameter } from './requestParameters.js'
import { InlineLoader, MessageCard, NotFound } from './screens.js'

/** Shell routes that have no page of their own once the visitor is signed in. */
const redirectingPages = new Set([indexPageName, resetRequestPageName])

/** Where `/panel/` lands: the first global module the identity may use. */
const useDefaultPageName = (): string | undefined => {
	const identity = useIdentity()
	return useMemo(() => {
		if (identity === undefined) {
			return undefined
		}
		const module = panelRegistry.availableModules({ identity, projectSlug: undefined }).find(it => it.scope === 'global')
		return module === undefined ? undefined : panelRegistry.entryPageOf(module)
	}, [identity])
}

const DefaultPageRedirect = () => {
	const defaultPageName = useDefaultPageName()
	const redirect = useRedirect()

	useEffect(() => {
		if (defaultPageName !== undefined) {
			redirect({ pageName: defaultPageName })
		}
	}, [defaultPageName, redirect])

	if (defaultPageName === undefined) {
		return <MessageCard title="Nothing to show" description="This account has no management modules available." />
	}
	return <InlineLoader />
}

const ModulePage = ({ module, pageName }: PanelPage) => {
	// Each module resolves to its own chunk; `lazy` keeps it out of the initial payload.
	const Page = useMemo(
		() =>
			lazy(async () => {
				const pages = await module.load()
				const page = pages[pageName]
				if (page === undefined) {
					throw new Error(`Panel module "${module.id}" does not export a page named "${pageName}".`)
				}
				return { default: page }
			}),
		[module, pageName],
	)

	return (
		<Suspense fallback={<InlineLoader />}>
			<Page />
		</Suspense>
	)
}

/** Resolves the current request against the module registry. Nothing here knows a module by name. */
export const PanelRouter = () => {
	const request = useCurrentRequest()
	const environment = useEnvironment()

	const pageEnvironment = useMemo(
		() => request === null ? environment : environment.withDimensions(request.dimensions).withParameters(request.parameters),
		[environment, request],
	)

	if (request === null) {
		return <NotFound />
	}
	if (redirectingPages.has(request.pageName)) {
		return <DefaultPageRedirect />
	}

	const page = panelRegistry.pages.get(request.pageName)
	if (page === undefined) {
		return <NotFound />
	}

	const content = <ModulePage module={page.module} pageName={page.pageName} />
	const projectSlug = stringParameter(request.parameters.project)

	return (
		<EnvironmentContext.Provider value={pageEnvironment}>
			{page.module.scope === 'global'
				? content
				: projectSlug === undefined
				? <NotFound />
				: (
					<ProjectScopeProvider projectSlug={projectSlug} stageSlug={stringParameter(request.parameters.stage)}>
						{content}
					</ProjectScopeProvider>
				)}
		</EnvironmentContext.Provider>
	)
}
