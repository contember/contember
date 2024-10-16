## API Report File for "@contember/react-form"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { Context } from 'react';
import { ErrorAccessor } from '@contember/react-binding';
import { FieldAccessor } from '@contember/react-binding';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { JSXElementConstructor } from 'react';
import { OptionallyVariableFieldValue } from '@contember/react-binding';
import * as React_2 from 'react';
import { ReactElement } from 'react';
import { ReactNode } from 'react';
import { SugaredRelativeEntityList } from '@contember/react-binding';
import { SugaredRelativeSingleEntity } from '@contember/react-binding';
import { SugaredRelativeSingleField } from '@contember/react-binding';

// @public (undocumented)
export const FormCheckbox: React_2.NamedExoticComponent<FormCheckboxProps>;

// @public (undocumented)
export interface FormCheckboxProps {
    // (undocumented)
    children: ReactElement<HTMLInputElement, 'input'>;
    // (undocumented)
    defaultValue?: OptionallyVariableFieldValue;
    // (undocumented)
    field: SugaredRelativeSingleField['field'];
    // (undocumented)
    isNonbearing?: boolean;
}

// @public (undocumented)
export const FormError: ({ children, formatter }: {
    formatter: (errors: ErrorAccessor.Error[]) => ReactNode[];
    children: ReactElement;
}) => ReactElement<any, string | JSXElementConstructor<any>>[];

// @internal (undocumented)
export const FormErrorContext: Context<ErrorAccessor.Error[] | undefined>;

// @internal (undocumented)
export const FormFieldIdContext: Context<string | undefined>;

// @public (undocumented)
export const FormFieldScope: ({ field, children }: FormFieldScopeProps) => JSX_2.Element;

// @public (undocumented)
export type FormFieldScopeProps = {
    field: SugaredRelativeSingleField['field'];
    children: React_2.ReactNode;
};

// @public (undocumented)
export const FormHasManyRelationScope: ({ field, children }: FormHasManyRelationScopeProps) => JSX_2.Element;

// @public (undocumented)
export type FormHasManyRelationScopeProps = {
    field: SugaredRelativeEntityList['field'];
    children: React_2.ReactNode;
};

// @public (undocumented)
export const FormHasOneRelationScope: ({ field, children }: FormHasOneRelationScopeProps) => JSX_2.Element;

// @public (undocumented)
export type FormHasOneRelationScopeProps = {
    field: SugaredRelativeSingleEntity['field'];
    children: React_2.ReactNode;
};

// @public (undocumented)
export const FormInput: React_2.NamedExoticComponent<FormInputProps>;

// @public (undocumented)
export type FormInputHandler = {
    parseValue: (value: string) => any;
    formatValue: (value: any) => string;
    defaultInputProps?: React_2.InputHTMLAttributes<HTMLInputElement>;
};

// @public (undocumented)
export interface FormInputProps {
    // (undocumented)
    children: React_2.ReactElement;
    // (undocumented)
    defaultValue?: OptionallyVariableFieldValue;
    // (undocumented)
    field: SugaredRelativeSingleField['field'];
    // (undocumented)
    formatValue?: FormInputHandler['formatValue'];
    // (undocumented)
    isNonbearing?: boolean;
    // (undocumented)
    parseValue?: FormInputHandler['parseValue'];
}

// @public (undocumented)
export const FormLabel: (props: {
    children: React_2.ReactElement;
}) => JSX_2.Element;

// @public (undocumented)
export const FormRadioInput: React_2.NamedExoticComponent<FormRadioItemProps>;

// @public (undocumented)
export interface FormRadioItemProps {
    // (undocumented)
    children: React_2.ReactNode;
    // (undocumented)
    defaultValue?: OptionallyVariableFieldValue;
    // (undocumented)
    field: SugaredRelativeSingleField['field'];
    // (undocumented)
    isNonbearing?: boolean;
    // (undocumented)
    value: string | null | number | boolean;
}

// @public (undocumented)
export const useFormError: () => ErrorAccessor.Error[] | undefined;

// @public (undocumented)
export const useFormFieldId: () => string | undefined;

// @public (undocumented)
export const useFormInputValidationHandler: (field: FieldAccessor<any>) => {
    ref: React_2.RefObject<HTMLInputElement>;
    onFocus: () => void;
    onBlur: () => void;
};

// (No @packageDocumentation comment for this package)

```
