import { Context } from 'react';
import { ErrorAccessor } from '@contember/react-binding';
import { ErrorAccessor as ErrorAccessor_2 } from '@contember/binding-common';
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

export declare const FormCheckbox: React_2.NamedExoticComponent<FormCheckboxProps>;

export declare interface FormCheckboxProps {
    field: SugaredRelativeSingleField['field'];
    isNonbearing?: boolean;
    defaultValue?: OptionallyVariableFieldValue;
    children: ReactElement<HTMLInputElement, 'input'>;
}

export declare const FormError: ({ children, formatter }: {
    formatter: (errors: ErrorAccessor.Error[]) => ReactNode[];
    children: ReactElement;
}) => ReactElement<any, string | JSXElementConstructor<any>>[];

/**
 * @deprecated use `FormFieldStateProvider` instead
 */
export declare const FormErrorContext: {
    /**
     * @deprecated use `FormFieldStateProvider` instead
     */
    Provider: ({ children, value }: {
        children: React.ReactNode;
        value: ErrorAccessor.Error[];
    }) => JSX_2.Element;
};

/**
 * @deprecated use `FormFieldStateProvider` instead
 */
export declare const FormFieldIdContext: {
    /**
     * @deprecated use `FormFieldStateProvider` instead
     */
    Provider: ({ children, value }: {
        children: React.ReactNode;
        value: string;
    }) => JSX_2.Element;
};

export declare const FormFieldScope: ({ field, children, required }: FormFieldScopeProps) => JSX_2.Element;

export declare type FormFieldScopeProps = {
    field: SugaredRelativeSingleField['field'];
    children: React_2.ReactNode;
    required?: boolean;
};

export declare type FormFieldState = {
    htmlId: string;
    errors: ErrorAccessor.Error[];
    required: boolean;
    dirty: boolean;
    field?: {
        entityName: string;
        fieldName: string;
        enumName?: string;
    };
};

export declare const FormFieldStateContext: Context<FormFieldState | undefined>;

export declare type FormFieldStateProvider = Partial<FormFieldState> & {
    children: React.ReactNode;
};

export declare const FormFieldStateProvider: ({ children, required, errors, dirty, htmlId, field }: FormFieldStateProvider) => JSX_2.Element;

export declare const FormHasManyRelationScope: ({ children, required, ...props }: FormHasManyRelationScopeProps) => JSX_2.Element;

export declare type FormHasManyRelationScopeProps = {
    field: SugaredRelativeEntityList['field'];
    orderBy?: SugaredRelativeEntityList['orderBy'];
    limit?: SugaredRelativeEntityList['limit'];
    offset?: SugaredRelativeEntityList['offset'];
    children: React_2.ReactNode;
    required?: boolean;
};

export declare const FormHasOneRelationScope: ({ field, children, required }: FormHasOneRelationScopeProps) => JSX_2.Element;

export declare type FormHasOneRelationScopeProps = {
    field: SugaredRelativeSingleEntity['field'];
    children: React_2.ReactNode;
    required?: boolean;
};

export declare const FormInput: React_2.NamedExoticComponent<FormInputProps>;

export declare type FormInputHandler<State = unknown> = {
    parseValue: (value: string, ctx: FormInputHandlerContext<State>) => any;
    formatValue: (value: any, ctx: FormInputHandlerContext<State>) => string;
    defaultInputProps?: React_2.InputHTMLAttributes<HTMLInputElement>;
};

export declare type FormInputHandlerContext<State = unknown> = {
    state?: State;
    setState: (state: State) => void;
};

export declare interface FormInputProps {
    field: SugaredRelativeSingleField['field'];
    isNonbearing?: boolean;
    defaultValue?: OptionallyVariableFieldValue;
    children: React_2.ReactElement;
    formatValue?: FormInputHandler['formatValue'];
    parseValue?: FormInputHandler['parseValue'];
}

export declare const FormLabel: (props: {
    children: React_2.ReactElement;
}) => JSX_2.Element;

export declare const FormRadioInput: React_2.NamedExoticComponent<FormRadioItemProps>;

export declare interface FormRadioItemProps {
    field: SugaredRelativeSingleField['field'];
    value: string | null | number | boolean;
    isNonbearing?: boolean;
    defaultValue?: OptionallyVariableFieldValue;
    children: React_2.ReactNode;
}

/**
 * @deprecated use `useFormState` instead
 */
export declare const useFormError: () => ErrorAccessor_2.Error[] | undefined;

/**
 * @deprecated use `useFormState` instead
 */
export declare const useFormFieldId: () => string | undefined;

export declare const useFormFieldState: () => FormFieldState | undefined;

export declare const useFormInputValidationHandler: (field: FieldAccessor<any>) => {
    ref: React_2.RefObject<HTMLInputElement>;
    onFocus: () => void;
    onBlur: () => void;
};

export { }
