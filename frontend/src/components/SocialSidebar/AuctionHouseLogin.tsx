import React from 'react';
import LoginForm from './LoginForm';
import LogoutButton from './LogoutButton';
import SignupForm from './SignupForm';

export default function AuctionHouseLogin(): JSX.Element {
  // if the user creates an account or tries to log in, then do that and send the sendLoginCommand so
  // the server can update the database value
  return (
    <>
      <SignupForm />
      <LoginForm />
      <LogoutButton />
    </>
  );
}
