"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";

interface AuthResponse {
  message: string;
}

export interface AuthFormField {
  label: string;
  leadingIcon?: ReactNode;
  minLength?: number;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: string;
}

interface AuthFormCardProps {
  description: string;
  endpoint: string;
  fields: AuthFormField[];
  pendingLabel: string;
  submitLabel: string;
  submitLeadingIcon?: ReactNode;
  title: string;
}

export function AuthFormCard({
  description,
  endpoint,
  fields,
  pendingLabel,
  submitLabel,
  submitLeadingIcon,
  title
}: AuthFormCardProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setIsSubmitting(true);

    const response = await postAuthForm(endpoint, formData);
    if (response.ok) {
      window.location.assign("/");
      return;
    }

    setError(await getErrorMessage(response));
    setIsSubmitting(false);
  }

  return (
    <Card className="p-5">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form action={handleSubmit} className="flex flex-col gap-4">
        <AuthFormFields fields={fields} />
        {error ? <p className="text-sm leading-6 text-danger">{error}</p> : null}
        <Button disabled={isSubmitting} leadingIcon={submitLeadingIcon} size="lg" type="submit">
          {isSubmitting ? pendingLabel : submitLabel}
        </Button>
      </form>
    </Card>
  );
}

function AuthFormFields({ fields }: { fields: AuthFormField[] }) {
  return fields.map((field) => <Input key={field.name} {...field} />);
}

async function postAuthForm(endpoint: string, formData: FormData) {
  return fetch(endpoint, {
    body: JSON.stringify(Object.fromEntries(formData.entries())),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
}

async function getErrorMessage(response: Response) {
  const result = (await response.json().catch(() => null)) as AuthResponse | null;
  return result?.message ?? "请求失败，请稍后重试。";
}
