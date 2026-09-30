import { settings } from "@/lib/data";
import { SettingsForm } from "@/components/admin-controls";
export default async function Settings() {
  return (
    <>
      <h1>Site settings</h1>
      <SettingsForm value={{ ...(await settings()) }} />
      <div className="notice">
        Analytics, Search Console verification, optional challenge keys and ad
        account IDs are deployment environment variables. See DEPLOYMENT.md.
        Optional third-party services require visitor consent.
      </div>
    </>
  );
}
