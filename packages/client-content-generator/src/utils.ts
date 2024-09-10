const upperCaseFirstLetter = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1)

export const getEnumTypeName = (enumName: string): string => upperCaseFirstLetter(enumName)
