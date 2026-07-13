/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  navItems?: { name: string; url: string; icon: any }[];
  activeItem?: string;
  onChange?: (name: string) => void;
}

export default function Header({ navItems, activeItem, onChange }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header className="bg-[#f9f8f4] text-[#1a1a1a] border-b border-[#1a1a1a]/15 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 sm:gap-4">
            <img src="/logo.png" alt="Asli Taana Logo" className="h-12 sm:h-16 w-auto object-contain" />
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a]">Asli Taana</span>
          </div>

          {/* Mobile Burger Menu Button */}
          {navItems && navItems.length > 0 && (
            <div className="sm:hidden flex items-center">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="p-2 text-[#1a1a1a] border border-[#1a1a1a]/10 rounded-none bg-white shadow-xs"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          )}

        </div>
      </div>
      
      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && navItems && (
        <div className="sm:hidden bg-[#f9f8f4]/70 backdrop-blur-xl border-t border-[#1a1a1a]/10 px-4 py-4 shadow-xl absolute w-full z-40">
          <ul className="flex flex-col gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <button
                    className={`flex items-center gap-3 w-full p-3.5 text-left font-serif text-sm border transition-all rounded-xl backdrop-blur-md ${
                      activeItem === item.name 
                        ? "bg-white/90 text-[#137333] border-[#137333]/30 font-bold shadow-sm" 
                        : "bg-white/40 text-[#1a1a1a]/80 border-white/40 shadow-sm hover:bg-white/60"
                    }`}
                    onClick={() => {
                      if (onChange) onChange(item.name);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Decorative Thin Traditional Pattern border strip instead of modern gradient */}
      <div className="h-0.5 w-full bg-[#b45309] opacity-90 relative z-50"></div>
    </header>
  );
}

