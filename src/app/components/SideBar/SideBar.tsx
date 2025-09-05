"use client";

import { useLocale, useTranslations } from "next-intl";
import { RiCloseLargeFill } from "react-icons/ri";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FaRegCopyright } from "react-icons/fa";
import { motion } from "framer-motion";
import { headerSections } from "@/app/utils/headerSections";

interface Props {
  handleMenuOpen: () => void;
  handleMenuSectionClick: (value: string) => void;
}

const SideBar = ({
  handleMenuOpen,
  handleMenuSectionClick,
}: Props): React.ReactElement => {
  const path = usePathname();
  const locale = useLocale();

  return (
    <motion.nav
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="z-50 px-2 fixed top-0 right-0 w-80 h-screen bg-gradient-to-b from-transparent to-black/20 backdrop-blur-sm flex flex-col justify-between pb-5 border-l border-mainColor/40"
    >
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex items-center w-full h-fit p-5"
      >
        <div className="text-s flex justify-between items-center w-4/5">
          <span className="text-ms">Menu</span>
        </div>
        <button
          onClick={handleMenuOpen}
          className="absolute top-0 right-4 pt-5"
        >
          <RiCloseLargeFill size={25} color="#fff" />
        </button>
      </motion.div>
      <section className="flex flex-col gap-10 w-full">
        <ul className="flex flex-col w-full mt-16 rounded-xl">
          {headerSections(locale).map((section, index) => {
            const isHomePage =
              section.name === "Home" &&
              (path === `/${locale}` || path === `/${locale}/`);
            const isOtherPage =
              section.name !== "Home" &&
              section.link &&
              path.includes(section.link);
            const isHighlighted = isHomePage || isOtherPage;

            return (
              <motion.li
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.3, duration: 0.5 }}
                className={`w-full px-2 py-5 border-b border-mainColor/40 ${
                  isHighlighted && "font-bold text-mainColor uppercase"
                } hover:text-gray-300`}
                key={section.id}
              >
                <button
                  onClick={() => handleMenuSectionClick(section.name)}
                  className="flex items-center justify-between w-full tracking-wide text-l font-generalSans px-4"
                >
                  {section.link ? (
                    <Link
                      href={section.link}
                      className="flex items-center gap-4"
                    >
                      <span className="font-thin text-s">/0{section.id}</span>
                      {section.name}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-4">
                      <span className="font-thin text-s">/0{section.id}</span>
                      {section.name}
                    </div>
                  )}
                </button>
              </motion.li>
            );
          })}
        </ul>
        <div className="flex items-center justify-end gap-1 text-s pr-2">
          <FaRegCopyright />
          <span>Sunveon</span>
        </div>
      </section>
    </motion.nav>
  );
};

export default SideBar;
