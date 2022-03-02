import { ComponentPropsWithRef, ElementType } from 'react'

export function disabledControlsForAttributes<P extends ElementType<any>>(...attributes: (keyof ComponentPropsWithRef<P>)[]) {
  return attributes.reduce((previousValue: object, currentValue: keyof ComponentPropsWithRef<P>) => ({
    ...previousValue,
    [currentValue]: {
      table: {
        disable: true,
      },
    },
  }), {})
}

export function rangeControl(min: number = 0, max: number = 100, step: number = 1, defaultValue?: number, description?: string) {
  return {
    control: { type: 'range', min, max, step },
    defaultValue,
    description,
  }
}

export function numberControl(min?: number, max?: number, step?: number, defaultValue?: number, description?: string) {
  return {
    control: { type: 'number', min, max, step },
    defaultValue: defaultValue ?? min,
    description,
  }
}

export function booleanControl(defaultValue?: boolean, description?: string) {
  return {
    control: { type: 'boolean' },
    defaultValue,
    description,
  }
}

export function stringControl(defaultValue?: string, description?: string) {
  return {
    control: { type: 'text' },
    defaultValue,
    description,
  }
}

type EnumControlType =
  | 'radio'  | 'inline-radio'
  | 'check'  | 'inline-check'
  | 'select' | 'multi-selec'

export function enumControl<V extends (string | number | boolean | undefined | null)>(
  options: V[],
  type: EnumControlType,
  defaultValue?: V,
  description?: string,
) {
  return {
     control: { type, options },
     defaultValue,
     description,
   }
 }
