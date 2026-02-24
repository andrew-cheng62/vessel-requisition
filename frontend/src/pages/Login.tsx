import { useState } from "react";
import api from "../api/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { FormLayout } from "../components/layout/FormLayout";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const res = await api.post("/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      login(res.data.access_token);

    } catch {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-md">
        <FormLayout onSubmit={handleSubmit}>
          <h2 className="text-2xl font-semibold text-center mb-6">
            Sign in
          </h2>

          <Input
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button variant="ghost" type="submit" className="w-full">
            Login
          </Button>
        </FormLayout>
      </div>
    </div>
  );
}