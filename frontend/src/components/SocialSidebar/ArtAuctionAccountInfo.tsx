import React, { useState } from 'react';
import useTownController from '../../hooks/useTownController';
import {
  Box,
  Button,
  Heading,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { Artwork } from '../../types/CoveyTownSocket';
import UserArtworks from './UserArtworks';

type Props = {
  userEmail: string;
  userMoney: number;
  userArtworks: Artwork[];
};
export default function ArtAuctionAccountInfo({
  userEmail,
  userMoney,
  userArtworks,
}: Props): JSX.Element {
  return (
    <Box>
      <Heading as='h3' fontSize='m' style={{ marginTop: 10, marginBottom: 10 }}>
        {' '}
        email: {userEmail}
      </Heading>
      <Heading as='h3' fontSize='m' style={{ marginTop: 10, marginBottom: 10 }}>
        {' '}
        money: {userMoney}
      </Heading>
      <UserArtworks userArtworks={userArtworks} />
    </Box>
  );
}

export function ArtAuctionAccountInfoWrapper(): JSX.Element {
  const townController = useTownController();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [buttonIsShown, setButtonIsShown] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userMoney, setUserMoney] = useState(0);
  const [userArtworks, setUserArtworks] = useState([] as Artwork[]);

  townController.addListener('loginStatus', success => {
    if (success) {
      setButtonIsShown(true);
    }
  });
  townController.addListener('userLogoutStatus', success => {
    if (success) {
      setButtonIsShown(false);
    }
  });
  townController.addListener('loginStatus', success => {
    if (success) {
      if (townController.ourPlayer.artAuctionAccount) {
        setUserEmail(townController.ourPlayer.artAuctionAccount?.email);
        setUserMoney(townController.ourPlayer.artAuctionAccount.wallet.money);
        setUserArtworks(townController.ourPlayer.artAuctionAccount.wallet.artwork);
      }
    }
  });

  return (
    <Box>
      {buttonIsShown ? (
        <Button
          style={{ width: '100%' }}
          onClick={() => {
            setModalIsOpen(true);
            townController.pause();
          }}>
          Account Information
        </Button>
      ) : (
        <></>
      )}
      <Modal
        isOpen={modalIsOpen}
        onClose={() => {
          setModalIsOpen(false);
          townController.unPause();
        }}
        closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Account Information</ModalHeader>
          <ModalCloseButton />
          <ArtAuctionAccountInfo
            userEmail={userEmail}
            userMoney={userMoney}
            userArtworks={userArtworks}
          />
        </ModalContent>
      </Modal>
    </Box>
  );
}
