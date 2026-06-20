import { PageHeader } from "@/components/ui/page-header";
import { ProfileCard } from "@/components/profile/profile-card";

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profil" description="Vos informations personnelles et votre organisation active." />
      <ProfileCard />
    </>
  );
}
