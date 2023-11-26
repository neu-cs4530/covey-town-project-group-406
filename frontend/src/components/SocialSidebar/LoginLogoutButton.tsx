import React, { useState } from 'react';
import useTownController from '../../hooks/useTownController';
import { signOut } from 'firebase/auth';
import auth from '../../classes/FirestoreConfig';
import {
  Box,
  Button,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import SignupSignIn from '../Login/ArtAuctionHouseLogin/SignupSignIn';

export default function LoginLogoutButton(): JSX.Element {
  const toast = useToast();
  const townController = useTownController();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginModalIsOpen, setLoginModalIsOpen] = useState(false);

  townController.addListener('loginStatus', success => {
    if (success) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  });

  townController.addListener('userLogoutStatus', success => {
    if (success) {
      setIsLoggedIn(false);
    } else {
      setIsLoggedIn(true);
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

  if (isLoggedIn) {
    return (
      <Button
        style={{ marginTop: 10, marginBottom: 10, width: '100%' }}
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
      <Box style={{ display: 'flex', width: '100%' }}>
        <Button
          style={{ marginTop: 10, marginBottom: 10, width: '100%' }}
          onClick={() => {
            setLoginModalIsOpen(true);
            townController.pause();
          }}>
          Log in
        </Button>
        <Modal
          isOpen={loginModalIsOpen}
          onClose={() => {
            setLoginModalIsOpen(false);
            townController.unPause();
          }}
          closeOnOverlayClick={false}
          size={'xl'}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader style={{ fontSize: 42, fontWeight: 700 }}>Account Information</ModalHeader>
            <ModalCloseButton />
            <SignupSignIn />
          </ModalContent>
        </Modal>
      </Box>
    );
  }

  /**/
}
