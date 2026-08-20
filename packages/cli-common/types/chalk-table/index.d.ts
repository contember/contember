declare module 'chalk-table' {
	export default function chalkTable<Keys extends string>(
		options: {
			intersectionCharacter?: string
			columns?: (Keys | { field: Keys; name: string })[]
		},
		data: Record<Keys, string>[],
	): string
}
