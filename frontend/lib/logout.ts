import { useRouter } from "next/navigation";
import { clearCart } from "@/lib/cart";

export const useLogout = () => {
  const router = useRouter();

  const logout = () => {
    // Clear customer cart and authentication state
    clearCart();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");

    // Redirect to login
    router.push("/login");
  };

  return { logout };
};
