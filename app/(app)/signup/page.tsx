"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createUser } from "@/app/lib/services/users";
import { usePermissions } from "@/app/lib/hooks/use-permissions";
import { UserRole } from "@/app/lib/types/user";
import { ArrowLeft } from "lucide-react";
import { signupSchema, type SignupFormData } from "@/app/schemas/auth.schema";
import { collectValidationProblems } from "@/app/lib/validation-problems";

export default function SignupPage() {
  const router = useRouter();
  const { isAdmin, isLoading: userLoading } = usePermissions();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [validationProblems, setValidationProblems] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      password: "",
      lastName: "",
      role: "USER",
    },
  });

  /**
   * A refused submit has to say so (X-03). `handleSubmit` had no invalid handler
   * here, so clicking "Create User" with a field the rules reject did nothing at
   * all — no message, no request, not even a spinner.
   */
  const onInvalid = (formErrors: unknown) => {
    setValidationProblems(collectValidationProblems(formErrors));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function onSubmit(data: SignupFormData) {
    setSubmitting(true);
    setServerError(null);
    setValidationProblems([]);

    try {
      await createUser({
        name: data.name,
        password: data.password,
        role: data.role as UserRole,
        ...(data.lastName ? { lastName: data.lastName } : {}),
      });
      router.push("/users");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to create user",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Adding users is ADMIN-only on the server (`AdminOnlyGuard`), so a non-admin
  // gets a plain message instead of a form whose submit is refused (P-4) — the
  // same shape the seasons page uses.
  if (!userLoading && !isAdmin) {
    return (
      <div className="p-4 space-y-6">
        <button
          onClick={() => router.push("/users")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </button>

        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Only an administrator can add users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/users")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </button>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        {/* Page Header + Submit */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              New User
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create a new user account
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              disabled:opacity-60 disabled:cursor-not-allowed transition duration-200"
          >
            {submitting ? "Creating..." : "Create User"}
          </button>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {serverError}
          </div>
        )}

        {validationProblems.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            <p className="font-semibold">
              Nothing was saved — some fields still need a value.
            </p>
            <ul className="mt-1.5 list-disc pl-5 space-y-0.5">
              {validationProblems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Fields */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Account Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username *
              </label>
              <input
                type="text"
                {...register("name")}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. johndoe"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
                <span className="text-gray-400 font-normal"> (optional)</span>
              </label>
              <input
                type="text"
                {...register("lastName")}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                {...register("password")}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Min 6 characters"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role *
              </label>
              <select
                {...register("role")}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0) + role.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.role.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
