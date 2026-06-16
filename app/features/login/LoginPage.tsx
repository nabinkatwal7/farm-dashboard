"use client";

import { useAuthMe } from "@/app/base/hooks/useAuthMe";
import FieldPilotLogo from "@/app/components/brand/FieldPilotLogo";
import { authMeQueryKey } from "@/app/lib/query-client";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  TextInput,
  PasswordInput,
  NumberInput,
  Button,
  Alert,
} from "@mantine/core";
import FarmLocationPicker from "@/app/components/FarmLocationPicker";
import type { FieldBoundaryPoint } from "@/app/base/services/farm-client";

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
  lat: yup.number().nullable().transform((v) => (Number.isNaN(v) ? null : v)),
  lng: yup.number().nullable().transform((v) => (Number.isNaN(v) ? null : v)),
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
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const authMeQuery = useAuthMe(true);

  const isSetup = mode === "setup";

  const schema = isSetup ? setupSchema : loginSchema;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginData | SetupData>({
    resolver: yupResolver(schema),
    defaultValues: {
      location: "",
      lat: null,
      lng: null,
    } as Partial<SetupData>,
  });

  const e = errors as Record<string, { message?: string } | undefined>;
  const selectedLat = useWatch({ control, name: "lat" as never }) as
    | number
    | null
    | undefined;
  const selectedLng = useWatch({ control, name: "lng" as never }) as
    | number
    | null
    | undefined;
  const selectedLocationLabel =
    (useWatch({ control, name: "location" as never }) as
      | string
      | null
      | undefined) ?? "";
  const selectedFarmLocation =
    typeof selectedLat === "number" && typeof selectedLng === "number"
      ? { lat: selectedLat, lng: selectedLng }
      : null;

  const setFarmLocation = useCallback(
    (point: FieldBoundaryPoint, label: string) => {
      setValue("location" as never, label as never, { shouldDirty: true });
      setValue("lat" as never, point.lat as never, { shouldDirty: true });
      setValue("lng" as never, point.lng as never, { shouldDirty: true });
    },
    [setValue],
  );

  useEffect(() => {
    if (!authMeQuery.data) return;
    setMode(authMeQuery.data.setupRequired ? "setup" : "login");
  }, [authMeQuery.data]);

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

    await queryClient.invalidateQueries({ queryKey: authMeQueryKey });
    router.replace("/dashboard");
  }

  return (
    <main className="min-h-screen w-full grid place-items-center p-6">
      <form
        onSubmit={handleSubmit(submit)}
        className="w-[min(460px,100%)] bg-card border border-border rounded-xl p-6 flex flex-col gap-3.5"
      >
        <div className="flex items-center gap-3">
          <FieldPilotLogo size="md" showTagline={false} />
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

        {authMeQuery.isPending && (
          <Alert color="gray" variant="light" p="xs">
            Checking workspace status...
          </Alert>
        )}

        {isSetup && (
          <>
            <TextInput
              label="Farm name"
              placeholder="Green Acres Farm"
              {...register("farmName")}
              error={e.farmName?.message}
              required
            />
            <input type="hidden" {...register("location")} />
            <input type="hidden" {...register("lat")} />
            <input type="hidden" {...register("lng")} />
            <FarmLocationPicker
              value={selectedFarmLocation}
              label={selectedLocationLabel}
              onChange={setFarmLocation}
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
        {!isSetup && (
          <p className="m-0 text-center text-sm text-muted">
            New farm?{" "}
            <Link href="/onboard" className="font-semibold text-green no-underline">
              Create a farm workspace
            </Link>
          </p>
        )}
      </form>
    </main>
  );
}
