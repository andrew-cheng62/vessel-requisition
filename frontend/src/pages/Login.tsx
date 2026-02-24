import { useState } from "react";
import api from "../api/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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

      localStorage.setItem("token", res.data.access_token);
      window.location.href = "/items"; // TEMP redirect
    } catch {
      alert("Invalid credentials");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input placeholder="username" onChange={e => setUsername(e.target.value)} />{" "}
      <Input type="password" placeholder="password" onChange={e => setPassword(e.target.value)} />{" "}
      <Button variant= "primary" type="submit">Login</Button>
    </form>
  );
}