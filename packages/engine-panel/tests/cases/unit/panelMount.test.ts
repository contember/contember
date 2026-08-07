import type { HttpController, PanelApiMountTarget } from '@contember/engine-http'
import { describe, expect, test } from 'bun:test'
import { ConfiguredPanelAccessCheck, PanelApiControllerFactory, PanelAssetStore, PanelMount } from '../../../src/index.js'

type RegisteredRoute = { module: string; mask: string; controller: HttpController }

const createTarget = () => {
	const routes: RegisteredRoute[] = []
	const target: PanelApiMountTarget = { addRoute: (module, mask, controller) => void routes.push({ module, mask, controller }) }
	return { routes, target }
}

const createMount = (basePath = '/panel') =>
	new PanelMount(basePath, new PanelAssetStore({}), new PanelApiControllerFactory(new ConfiguredPanelAccessCheck()))

const controller: HttpController = () => undefined

describe('panel mount', () => {
	test('registers a plugin API under the panel API root', () => {
		const { routes, target } = createTarget()
		createMount().mount(target, { name: 'actions', path: 'actions/:projectSlug', controller })

		expect(routes).toHaveLength(1)
		expect(routes[0].module).toBe('panel-api')
		expect(routes[0].mask).toBe('/panel/api/actions/:projectSlug')
	})

	test('follows the configured mount path', () => {
		const { routes, target } = createTarget()
		createMount('/admin-console').mount(target, { name: 'actions', path: 'actions/:projectSlug', controller })

		expect(routes[0].mask).toBe('/admin-console/api/actions/:projectSlug')
	})

	// The gate is what makes this different from the public route, so the plugin must not get the
	// controller it handed in.
	test('puts the mounted controller behind the panel gate', () => {
		const { routes, target } = createTarget()
		createMount().mount(target, { name: 'actions', path: 'actions/:projectSlug', controller })

		expect(routes[0].controller).not.toBe(controller)
	})

	test('reports what has been mounted', () => {
		const { target } = createTarget()
		const mount = createMount()

		expect(mount.pluginApis).toEqual([])

		mount.mount(target, { name: 'actions', path: 'actions/:projectSlug', controller })
		mount.mount(target, { name: 'actions', path: 'actions/:projectSlug/detail', controller })

		expect(mount.pluginApis).toEqual(['actions'])
	})
})
