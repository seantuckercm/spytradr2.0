
// app/(dashboard)/settings/page.tsx
import { PageHeader } from '@/components/shared/page-header';
import { SettingsForm } from '@/components/settings/settings-form';
import { AlertConfigForm } from '@/components/settings/alert-config-form';
import { getCurrentProfile } from '@/lib/auth/clerk';

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />

      <SettingsForm profile={profile} />
      <AlertConfigForm />
    </div>
  );
}
