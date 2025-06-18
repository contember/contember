import { NamedExoticComponent } from 'react';
import { SugaredRelativeSingleField } from '@contember/interface';

/**
 * Props {@link FormattedFieldProps}.
 *
 * `FormattedField` is a wrapper around {@link FieldView} that applies a formatter to the field's value
 * based on its schema definition.
 *
 * #### Example: Rendering a formatted field
 * ```tsx
 * <FormattedField field={myField} />
 * ```
 */
export declare const FormattedField: NamedExoticComponent<FormattedFieldProps>;

/**
 * Props for the {@link FormattedField} component.
 */
export declare interface FormattedFieldProps {
    /**
     * The field to render.
     */
    field: SugaredRelativeSingleField['field'];
}

export { }
