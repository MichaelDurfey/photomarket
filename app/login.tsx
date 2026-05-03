import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { getBackendBaseUrl } from "./lib/backend-url";

export default function Login() {
  const [searchParams] = useSearchParams();
  const [oidcConfigured, setOidcConfigured] = useState<boolean | null>(null);
  const backendBase = getBackendBaseUrl();
  const oidcLoginUrl = `${backendBase}/auth/oidc/login`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${backendBase}/api/auth/oidc-status`);
        const data = (await res.json()) as { configured?: boolean };
        if (!cancelled) setOidcConfigured(!!data.configured);
      } catch {
        if (!cancelled) setOidcConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [backendBase]);

  const urlError = searchParams.get("error");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Accounts are created automatically on first successful sign-in.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 space-y-6">
          {urlError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {urlError}
            </div>
          )}

          {oidcConfigured === false && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-3 rounded text-sm">
              OIDC is not configured on the API. Set{" "}
              <code className="text-xs bg-yellow-100 px-1 rounded">OIDC_ISSUER</code>{" "}
              and{" "}
              <code className="text-xs bg-yellow-100 px-1 rounded">OIDC_CLIENT_ID</code>{" "}
              in the backend <code className="text-xs">.env</code> (see{" "}
              <code className="text-xs">backend/README_OIDC.md</code>).
            </div>
          )}

          <a
            href={oidcLoginUrl}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Continue with OpenID Connect
          </a>

          <p className="text-center text-sm text-gray-500">
            <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">
              Back to store
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
