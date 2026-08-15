"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createUser } from "@/app/lib/services/users";
import { UserRole } from "@/app/lib/types/user";
import { ArrowLeft } from "lucide-react";
import { signupSchema, type SignupFormData } from "@/app/schemas/auth.schema";

export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

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

  async function onSubmit(data: SignupFormData) {
    setSubmitting(true);
    setServerError(null);

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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g. johndoe"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="e.g. Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-600">
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Min 6 characters"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0) + role.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-xs text-red-600">
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
