export const generateEnumerabilityPreventingEntropy = (): string => {
	return (Math.random() * 1e5).toFixed(0).padStart(5, '0')
}
