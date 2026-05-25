/**
 * Documentation navigation tree — ported from the former Docusaurus
 * `sidebars.ts`. Each leaf `id` matches a doc collection entry id
 * (its path under `src/content/docs/` without the `.mdx` extension).
 *
 * `label` is optional; when omitted the doc's frontmatter `title` is used.
 */

export interface NavDoc {
	type: 'doc'
	id: string
	label?: string
}

export interface NavCategory {
	type: 'category'
	label: string
	/** Default collapsed state of the category. */
	collapsed?: boolean
	items: NavItem[]
}

export type NavItem = NavDoc | NavCategory

/** Convenience so the tree below reads like the old sidebar config. */
const doc = (id: string, label?: string): NavDoc => ({ type: 'doc', id, label })

export const nav: NavItem[] = [
	{
		type: 'category',
		label: 'Getting Started',
		collapsed: false,
		items: [
			doc('intro/introduction', 'Overview'),
			doc('intro/how-it-works', 'How Contember works'),
			doc('intro/glossary'),
		],
	},
	{
		type: 'category',
		label: 'Contember Basics',
		collapsed: false,
		items: [
			doc('intro/installation', 'Installation'),
			doc('intro/quickstart', 'Designing your data model'),
			doc('intro/graphql', 'Handling data with GraphQL'),
			doc('intro/interface'),
			doc('intro/deployment'),
			doc('intro/actions'),
		],
	},
	{
		type: 'category',
		label: 'Contember Interface',
		collapsed: true,
		items: [
			doc('reference/interface/introduction'),
			{
				type: 'category',
				label: 'Pages and routing',
				collapsed: true,
				items: [
					doc('reference/interface/pages/overview', 'Overview'),
					doc('reference/interface/pages/routing'),
					doc('reference/interface/pages/links'),
					doc('reference/interface/pages/slots'),
				],
			},
			{
				type: 'category',
				label: 'Binding',
				collapsed: true,
				items: [
					doc('reference/interface/data-binding/overview', 'Overview'),
					doc('reference/interface/data-binding/query-language'),
					doc('reference/interface/data-binding/value-rendering'),
					doc('reference/interface/data-binding/relationship-components'),
					doc('reference/interface/data-binding/custom-components'),
				],
			},
			{
				type: 'category',
				label: 'Headless Components',
				collapsed: true,
				items: [
					doc('reference/interface/headless-components/overview', 'Overview'),
					doc('reference/interface/headless-components/dataview'),
				],
			},
			{
				type: 'category',
				label: 'UI Components',
				collapsed: true,
				items: [
					doc('reference/interface/ui-components/overview', 'Overview'),
					doc('reference/interface/ui-components/datagrid'),
				],
			},
		],
	},
	{
		type: 'category',
		label: 'Contember Engine',
		collapsed: true,
		items: [
			{
				type: 'category',
				label: 'Schema',
				collapsed: true,
				items: [
					doc('reference/engine/schema/overview'),
					doc('reference/engine/schema/columns'),
					doc('reference/engine/schema/relationships'),
					doc('reference/engine/schema/views'),
					doc('reference/engine/schema/acl'),
					doc('reference/engine/schema/tenant-acl'),
					doc('reference/engine/schema/validations'),
				],
			},
			{
				type: 'category',
				label: 'Migrations',
				collapsed: true,
				items: [
					doc('reference/engine/migrations/overview'),
					doc('reference/engine/migrations/basics'),
					doc('reference/engine/migrations/content-migrations'),
					{
						type: 'category',
						label: 'Advanced',
						items: [
							doc('reference/engine/migrations/advanced/development-commands'),
							doc('reference/engine/migrations/advanced/skipping-validations'),
							doc('reference/engine/migrations/advanced/writing-schema-migrations'),
						],
					},
				],
			},
			{
				type: 'category',
				label: 'Content API',
				items: [
					doc('reference/engine/content/overview'),
					doc('reference/engine/content/queries'),
					doc('reference/engine/content/mutations'),
					doc('reference/engine/content/s3'),
					doc('reference/engine/content/event-log'),
					doc('reference/engine/content/transfer'),
					{
						type: 'category',
						label: 'Advanced',
						items: [
							doc('reference/engine/content/advanced/assume-identity'),
							doc('reference/engine/content/advanced/assume-membership'),
							doc('reference/engine/content/advanced/request-debugging'),
							doc('reference/engine/content/advanced/caching'),
							doc('reference/engine/content/advanced/test-transactions'),
						],
					},
				],
			},
			{
				type: 'category',
				label: 'Tenant API',
				items: [
					doc('reference/engine/tenant/overview'),
					doc('reference/engine/tenant/sign-up'),
					doc('reference/engine/tenant/sign-in'),
					doc('reference/engine/tenant/sessions'),
					doc('reference/engine/tenant/passwordless'),
					doc('reference/engine/tenant/idp'),
					doc('reference/engine/tenant/password-reset'),
					doc('reference/engine/tenant/two-factor'),
					doc('reference/engine/tenant/profile'),
					doc('reference/engine/tenant/invites'),
					doc('reference/engine/tenant/memberships'),
					doc('reference/engine/tenant/disable-person'),
					doc('reference/engine/tenant/api-keys'),
					doc('reference/engine/tenant/projects'),
					doc('reference/engine/tenant/proxy-trust'),
					doc('reference/engine/tenant/password-policy'),
					doc('reference/engine/tenant/anti-abuse'),
					doc('reference/engine/tenant/audit-log'),
					doc('reference/engine/tenant/configuration'),
					doc('reference/engine/tenant/mail-templates'),
				],
			},
			{
				type: 'category',
				label: 'Actions',
				items: [
					doc('reference/engine/actions/overview', 'Overview'),
					doc('reference/engine/actions/definition'),
					doc('reference/engine/actions/managing'),
					doc('reference/engine/actions/invocation'),
				],
			},
		],
	},
	doc('reference/cli'),
	{
		type: 'category',
		label: 'Contember Cloud',
		collapsed: true,
		items: [
			doc('guides/deploy-contember'),
			doc('cloud/permissions'),
			doc('cloud/api'),
		],
	},
	{
		type: 'category',
		label: 'Guides',
		collapsed: true,
		items: [
			doc('guides/deploy-github-actions'),
			doc('guides/self-hosted-contember'),
			doc('guides/seo'),
			doc('guides/acl-definition'),
			doc('guides/superface'),
		],
	},
]

/** Flat, in-order list of every doc id in the tree (drives prev/next). */
export function flattenDocs(items: NavItem[] = nav): string[] {
	const out: string[] = []
	for (const item of items) {
		if (item.type === 'doc') out.push(item.id)
		else out.push(...flattenDocs(item.items))
	}
	return out
}

export interface Breadcrumb {
	label: string
	id?: string
}

/**
 * Resolve the category trail leading to a doc id, e.g.
 * ['Contember Engine', 'Schema']. Returns the category labels only;
 * the page title is appended by the caller.
 */
export function breadcrumbTrail(id: string, items: NavItem[] = nav, trail: string[] = []): string[] | null {
	for (const item of items) {
		if (item.type === 'doc') {
			if (item.id === id) return trail
		} else {
			const found = breadcrumbTrail(id, item.items, [...trail, item.label])
			if (found) return found
		}
	}
	return null
}
