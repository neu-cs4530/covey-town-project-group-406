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
  const [confirmPass, setConfirmPass] = useState('');

  const sendLoginCommand = (e: string, p: string) => {
    createUserWithEmailAndPassword(auth, e, p)
      .then(() => {
        townController.once('loginStatus', success => {
          if (success) {
            toast({
              title: 'Sign up successful!',
              description: `You have successfully signed up and are now logged in as ${email}.`,
              status: 'info',
            });
          } else {
            toast({
              title: 'User already logged in',
              description: `There is a user already logged in with this information elsewhere. Please try a different account.`,
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
        console.log('Sign up error: ', err);
        toast({
          title: 'User creation not successful.',
          description: 'There was a server error in signing up.',
          status: 'info',
        });
      });
  };

  const sendSignUpCommand = (e: string, p: string, cp: string) => {
    if (p !== cp) {
      toast({
        title: "Your passwords don't match!",
        description: `Please try again with the same passwords.`,
        status: 'info',
      });
    } else {
      sendLoginCommand(e, p);
    }
  };

  return (
    <Box>
      <Heading as='h2' fontSize='xl' style={{ marginTop: 10, marginBottom: 10 }}>
        Signup
      </Heading>
      <Box className='input-container'>
        <label>Email </label>
        <Input
          style={{ backgroundColor: 'navajowhite' }}
          type='text'
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </Box>
      <Box className='input-container'>
        <label>Password </label>
        <Input
          style={{ backgroundColor: 'navajowhite' }}
          type='password'
          value={pass}
          onChange={e => setPass(e.target.value)}
        />
      </Box>
      <Box className='input-container'>
        <label>Confirm Password </label>
        <Input
          style={{ backgroundColor: 'navajowhite' }}
          type='password'
          value={confirmPass}
          onChange={e => setConfirmPass(e.target.value)}
        />
      </Box>
      <Box className='button-container'>
        <Button
          onClick={() => {
            if (!townController.ourPlayer?.artAuctionAccount) {
              sendSignUpCommand(email, pass, confirmPass);
              // sendLoginCommand(email, pass);
            } else {
              toast({
                title: 'Log in failed',
                description: `You are already logged in!`,
                status: 'info',
              });
            }
          }}
          style={{
            width: '100%',
            marginTop: 10,
            marginBottom: 10,
            border: '1px solid',
            borderColor: 'darkGrey',
          }}>
          Submit
        </Button>
      </Box>
    </Box>
  );
}
