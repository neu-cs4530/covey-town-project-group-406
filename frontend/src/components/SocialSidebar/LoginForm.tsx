import React, { useState } from 'react';
import useTownController from '../../hooks/useTownController';
import { signInWithEmailAndPassword } from 'firebase/auth';
import auth from '../../classes/FirestoreConfig';
import { useToast } from '@chakra-ui/react';
import { Button, Input, Heading } from '@chakra-ui/react';

export default function LoginForm(): JSX.Element {
  const toast = useToast();
  const townController = useTownController();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [isShown, setIsShown] = useState(true);

  townController.addListener('loginStatus', success => {
    if (success) {
      setIsShown(false);
    } else {
      setIsShown(true);
    }
  })

  townController.addListener('userLogoutStatus', success => {
    if (success) {
      setIsShown(true);
    } else {
      setIsShown(false);
    }
  })


  

  const sendLoginCommand = (email: string, pass: string) => {
    try {
      signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
          townController.once('loginStatus', success => {
            if (success) {
              toast({
                title: 'login',
                description: `you have successfully logged in as ${email}`,
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
          townController.sendLoginCommand(email);
        })
        .catch(err => {
          toast({
            title: 'error logging in',
            description: `${err.message}`,
            status: 'info',
          });
        });
    } catch (err) {
      if (err instanceof Error) {
        console.log(err.message);
      }
    }
  };

  if (isShown) {
    return (
      <>
      <Button style={{marginTop: 10, marginBottom: 10}}onClick={() => setIsShown(!isShown)}>Login</Button>
        <div className='input-container'>
          <label>Username </label>
          <Input
            style={{backgroundColor: 'lightblue' }}
            type='text'
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div className='input-container'>
          <label>Password </label>
          <Input
            style={{ backgroundColor: 'lightblue' }}
            type='password'
            value={pass}
            onChange={e => setPass(e.target.value)}
          />
        </div>
        <div className='button-container'>
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
            style={{ width: '100%', marginTop: 10, marginBottom: 10}}>
            submit
          </Button>
        </div>
      </>
    );
  } else {
    return <></>
  }

}
