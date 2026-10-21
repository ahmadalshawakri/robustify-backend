import { type FormEvent, useState } from "react";
import type { z } from "zod";
import type { ApiError } from "../api/client";

type Values = Record<string, string>;

/**
 * Minimal form state: string values, validated on submit with a shared zod
 * schema so the browser checks exactly what the API will check. Server-side
 * field errors are merged into the same `errors` map.
 */
export function useZodForm<S extends z.ZodType, V extends Values>(
  schema: S,
  initial: V,
  toInput: (values: V) => unknown = (values) => values,
) {
  const [values, setValues] = useState<V>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const field = (name: string) => ({
    name,
    value: values[name] ?? "",
    error: Boolean(errors[name]),
    helperText: errors[name],
    onChange: (event: { target: { value: string } }) => {
      setValues((current) => ({ ...current, [name]: event.target.value }));
      if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
    },
  });

  const handleSubmit =
    (onValid: (input: z.output<S>) => void | Promise<void>) => async (event: FormEvent) => {
      event.preventDefault();
      const result = schema.safeParse(toInput(values));
      if (!result.success) {
        setErrors(
          Object.fromEntries(
            result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
          ),
        );
        return;
      }
      setErrors({});
      await onValid(result.data);
    };

  const applyServerErrors = (error: ApiError) => {
    if (error.details.length) {
      setErrors(Object.fromEntries(error.details.map((d) => [d.path, d.message])));
    }
  };

  return { values, setValues, errors, field, handleSubmit, applyServerErrors };
}
