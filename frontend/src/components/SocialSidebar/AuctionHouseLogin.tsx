import useTownController from '../../hooks/useTownController';
import React from 'react';
import auth from '../../classes/FirestoreConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function AuctionHouseLogin(): JSX.Element {
  const townController = useTownController();
  townController.addListener('loginStatus', () => {
    console.log('user logged in!');
  });
  // if the user creates an account or tries to log in, then do that and send the sendLoginCommand so
  // the server can update the database value
  const sendLoginCommand = () => {
    try {
      createUserWithEmailAndPassword(auth, 'dummy@gmail.com', 'bsstopthatbullshit');
    } catch (err) {
      if (err instanceof Error) {
        console.log(err.message);
      }
    }
    townController.sendLoginCommand();
  };
  return <button onClick={sendLoginCommand}>Login</button>;
}
