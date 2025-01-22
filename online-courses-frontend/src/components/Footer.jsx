import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background-color: #34495e;
  color: #ecf0f1;
  padding: 1rem;
  text-align: center;
`;

function Footer() {
  return (
    <FooterContainer>
      <p>&copy; 2023 Online Courses. All rights reserved.</p>
    </FooterContainer>
  );
}

export default Footer;