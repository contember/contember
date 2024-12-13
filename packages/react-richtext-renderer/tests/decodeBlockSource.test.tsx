import { describe, expect, test } from 'bun:test'
import { BuiltinElements } from '../src'
import { renderHook } from '@testing-library/react'
import { useRichTextBlocksSource } from '../src/hooks/useRichTextBlocksSource'

describe('useRichTextBlocksSource', () => {
	const createBlock = (el: BuiltinElements) => ({
		content: {
			formatVersion: 1,
			children: [el],
		},
		id: '1',
		references: undefined,
	})

	test('decode blocks with references', () => {
		const { result } = renderHook(() => useRichTextBlocksSource({
			blocks: [{
				source: '{"formatVersion":1,"children":[{"type":"reference","children":[{"text":"Foo bar"}],"referenceId":"74bfb183-3adf-4cc1-8e8e-6d5cd700cadd"}]}',
				references: [
					{
						id: '74bfb183-3adf-4cc1-8e8e-6d5cd700cadd',
						type: 'image',
						url: 'https://example.com/image.png',
					},
				],

			}],
			sourceField: 'source',
			referencesField: 'references',
			referenceDiscriminationField: 'type',
		}))
		expect(result.current).toStrictEqual([
			{
				'content': {
					'children': [
						{
							'children': [
								{
									'text': 'Foo bar',
								},
							],
							'referenceId': '74bfb183-3adf-4cc1-8e8e-6d5cd700cadd',
							'type': 'reference',
						},
					],
					'formatVersion': 1,
				},
				'id': undefined,
				'references': {
					'74bfb183-3adf-4cc1-8e8e-6d5cd700cadd': {
						'id': '74bfb183-3adf-4cc1-8e8e-6d5cd700cadd',
						'type': 'image',
						'url': 'https://example.com/image.png',
					},
				},
			},
		])
	})

})
