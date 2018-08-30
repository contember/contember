import { SelectedDimension } from '../state/request'

export function toString(dimensions: SelectedDimension): string {
	return (
		Object.entries(dimensions)
			.map(([key, value]) => `${key}=${(value as string[]).join(',')}`)
			.join('+') || 'null'
	)
}

export function toObject(dimensions: string): SelectedDimension {
	return dimensions !== 'null'
		? dimensions
				.split('+')
				.map((pair: string) => pair.split('='))
				.reduce((acc, [key, value]) => ({ ...acc, [key]: value.split(',') }), {})
		: {}
}
