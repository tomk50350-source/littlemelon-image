import { Header } from "@/components/Header";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="app-shell">
      <Header />
      <main className="form-page">
        <LoginForm />
      </main>
    </div>
  );
}
