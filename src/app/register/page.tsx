import { Header } from "@/components/Header";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="app-shell">
      <Header />
      <main className="form-page">
        <RegisterForm />
      </main>
    </div>
  );
}
