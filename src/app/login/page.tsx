import SignInCard from "@/components/SignIn";

export const metadata = {
  title: "Iniciar Sesión - Finanzapp",
  description: "Inicia sesión en tu cuenta de Finanzapp",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <SignInCard />
    </div>
  );
}
