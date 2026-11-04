import { ValueTransformer } from 'typeorm';

/** MySQL returns DECIMAL as string — convert to number for clean JSON. */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? null : parseFloat(value)),
};
