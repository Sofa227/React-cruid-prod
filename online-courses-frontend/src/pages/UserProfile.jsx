import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const ProfileContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2980b9;
  }
`;

function UserProfile() {
  const [profile, setProfile] = useState({ username: '', email: '', role: '' });
  const [newPassword, setNewPassword] = useState('');
  const { userRole } = useContext(AuthContext);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:3000/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProfile = { ...profile };
      if (newPassword) {
        updatedProfile.password = newPassword;
      }
      await axios.put('http://localhost:3000/profile', updatedProfile, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Profile updated successfully');
      setNewPassword('');
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  return (
    <ProfileContainer>
      <h1>User Profile</h1>
      <Form onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Username"
          value={profile.username}
          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          required
        />
        <Input
          type="password"
          placeholder="New Password (leave blank to keep current)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <p>Role: {profile.role}</p>
        <Button type="submit">Update Profile</Button>
      </Form>
    </ProfileContainer>
  );
}

export default UserProfile;

