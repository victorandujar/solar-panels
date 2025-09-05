"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import routes from "@/app/utils/routes";
import BurgerMenu from "../BurgerMenu/BurgerMenu";

interface Props {
  handleMenuOpen: VoidFunction;
}

const Header: React.FC<Props> = ({ handleMenuOpen }) => {
  const path = usePathname();
  const { locale } = useParams();
  const router = useRouter();

  const handleLogoClick = () => {
    return path === `/${locale}`
      ? window.scrollTo({ top: 0, behavior: "smooth" })
      : router.push(routes.home);
  };

  return (
    <header className="sticky top-0 z-50 bg-transparent backdrop-blur-lg flex items-center justify-between p-4 pr-8 mobile:w-full">
      <button onClick={handleLogoClick}>
        <h1 className="text-5xl font-bold  text-black font-audiowide">
          Solar Panels
        </h1>
      </button>
      <BurgerMenu handleMenuOpen={handleMenuOpen} />
    </header>
  );
};

export default Header;
