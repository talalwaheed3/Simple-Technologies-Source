import { LoginForm } from "@/components/admin-controls";
export const metadata = {
  title: "Technician sign in",
  robots: { index: false, follow: false },
};
export default function Login() {
  return (
    <div className="wrap section">
      <div className="prose">
        <div className="eyebrow">Technician workspace</div>
        <h1>Sign in to your workbench.</h1>
        <p className="muted">
          Use the administrator account created for this site.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
