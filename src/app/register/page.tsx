"use client";

import { useState } from "react";
import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  const [mode, setMode] = useState<"login" | "register">("register");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <AuthForm mode={mode} onModeChange={setMode} />
    </div>
  );
}