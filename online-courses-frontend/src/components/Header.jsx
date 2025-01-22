import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaGraduationCap, FaUser } from 'react-icons/fa';
import AuthContext from '../context/AuthContext';

const HeaderContainer = styled.header`
  background-color: #2c3e50;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  color: #ecf0f1;
  font-size: 1.5rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: 1rem;
`;

const NavLink = styled(Link)`
  color: #ecf0f1;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #34495e;
  }
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: #ecf0f1;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #34495e;
  }
`;

function Header() {
  const { isAuthenticated, logout } = useContext(AuthContext);

  return (
    <HeaderContainer>
      <Logo to="/">
        <FaGraduationCap />
        Online Courses
      </Logo>
      <Nav>
        {isAuthenticated ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/profile">
              <FaUser /> Profile
            </NavLink>
            <LogoutButton onClick={logout}>Logout</LogoutButton>
          </>
        ) : (
          <>
            <NavLink to="/login">
              <FaUser /> Login
            </NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </Nav>
    </HeaderContainer>
  );
}

export default Header;

