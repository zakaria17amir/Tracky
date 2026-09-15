import { Label, TextInput, type TextInputProps } from "flowbite-react";

interface TextFieldProps extends Omit<TextInputProps, "color"> {
  id: string;
  label: string;
  error?: string;
}

export default function TextField({ id, label, error, ...inputProps }: TextFieldProps) {
  return (
    <div>
      <div className="mb-1">
        <Label htmlFor={id}>{label}</Label>
      </div>
      <TextInput id={id} color={error ? "failure" : undefined} {...inputProps} />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
