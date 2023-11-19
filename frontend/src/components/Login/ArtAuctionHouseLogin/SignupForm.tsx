import React, { useState } from 'react';
import useTownController from '../../../hooks/useTownController';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import auth from '../../../classes/FirestoreConfig';
import { Box, Heading, useToast } from '@chakra-ui/react';
import { Button, Input } from '@chakra-ui/react';

export default function SignupForm(): JSX.Element {
  const toast = useToast();
  const townController = useTownController();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const sendLoginCommand = (e: string, p: string) => {
    createUserWithEmailAndPassword(auth, e, p)
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

  return (
    <Box>
      <Heading as='h2' fontSize='xl' style={{ marginTop: 10, marginBottom: 10 }}>
        Signup
      </Heading>
      <Box className='input-container'>
        <label>Email </label>
        <Input
          style={{ backgroundColor: 'lightblue' }}
          type='text'
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </Box>
      <Box className='input-container'>
        <label>Password </label>
        <Input
          style={{ backgroundColor: 'lightblue' }}
          type='password'
          value={pass}
          onChange={e => setPass(e.target.value)}
        />
      </Box>
      <Box className='button-container'>
        <Button
          onClick={() => {
            if (!townController.ourPlayer?.artAuctionAccount) {
              sendLoginCommand(email, pass);
            } else {
              toast({
                title: 'login failed',
                description: `you are already logged in`,
                status: 'info',
              });
            }
          }}
          style={{ width: '100%', marginTop: 10, marginBottom: 10 }}>
          Submit
        </Button>
      </Box>
    </Box>
  );
}
