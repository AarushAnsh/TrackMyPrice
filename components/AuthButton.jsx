"use client";

import { useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { AuthModal } from "./AuthModal";
import { signOut } from "@/app/actions";

const AuthButton = ({ user }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (user) {
    return (
      <form action={signOut}>
        <Button
          variant="outline"
          size="sm"
          type="submit"
          className="gap-2 font-semibold"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </form>
    );
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="gap-2 font-semibold"
        onClick={() => setShowAuthModal(true)}
      >
        <LogIn className="h-4 w-4" />
        Sign In
      </Button>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default AuthButton;
