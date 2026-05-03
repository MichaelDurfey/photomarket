import { useEffect } from "react";
import { useNavigate } from "react-router";

/**
 * Registration is implicit: the IdP creates the identity and we upsert a local user on first OIDC login.
 */
export default function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600 text-sm">
      Redirecting to sign in…
    </div>
  );
}
