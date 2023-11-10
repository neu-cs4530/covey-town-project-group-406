import React, { useState } from 'react';
import useTownController from '../../hooks/useTownController';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import auth from '../../classes/FirestoreConfig';
import { Heading, useToast } from '@chakra-ui/react';
import { Button, Input } from '@chakra-ui/react';

export default function SignupForm(): JSX.Element {
  const toast = useToast();
  const townController = useTownController();

  const sendLoginCommand = (email: string, pass: string) => {
    createUserWithEmailAndPassword(auth, email, pass)
      .then(() => {
        townController.once('loginStatus', success => {
          if (success) {
            toast({
              title: 'sign up successful',
              description: `you have successfully signed up and are now logged in as ${email}`,
              status: 'info',
            });
          } else {
            toast({
              title: 'user already logged in',
              description: `there is a user already logged in with this information elsewhere`,
              status: 'info',
            });
          }
        });
        townController.once('createUserStatus', success => {
          if (success) {
            townController.sendLoginCommand(email);
          }
        });
        townController.sendSignupCommand(email);
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
        <Heading>Signup</Heading>
        <label>Username </label>
        <Input
          style={{ color: 'blue', backgroundColor: 'red' }}
          type='text'
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      <div className='input-container'>
        <label>Password </label>
        <Input
          style={{ color: 'blue', backgroundColor: 'red' }}
          type='password'
          value={pass}
          onChange={e => setPass(e.target.value)}
        />
      </div>
      <div className='button-container'>
        <Button
          onClick={() => {
            if (!townController.ourPlayer.artAuctionAccount) {
              sendLoginCommand(email, pass);
            } else {
              toast({
                title: 'login failed',
                description: `you are already logged in`,
                status: 'info',
              });
            }
          }}>
          submit
        </Button>
      </div>
    </>
  );
}
