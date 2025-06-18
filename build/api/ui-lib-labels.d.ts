import { Provider } from 'react';
import { ReactNode } from 'react';

export declare type EnumOptionsFormatter = (enumName: string) => Record<string, ReactNode>;

export declare const EnumOptionsFormatterProvider: Provider<EnumOptionsFormatter>;

export declare type FieldLabelFormatter = (entityName: string, fieldName: string) => ReactNode | null;

export declare const FieldLabelFormatterProvider: Provider<FieldLabelFormatter>;

export declare const useEnumOptionsFormatter: () => EnumOptionsFormatter;

export declare const useFieldLabelFormatter: () => FieldLabelFormatter;

export { }
