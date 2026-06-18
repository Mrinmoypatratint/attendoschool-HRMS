/**
 * ForgotPasswordPage
 *
 * Public auth page where a user requests a password reset link by entering
 * their email. Submission invokes the `requestPasswordReset` Firebase callable
 * function. To avoid leaking which emails are registered, the UI always shows a
 * neutral success message once the request completes. Form input is validated
 * with react-hook-form + Zod.
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../lib/firebase";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

/**
 * ForgotPasswordPage
 *
 * Renders the forgot-password form and handles submission state.
 *
 * @returns The forgot-password page element.
 */
export function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotForm) => {
    setError(null);
    setLoading(true);
    try {
      const requestReset = httpsCallable(functions, "requestPasswordReset");
      await requestReset({ email: data.email });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to send password reset email."));
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
          <h1 className="mt-4 text-xl font-bold text-slate-900 tracking-tight">Forgot Password</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your email to receive a password reset link</p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-100">
            {error}
          </div>
        )}

        {success ? (
          <div className="mt-6 text-center">
            <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700 border border-green-100">
              If an account exists for that email, a password reset link is on its way. Please check your inbox.
            </div>
            <Link
              to="/login"
              className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                {...register("email")}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-sm font-semibold text-blue-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
