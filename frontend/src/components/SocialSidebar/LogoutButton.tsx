import React, { useState } from 'react';
import useTownController from '../../hooks/useTownController';
import { signOut } from 'firebase/auth';
import auth from '../../classes/FirestoreConfig';
import { Button, useToast } from '@chakra-ui/react';

export default function LogoutButton(): JSX.Element {
  const toast = useToast();
  const townController = useTownController();
  const [isShown, setIsShown] = useState(false);

  townController.addListener('loginStatus', success => {
    if (success) {
      setIsShown(true);
    } else {
      setIsShown(false);
    }
  });

  townController.addListener('userLogoutStatus', success => {
    if (success) {
      setIsShown(false);
    } else {
      setIsShown(true);
    }
  });

  const logout = (email: string) => {
    townController.once('userLogoutStatus', success => {
      if (success) {
        toast({
          title: 'Log out success!',
          description: `You are no longer logged in as ${email}.`,
          status: 'info',
        });
      } else {
        toast({
          title: 'Log out failed',
          description: `There was a server error in logging you out.`,
          status: 'info',
        });
      }
    });
    signOut(auth)
      .then(() => {
        townController.sendLogoutCommand(email);
      })
      .catch(error => {
        console.log('Log out error: ', error);
        toast({
          title: 'Log out failed',
          description: 'There was a server error in logging you out.',
          status: 'info',
        });
      });
  };

  if (isShown) {
    return (
      <Button
        style={{ marginTop: 10, marginBottom: 10 }}
        onClick={() => {
          if (townController.ourPlayer?.artAuctionAccount) {
            logout(townController.ourPlayer.artAuctionAccount.email);
          } else {
            toast({
              title: 'Log out failed',
              description: `You are not logged in! Please try again.`,
              status: 'info',
            });
          }
        }}>
        Log out
      </Button>
    );
  } else {
    return (
      <Button
        style={{ marginTop: 10, marginBottom: 10 }}
        onClick={() => {
          // TODO - add SignupSignin modal
        }}>
        Log in
      </Button>
    );
  }

  /**/
}
