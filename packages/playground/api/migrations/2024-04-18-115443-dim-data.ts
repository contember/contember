import { printMutation } from './utils'
import { queryBuilder } from '../client'

export default printMutation([
	queryBuilder.create('DimensionsLocale', {
		data: {
			code: 'cs',
			label: 'Czech',
		},
	}),
	queryBuilder.create('DimensionsLocale', {
		data: {
			code: 'en',
			label: 'English',
		},
	}),
	queryBuilder.create('DimensionsLocale', {
		data: {
			code: 'de',
			label: 'German',
		},
	}),
	queryBuilder.create('DimensionsItem', {
		data: {
			unique: 'unique',
			locales: [
				{
					create: {
						locale: { connect: { code: 'en' } },
						title: 'Hello world',
						content: 'Hello world content in English',
					},
				},
				{
					create: {
						locale: { connect: { code: 'cs' } },
						title: 'Ahoj světe',
						content: 'Ahoj světe obsah v češtině',
					},
				},
				{
					create: {
						locale: { connect: { code: 'de' } },
						title: 'Hallo Welt',
						content: 'Hallo Welt Inhalt auf Deutsch',
					},
				},
			],
		},
	}),

])
