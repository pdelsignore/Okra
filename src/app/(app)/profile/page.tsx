import { auth } from "@/lib/auth";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  return (
    <ProfileForm
      initialName={session?.user?.name ?? ""}
      email={session?.user?.email ?? ""}
    />
  );
}
