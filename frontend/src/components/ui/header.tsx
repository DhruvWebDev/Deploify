"use client";

import React, { useState } from "react";
import { HoveredLink, Menu, MenuItem } from "@/components/ui/floating-navbar";
import { cn } from "@/lib/utils";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";

export function Navbar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const { isSignedIn, user } = useUser();

  return (
    <div className={cn("fixed top-10 inset-x-0 max-w-2xl mx-auto z-50", className)}>
      <Menu setActive={setActive} className="bg-black/50 backdrop-blur-md border border-white/[0.2] rounded-full">
        <MenuItem setActive={setActive} active={active} item="Home">
          <HoveredLink href="/" className="text-white hover:text-blue-400 transition-colors">Home</HoveredLink>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="About">
          <HoveredLink href="/about" className="text-white hover:text-blue-400 transition-colors">About Us</HoveredLink>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Pricing">
          <HoveredLink href="/Pricing" className="text-white hover:text-blue-400 transition-colors">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/hobby">Hobby</HoveredLink>
            <HoveredLink href="/individual">Individual</HoveredLink>
            <HoveredLink href="/team">Team</HoveredLink>
          </div>
          </HoveredLink>
          
        </MenuItem>
        
        {isSignedIn && (
          <MenuItem setActive={setActive} active={active} item="Dashboard">
            <HoveredLink href="/dashboard" className="text-white hover:text-blue-400 transition-colors">Dashboard</HoveredLink>
          </MenuItem>
        )}
        <MenuItem setActive={setActive} active={active} item="Login">
          <div className="flex flex-col space-y-4 text-sm">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="text-white hover:text-blue-400 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            ) : (
              <>
                <span className="text-gray-400">
                  Hello, {user.firstName || user.username}
                </span>
                <SignOutButton>
                  <button className="text-white hover:text-red-400 transition-colors">
                    Sign Out
                  </button>
                </SignOutButton>
              </>
            )}
          </div>
        </MenuItem>
        {/* <MenuItem setActive={setActive} active={active} item={<ModeToggle />}>
        <ModeToggle />
        </MenuItem> */}
      </Menu>
    </div>
  );
}

export function NavbarDemo() {
  return (
    <div className="relative w-full flex items-center justify-center">
      <Navbar className="top-2" />
      <p className="text-white">
        The Navbar will show on top of the page
      </p>
    </div>
  );
}