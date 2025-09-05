import { HeaderSection } from "../types/sharedInterfaces";
import routes from "./routes";

export const headerSections: (locale: string) => HeaderSection[] = (locale) => [
  {
    id: 1,
    name: "Home",
    link: `${routes.home}/${locale}`,
  },
  {
    id: 2,
    name: "PvCivil",
    link: routes.pvcivil,
  },
];
