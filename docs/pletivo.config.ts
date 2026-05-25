import { defineConfig } from 'pletivo'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import rehypeSlug from 'rehype-slug'
import rehypeShiki from '@shikijs/rehype'
import remarkAdmonitions from './src/lib/remark-admonitions.ts'

export default defineConfig({
	srcDir: 'src',
	publicDir: 'public',
	outDir: 'build',
	port: 3010,
	base: '/',
	mdx: {
		remarkPlugins: [
			remarkGfm,
			remarkDirective,
			remarkAdmonitions,
		],
		rehypePlugins: [
			rehypeSlug,
			[rehypeShiki, { theme: 'night-owl' }],
		],
	},
})
