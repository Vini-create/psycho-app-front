"use client";

import { useState } from "react";
import { IconButton } from "./Button";
import { TextField, type TextFieldProps } from "./Field";

export type PasswordFieldProps = Omit<TextFieldProps, "type" | "endAdornment">;

/** Campo de senha com controle acessível para revelar e ocultar o conteúdo. */
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const action = visible ? "Ocultar senha" : "Mostrar senha";

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      endAdornment={
        <IconButton
          type="button"
          size="sm"
          icon={visible ? "hide" : "show"}
          label={action}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        />
      }
    />
  );
}
