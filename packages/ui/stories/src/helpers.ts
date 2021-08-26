export function disabledControlsFromAttributes(attributes: string[]) {
  return attributes.reduce((previousValue: object, currentValue: string) => ({
    ...previousValue,
    [currentValue]: {
      control: false,
    },
  }), {})
}
