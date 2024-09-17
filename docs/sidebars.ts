import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
	mainSidebar: [
		{
			type: 'category',
			label: 'Getting Started',
			collapsed: false,
			items: [
				{
					type: 'doc',
					id: 'intro/introduction',
					label: 'Overview',
				},
				{
					type: 'doc',
					id: 'intro/how-it-works',
					label: 'How Contember works',
				},
				'intro/glossary',
			],
		},

		{
			type: 'category',
			label: 'Contember Basics',
			collapsed: false,
			items: [
				{
					type: 'doc',
					id: 'intro/installation',
					label: 'Installation',
				},
				{
					type: 'doc',
					id: 'intro/quickstart',
					label: 'Designing your data model',
				},
				{
					type: 'doc',
					id: 'intro/graphql',
					label: 'Handling data with GraphQL',
				},
				'intro/interface',
				'intro/deployment',
				'intro/actions',
			],
		},

		{
			type: 'category',
			label: 'Contember Interface',
			collapsed: true,
			items: [
				'reference/interface/introduction',
				{
					type: 'category',
					label: 'Pages and routing',
					collapsed: true,
					items: [
						{
							type: 'doc',
							id: 'reference/interface/pages/overview',
							label: 'Overview',
						},
						'reference/interface/pages/routing',
						'reference/interface/pages/links',
						'reference/interface/pages/slots',
					],
				},
				{
					type: 'category',
					label: 'Binding',
					collapsed: true,
					items: [
						{
							type: 'doc',
							id: 'reference/interface/data-binding/overview',
							label: 'Overview',
						},
						'reference/interface/data-binding/query-language',
						'reference/interface/data-binding/value-rendering',
						'reference/interface/data-binding/relationship-components',
						'reference/interface/data-binding/custom-components',
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
						'reference/engine/schema/overview',
						'reference/engine/schema/columns',
						'reference/engine/schema/relationships',
						'reference/engine/schema/views',
						'reference/engine/schema/acl',
						'reference/engine/schema/tenant-acl',
						'reference/engine/schema/validations',
					],
				},
				{
					type: 'category',
					label: 'Migrations',
					collapsed: true,
					items: [
						'reference/engine/migrations/overview',
						'reference/engine/migrations/basics',
						'reference/engine/migrations/content-migrations',
						{
							type: 'category',
							label: 'Advanced',
							items: [
								'reference/engine/migrations/advanced/development-commands',
								'reference/engine/migrations/advanced/skipping-validations',
								'reference/engine/migrations/advanced/writing-schema-migrations',
							],
						},
					],
				},
				{
					type: 'category',
					label: 'Content API',
					items: [
						'reference/engine/content/overview',
						'reference/engine/content/queries',
						'reference/engine/content/mutations',
						'reference/engine/content/s3',
						'reference/engine/content/event-log',
						'reference/engine/content/transfer',
						{
							type: 'category',
							label: 'Advanced',
							items: [
								'reference/engine/content/advanced/assume-identity',
								'reference/engine/content/advanced/assume-membership',
								'reference/engine/content/advanced/request-debugging',
								'reference/engine/content/advanced/caching',
							],
						},
					],
				},
				{
					type: 'category',
					label: 'Tenant API',
					items: [
						'reference/engine/tenant/overview',
						'reference/engine/tenant/sessions',
						'reference/engine/tenant/invites',
						'reference/engine/tenant/memberships',
						'reference/engine/tenant/api-keys',
						'reference/engine/tenant/idp',
						'reference/engine/tenant/passwordless',
						'reference/engine/tenant/mail-templates',
					],
				},
				{
					type: 'category',
					label: 'Actions',
					items: [
						{
							type: 'doc',
							id: 'reference/engine/actions/overview',
							label: 'Overview',
						},
						'reference/engine/actions/definition',
						'reference/engine/actions/managing',
						'reference/engine/actions/invocation',
					],
				},
			],
		},
		'reference/cli',
		{
			type: 'category',
			label: 'Contember Cloud',
			collapsed: true,
			items: [
				'guides/deploy-contember',
				'cloud/permissions',
			],
		},
		{
			type: 'category',
			label: 'Guides',
			collapsed: true,
			items: [
				'guides/deploy-github-actions',
				'guides/self-hosted-contember',
				'guides/seo',
				'guides/acl-definition',
				'guides/superface',
			],
		},
	],
}


export default sidebars
