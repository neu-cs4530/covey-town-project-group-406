import React from 'react';
import useTownController from '../../hooks/useTownController';
import { signOut } from 'firebase/auth';
import auth from '../../classes/FirestoreConfig';
import { Button, useToast } from '@chakra-ui/react';

export default function LogoutButton(): JSX.Element {
  const toast = useToast();
  const townController = useTownController();
  const logout = (email: string) => {
    townController.once('userLogoutStatus', success => {
      if (success) {
        toast({
          title: 'log out success',
          description: `you are no longer logged in as ${email}`,
          status: 'info',
        });
      } else {
        toast({
          title: 'log out failed',
          description: `not sure tbh`,
          status: 'info',
        });
      }
    });
    signOut(auth)
      .then(() => {
        townController.sendLogoutCommand(email);
      })
      .catch(error => {
        toast({
          title: 'log out failed',
          description: `${error}`,
          status: 'info',
        });
      });
  };

  return (
    <Button
    style={{marginTop: 10, marginBottom: 10}}
      onClick={() => {
        if (townController.ourPlayer?.artAuctionAccount) {
          console.log('logging out');
          logout(townController.ourPlayer.artAuctionAccount.email);
        } else {
          toast({
            title: 'logout failed',
            description: `you are not logged in`,
            status: 'info',
          });
        }
      }}>
      logout
    </Button>
  );

  /**/
}
