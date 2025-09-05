import { VscMenu } from "react-icons/vsc";

interface Props {
  handleMenuOpen: () => void;
}

const BurgerMenu: React.FC<Props> = ({ handleMenuOpen }) => {
  return (
    <button onClick={handleMenuOpen}>
      <VscMenu color="#fff" size={20} />
    </button>
  );
};

export default BurgerMenu;
