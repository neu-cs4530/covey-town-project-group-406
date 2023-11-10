import useTownController from '../../hooks/useTownController';
import React from 'react';
import auth from '../../classes/FirestoreConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function AuctionHouseLogin(): JSX.Element {
  const townController = useTownController();
  townController.addListener('loginStatus', () => {
    console.log('user logged in!');
  });
  const sendLoginCommand = () => {
    createUserWithEmailAndPassword(auth, 'dummy@gmail.com', 'bs');
    townController.sendLoginCommand();
  };
  return <button onClick={sendLoginCommand}>Login</button>;
}
