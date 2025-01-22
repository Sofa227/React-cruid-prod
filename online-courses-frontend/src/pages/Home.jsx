import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const HomeContainer = styled.div`
  text-align: center;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-bottom: 2rem;
`;

const CTAButton = styled(Link)`
  background-color: #3498db;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2980b9;
  }
`;

function Home() {
  return (
    <HomeContainer>
      <Title>Welcome to Online Courses</Title>
      <Subtitle>Expand your knowledge with our wide range of courses</Subtitle>
      {/* <CTAButton to="/courses">Explore Courses</CTAButton> */}
    </HomeContainer>
  );
}

export default Home;

