import React, { useState } from 'react';
import useTownController from '../../hooks/useTownController';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import auth from '../../classes/FirestoreConfig';
import { useToast } from '@chakra-ui/react';

export default function LoginForm(): JSX.Element {
  const toast = useToast();
  const townController = useTownController();
  const sendLoginCommand = (email: string, pass: string) => {
    try {
      createUserWithEmailAndPassword(auth, email, pass);
      toast({
        title: 'login successful',
        description: `you have logged in as: ${email}`,
        status: 'info',
      });
    } catch (err) {
      if (err instanceof Error) {
        console.log(err.message);
      }
    }
    townController.sendLoginCommand();
  };
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  return (
    <>
      <div className='input-container'>
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
