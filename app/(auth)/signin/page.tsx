"use client";

import { singin } from "@/app/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Signin() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await singin({
        name,
        password,
      });

      router.push("/dashboard");
    } catch (error) {
      alert("Error");
    }
  }
  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={password} onChange={(e) => setPassword(e.target.value)} />
      <button>Login</button>
    </form>
  );
}
