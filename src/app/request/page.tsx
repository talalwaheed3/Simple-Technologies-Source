import { RequestForm } from "@/components/forms";
export const metadata = {
  title: "Request a solution",
  description:
    "Describe a computer problem, share its symptoms and explain what you have tried to request a troubleshooting solution from Simple Technologies.",
  alternates: { canonical: "/request" },
};
export default function Request() {
  return (
    <div className="wrap section">
      <div className="prose">
        <div className="eyebrow">Bring it to the workbench</div>
        <h1>What has stopped working?</h1>
        <p>
          Give us the symptoms and the steps you have tried. A useful answer
          starts with a clear description.
        </p>
        <RequestForm />
      </div>
    </div>
  );
}
