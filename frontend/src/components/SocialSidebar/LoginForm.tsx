import React, { useState } from 'react';
import useTownController from '../../hooks/useTownController';
import { signInWithEmailAndPassword } from 'firebase/auth';
import auth from '../../classes/FirestoreConfig';

export default function LoginForm(): JSX.Element {
  const townController = useTownController();
  townController.addListener('loginStatus', success => {
    console.log(success);
  });
  const sendLoginCommand = (email: string, pass: string) => {
    try {
      signInWithEmailAndPassword(auth, email, pass);
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
