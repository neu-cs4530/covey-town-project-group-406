import React, { useState } from 'react';
import useTownController from '../../hooks/useTownController';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import auth from '../../classes/FirestoreConfig';
import { useToast } from '@chakra-ui/react';

export default function SignupForm(): JSX.Element {
  const toast = useToast();
  const townController = useTownController();
  const sendLoginCommand = (email: string, pass: string) => {
    createUserWithEmailAndPassword(auth, email, pass)
      .then(() => {
        toast({
          title: 'user creation successful',
          description: `you have created your account and are now logged in as: ${email}`,
          status: 'info',
        });
        townController.ourPlayer.artAuctionAccount = {
          email: email,
          wallet: { money: 1000000, networth: 1000000, artwork: [] },
        };
        townController.sendLoginCommand();
      })
      .catch(err => {
        toast({
          title: 'user creation not successful',
          description: `${err.message}`,
          status: 'info',
        });
      });
  };

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  return (
    <>
      <div className='input-container'>
        <h1>Signup</h1>
        <label>Username </label>
        <input type='text' value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className='input-container'>
        <label>Password </label>
        <input type='password' value={pass} onChange={e => setPass(e.target.value)} />
      </div>
      <div className='button-container'>
        <button onClick={() => sendLoginCommand(email, pass)}>submit</button>
      </div>
    </>
  );
}
