export const randomInt = (min: number, max: number) => {
	if (min >= max) {
		throw new Error('The min value must be less than the max value.')
	}

	if (max > 0xFFFFFFFF) {
		throw new Error('The max value exceeds the limit for this implementation.')
	}

	const range = max - min + 1
	const maxValidValue = Math.floor(0xFFFFFFFF / range) * range
	let randomInt

	do {
		const array = new Uint32Array(1)
		window.crypto.getRandomValues(array)
		randomInt = array[0]
	} while (randomInt >= maxValidValue)

	return min + (randomInt % range)
}


export const randomString = (length: number, charset: string): string => {
	let result = ''
	for (let i = 0; i < length; i++) {
		result += charset[randomInt(0, charset.length - 1)]
	}
	return result
}
