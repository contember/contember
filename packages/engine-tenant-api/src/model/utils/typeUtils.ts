export type FixedLengthHexString<Length extends number> = string & { __brand: `hexstring_${Length}` }

const isHex = /^[a-f0-9]+$/

export const isFixedLengthHexString = <Length extends number>(input: string, length: Length): input is FixedLengthHexString<Length> => (
	input.length === length && input.match(isHex) !== null
)
