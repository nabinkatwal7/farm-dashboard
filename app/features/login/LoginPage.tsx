"use client";

import { Leaf } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  TextInput,
  PasswordInput,
  NumberInput,
  Button,
  Alert,
} from "@mantine/core";

const loginSchema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "At least 8 characters")
    .required("Password is required"),
});

const setupSchema = yup.object({
  farmName: yup.string().required("Farm name is required"),
  location: yup.string().nullable(),
  acreage: yup.number().nullable().transform((v) => (Number.isNaN(v) ? null : v)),
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "At least 8 characters")
    .required("Password is required"),
});

type LoginData = yup.InferType<typeof loginSchema>;
type SetupData = yup.InferType<typeof setupSchema>;
type Mode = "login" | "setup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSetup = mode === "setup";

  const schema = isSetup ? setupSchema : loginSchema;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginData | SetupData>({
    resolver: yupResolver(schema),
  });

  const e = errors as Record<string, { message?: string } | undefined>;

  useEffect(() => {
    async function checkSetup() {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await response.json()) as { setupRequired: boolean };
      setMode(data.setupRequired ? "setup" : "login");
      setLoading(false);
    }

    void checkSetup();
  }, []);

  async function submit(data: LoginData | SetupData) {
    setError(null);

    const payload = isSetup
      ? data
      : { email: (data as LoginData).email, password: (data as LoginData).password };

    const response = await fetch(
      isSetup ? "/api/auth/setup" : "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Authentication failed");
      return;
    }

    router.replace("/");
  }

  if (loading) return null;

  return (
    <main className="min-h-screen w-full grid place-items-center p-6">
      <form
        onSubmit={handleSubmit(submit)}
        className="w-[min(460px,100%)] bg-card border border-border rounded-xl p-6 flex flex-col gap-3.5"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-[42px] w-[42px] place-items-center rounded-xl border border-border bg-card text-green">
            <Leaf size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[1.35rem] font-extrabold text-primary">
              {isSetup ? "Create Farm Workspace" : "Sign in"}
            </h1>
            <p className="text-muted text-sm">
              {isSetup
                ? "Set up the first admin account"
                : "Use your farm account"}
            </p>
          </div>
        </div>

        {isSetup && (
          <>
            <TextInput
              label="Farm name"
              placeholder="Green Acres Farm"
              {...register("farmName")}
              error={e.farmName?.message}
              required
            />
            <TextInput
              label="Location"
              placeholder="York, UK"
              {...register("location")}
              error={e.location?.message}
            />
            <Controller
              name="acreage"
              control={control}
              render={({ field }) => (
                <NumberInput
                  label="Acreage"
                  placeholder="Total acreage"
                  value={field.value as number}
                  onChange={(v) => field.onChange(v)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  error={e.acreage?.message}
                />
              )}
            />
            <TextInput
              label="Admin name"
              placeholder="Your name"
              {...register("name")}
              error={e.name?.message}
              required
            />
          </>
        )}

        <TextInput
          label="Email"
          placeholder="admin@farm.com"
          type="email"
          {...register("email")}
          error={e.email?.message}
          required
        />
        <PasswordInput
          label="Password"
          placeholder="At least 8 characters"
          {...register("password")}
          error={e.password?.message}
          required
        />

        {error && (
          <Alert color="red" variant="light" p="xs">
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          fullWidth
          loading={isSubmitting}
          variant="filled"
        >
          {isSubmitting
            ? "Please wait..."
            : isSetup
              ? "Create Workspace"
              : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
