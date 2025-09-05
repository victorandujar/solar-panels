"use client";

import { useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";

import Header from "../Header/Header";
import SideBar from "../SideBar/SideBar";
import { AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  const router = useRouter();

  const handleMenuOpen = () => {
    if (isSidebarVisible) {
      setTimeout(() => setSidebarVisible(false), 500);
    } else {
      setSidebarVisible(true);
    }
  };

  const handleMenuSectionClick = (section: string) => {
    router.push(section);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Header handleMenuOpen={handleMenuOpen} />
      <AnimatePresence>
        {isSidebarVisible && (
          <SideBar
            key="sidebar"
            handleMenuOpen={handleMenuOpen}
            handleMenuSectionClick={handleMenuSectionClick}
          />
        )}
      </AnimatePresence>
      <div className="flex justify-center h-full">{children}</div>
    </div>
  );
};

export default Layout;
