import styled from "styled-components";
import Link from "next/link";

import HomeIcon from "../public/icons/home.svg";
import TransactionsIcon from "../public/icons/transactions.svg";
import AddIcon from "../public/icons/add.svg";
import CategoriesIcon from "../public/icons/categories.svg";
import ProfileIcon from "../public/icons/profile.svg";

export default function Navbar() {
  return (
    <Wrapper>
      <NavbarMenu>
        <NavbarItem $expanded $isActive>
          <Link href="#home">
            <IconWrapper $isActive>
              <HomeIcon width={100} height={100} />
            </IconWrapper>
          </Link>
        </NavbarItem>

        <NavbarItem $expanded>
          <Link href="#transactions">
            <IconWrapper>
              <TransactionsIcon width={100} height={100} />
            </IconWrapper>
          </Link>
        </NavbarItem>

        <NavbarItem $expanded>
          <Link href="#add">
            <IconWrapper>
              <AddIcon width={100} height={100} />
            </IconWrapper>
          </Link>
        </NavbarItem>

        <NavbarItem $expanded>
          <Link href="#categories">
            <IconWrapper>
              <CategoriesIcon width={100} height={100} />
            </IconWrapper>
          </Link>
        </NavbarItem>

        <NavbarItem $expanded>
          <Link href="#profile">
            <IconWrapper>
              <ProfileIcon width={100} height={100} />
            </IconWrapper>
          </Link>
        </NavbarItem>
      </NavbarMenu>
    </Wrapper>
  );
}

const Wrapper = styled.nav`
  display: flex;
  justify-content: space-between;
  background-color: var(--button-background-color);
  padding: 10px 0;
  position: fixed;
  bottom: 0;
  width: 100%;
`;

const NavbarMenu = styled.ul`
  list-style: none;
  display: flex;
  flex: 1;
  justify-content: space-between;
  margin: 0;
  padding: 0;
`;

const NavbarItem = styled.li`
  flex: ${(props) => (props.$expanded ? 2 : 1)};
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  transition: transform 0.2s ease-in-out, background-color 0.3s;

  /* Setze die Hintergrundfarbe basierend auf dem aktiven Zustand */
  background-color: ${(props) =>
    props.$isActive
      ? "var(--button-active-color)"
      : "var(--button-background-color)"};

  &:hover {
    transform: scale(1.1); /* Vergrößert den gesamten Navbar-Bereich leicht */
  }
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

  svg {
    fill: ${(props) =>
      props.$isActive
        ? "var(--button-active-text-color)"
        : "var(--button-text-color)"};
    width: 24px;
    height: 24px;
  }
`;
