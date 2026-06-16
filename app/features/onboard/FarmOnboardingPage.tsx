"use client";

import FieldPilotLogo from "@/app/components/brand/FieldPilotLogo";
import HelpHint from "@/app/abstract/ui/HelpHint";
import FarmLocationPicker from "@/app/components/FarmLocationPicker";
import type { FieldBoundaryPoint } from "@/app/base/services/farm-client";
import { yupResolver } from "@hookform/resolvers/yup";
import { Alert, Button, NumberInput, PasswordInput, TextInput } from "@mantine/core";
import { CheckCircle2, LogIn, MapPinned, ShieldCheck, Sprout } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import * as yup from "yup";

const onboardingSchema = yup.object({
  farmName: yup.string().required("Farm name is required"),
  location: yup.string().nullable().defined(),
  lat: yup
    .number()
    .nullable()
    .defined()
    .transform((value) => (Number.isNaN(value) ? null : value)),
  lng: yup
    .number()
    .nullable()
    .defined()
    .transform((value) => (Number.isNaN(value) ? null : value)),
  acreage: yup
    .number()
    .nullable()
    .defined()
    .min(0, "Acreage cannot be negative")
    .transform((value) => (Number.isNaN(value) ? null : value)),
  name: yup.string().required("Admin name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(8, "At least 8 characters")
    .required("Password is required"),
});

type OnboardingData = yup.InferType<typeof onboardingSchema>;

export default function FarmOnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingData>({
    resolver: yupResolver(onboardingSchema),
    defaultValues: {
      farmName: "",
      location: "",
      lat: null,
      lng: null,
      acreage: null,
      name: "",
      email: "",
      password: "",
    },
  });

  const selectedLat = useWatch({ control, name: "lat" });
  const selectedLng = useWatch({ control, name: "lng" });
  const selectedLocationLabel = useWatch({ control, name: "location" }) ?? "";
  const selectedFarmLocation =
    typeof selectedLat === "number" && typeof selectedLng === "number"
      ? { lat: selectedLat, lng: selectedLng }
      : null;

  const setFarmLocation = useCallback(
    (point: FieldBoundaryPoint, label: string) => {
      setValue("location", label, { shouldDirty: true });
      setValue("lat", point.lat, { shouldDirty: true });
      setValue("lng", point.lng, { shouldDirty: true });
    },
    [setValue],
  );

  async function submit(data: OnboardingData) {
    setError(null);

    const response = await fetch("/api/farms/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Farm onboarding failed");
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-primary">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1fr] lg:items-start">
        <section className="pt-4 lg:pt-10">
          <Link href="/" className="mb-8 inline-flex items-center gap-3 no-underline">
            <FieldPilotLogo size="md" />
          </Link>
          <h1 className="text-4xl font-extrabold leading-tight text-primary">
            Bring your farm online in a few focused steps.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-secondary">
            Add the farm name, drop a pin on the map, and create the first
            account. From there you can map fields, list products, and start
            running the operation from one workspace.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                title: "Your own workspace",
                copy: "Keep users, fields, products, and records separate for each farm.",
                Icon: ShieldCheck,
              },
              {
                title: "Map the home base",
                copy: "Set the location once so field setup and farm discovery start in the right place.",
                Icon: MapPinned,
              },
              {
                title: "Ready for day one",
                copy: "Jump straight into field mapping, inventory, livestock, and traceability after signup.",
                Icon: Sprout,
              },
            ].map(({ title, copy, Icon }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-4">
                <Icon size={18} className="text-green" />
                <div className="mt-3 text-sm font-semibold text-primary">{title}</div>
                <p className="mt-1 text-sm leading-6 text-secondary">{copy}</p>
              </div>
            ))}
          </div>
          <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-green no-underline">
            <LogIn size={16} />
            Already have an account? Sign in
          </Link>
        </section>

        <form
          onSubmit={handleSubmit(submit)}
          className="rounded-xl border border-border bg-card p-5 sm:p-6"
        >
          <div className="mb-6 rounded-2xl border border-border bg-surface p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-primary">Create your farm account</h2>
                  <HelpHint label="Set up the workspace first, then add fields, products, and team members after you enter the dashboard." />
                </div>
                <p className="mt-1 text-sm text-muted">
                  Start with the basics. You can add fields, products, team
                  members, and more once you are inside.
                </p>
              </div>
              <div className="rounded-full bg-green/10 px-3 py-1 text-xs font-semibold text-green">
                About 2 minutes
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-border p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
                <CheckCircle2 size={16} className="text-green" />
                Farm details
                <HelpHint label="Name the farm, place the pin on the main operating location, and add rough acreage. Precision can be refined later." />
              </div>
              <div className="grid gap-4">
            <TextInput
              label="Farm name"
              placeholder="Green Acres Farm"
              {...register("farmName")}
              error={errors.farmName?.message}
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
                  placeholder="Approximate total acreage"
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value || null)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  error={errors.acreage?.message}
                />
              )}
            />
              </div>
            </div>

            <div className="rounded-2xl border border-border p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
                <CheckCircle2 size={16} className="text-green" />
                Account owner
                <HelpHint label="This first user starts with full access. Additional managers, workers, and specialists can be invited later." />
              </div>
              <p className="mb-4 text-sm text-muted">
                This account gets full access first. You can invite the rest of
                the team after setup.
              </p>

              <div className="grid gap-4">
                <TextInput
                  label="Your name"
                  placeholder="Your name"
                  {...register("name")}
                  error={errors.name?.message}
                  required
                />
                <TextInput
                  label="Email"
                  placeholder="admin@farm.com"
                  type="email"
                  {...register("email")}
                  error={errors.email?.message}
                  required
                />
                <PasswordInput
                  label="Password"
                  placeholder="At least 8 characters"
                  {...register("password")}
                  error={errors.password?.message}
                  required
                />
              </div>
            </div>

            {error && (
              <Alert color="red" variant="light" p="xs">
                {error}
              </Alert>
            )}

            <Button type="submit" fullWidth loading={isSubmitting} variant="filled">
              {isSubmitting ? "Creating your farm..." : "Create farm account"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
