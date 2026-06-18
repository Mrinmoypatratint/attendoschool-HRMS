/**
 * ResetPasswordPage
 *
 * Public auth page that completes a password reset. It reads the `oobCode`
 * (out-of-band action code) from the URL query string and, on form submit,
 * calls Firebase `confirmPasswordReset` with the new password. On success it
 * shows a confirmation and redirects to /login after 3 seconds. If no `oobCode`
 * is present, the form is hidden and a guidance message is shown instead.
 * Input is validated with react-hook-form + Zod (including a password/confirm
 * match check).
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../../../lib/firebase";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const oobCode = searchParams.get("oobCode");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetForm) => {
    if (!oobCode) {
      setError("Invalid or expired password reset link. Please request a new one.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to reset password. The link may have expired."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 md:p-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 font-bold text-xl">
            HR
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 tracking-tight">Reset Password</h1>
          <p className="mt-1 text-sm text-slate-500">Enter a new secure password for your account</p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-100">
            {error}
          </div>
        )}

        {!oobCode && (
          <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-700 border border-amber-100 text-center">
            No password reset code found. Please check your email link or request a new one.
          </div>
        )}

        {success ? (
          <div className="mt-6 text-center">
            <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700 border border-green-100">
              Password successfully reset! Redirecting to login...
            </div>
            <Link
              to="/login"
              className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          oobCode && (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
