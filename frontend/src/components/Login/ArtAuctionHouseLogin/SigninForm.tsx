import React, { useState } from 'react';
import useTownController from '../../../hooks/useTownController';
import { signInWithEmailAndPassword } from 'firebase/auth';
import auth from '../../../classes/FirestoreConfig';
import { Box, useToast } from '@chakra-ui/react';
import { Button, Input, Heading } from '@chakra-ui/react';

export default function SigninForm(): JSX.Element {
  const toast = useToast();
  const townController = useTownController();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const sendLoginCommand = (e: string, p: string) => {
    try {
      signInWithEmailAndPassword(auth, e, p)
        .then(() => {
          townController.once('loginStatus', success => {
            if (success) {
              toast({
                title: 'Log in',
                description: `You have successfully logged in as ${email}.`,
                status: 'info',
              });
            } else {
              toast({
                title: 'User already logged in!',
                description: `There is a user already logged in with this information elsewhere. Please try a different account.`,
                status: 'info',
              });
            }
          });
          townController.sendLoginCommand(email);
        })
        .catch(err => {
          console.log('Sign in error: ', err);
          toast({
            title: 'Error logging in.',
            description: 'There was a server error in logging you in.',
            status: 'info',
          });
        });
    } catch (err) {
      if (err instanceof Error) {
        console.log(err.message);
      }
    }
  };

  return (
    <Box>
      <Heading as='h2' fontSize='xl' style={{ marginTop: 10, marginBottom: 10 }}>
        Login
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
                title: 'Log in failed',
                description: `You are already logged in!`,
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
