export const generateEnumerabilityPreventingEntropy = (length: number = 5): string => {
	return (Math.random() * Math.pow(10, length)).toFixed(0).padStart(length, '0')
}
