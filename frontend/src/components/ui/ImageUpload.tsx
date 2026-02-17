import { useRef } from "react";
import Button from "./Button";

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

export function ImageUpload({ file, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    onChange(selected);
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      {!file ? (
        <Button
          type="button"
          variant="primary"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Upload image
        </Button>
      ) : (
        <>
          <span className="text-sm text-gray-600">
            {file.name}
          </span>

          <Button
            type="button"
            variant="primary"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Change
          </Button>
        </>
      )}
    </div>
  );
}
