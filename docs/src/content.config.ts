import { defineCollection, glob, z } from 'pletivo/content'

const docs = defineCollection({
	loader: glob({ base: 'src/content/docs', pattern: '**/*.mdx' }),
	schema: z
		.object({
			title: z.string().optional(),
			description: z.string().optional(),
			/** Route override (Docusaurus parity). `intro/introduction` uses `slug: /`. */
			slug: z.string().optional(),
			toc_max_heading_level: z.number().optional(),
			sidebar_position: z.number().optional(),
		})
		.passthrough(),
})

export const collections = { docs }
