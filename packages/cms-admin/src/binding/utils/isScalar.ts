export const isScalar = (arg: any): arg is string | number | boolean | null =>
	typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean' || arg === null
