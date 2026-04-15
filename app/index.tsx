import { useAuth } from "@/contexts/auth-context";
import { Redirect } from "expo-router";

export default function Index() {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Redirect href="/(dashboard)/dashboard" />;
  } else {
    return <Redirect href="/login" />;
  }
}
