import AuthCard from "@/components/AuthCard";

export const metadata = {
  title: "Autenticación - Finanzapp",
  description: "Inicia sesión o crea una cuenta en Finanzapp",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <AuthCard />
    </div>
  );
}
