import useTownController from '../../hooks/useTownController';
import React from 'react';
import auth from '../../classes/FirestoreConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import LoginForm from './LoginForm';

export default function AuctionHouseLogin(): JSX.Element {
  // if the user creates an account or tries to log in, then do that and send the sendLoginCommand so
  // the server can update the database value
  return <LoginForm />;
}
