import React, { useState } from 'react';
import useTownController from '../../hooks/useTownController';
import {
  Box,
  Button,
  Divider,
  ListItem,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  OrderedList,
} from '@chakra-ui/react';
import { Artwork } from '../../types/CoveyTownSocket';
import { Typography } from '@material-ui/core';
import UserArtwork from './UserArtwork';

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
  const getNetWorth = (): number => {
    let netWorth = userMoney;
    for (const userArtwork of userArtworks) {
      netWorth += userArtwork.purchasePrice;
    }
    return netWorth;
  };

  return (
    <Box style={{ padding: 30, paddingTop: 10 }}>
      <Typography variant='h6' style={{ marginBottom: 10 }}>
        <strong>Email</strong>: {userEmail}
      </Typography>
      <Typography variant='h6' style={{ marginBottom: 10 }}>
        <strong>Balance</strong>: ${userMoney.toLocaleString()}
      </Typography>
      <Typography variant='h6' style={{ marginBottom: 10 }}>
        <strong>Net Worth</strong>: ${getNetWorth().toLocaleString()}
      </Typography>
      <Typography variant='h5' style={{ marginTop: 20, marginBottom: 10, fontWeight: 600 }}>
        <strong>Your Art Collection</strong>
      </Typography>
      <Divider />
      <div style={{ marginTop: 10 }}>
        {userArtworks.length === 0 ? (
          <Typography variant='subtitle1'>
            You don not own any artworks right now. Try bidding on some pieces in the Art Auction
            House!
          </Typography>
        ) : (
          <OrderedList>
            {userArtworks.map((ua, idx) => (
              <ListItem style={{ marginBottom: 10 }} key={idx}>
                <UserArtwork artwork={ua} />
              </ListItem>
            ))}
          </OrderedList>
        )}
      </div>
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
  townController.addListener('artAccountUpdated', account => {
    setUserArtworks(account.wallet.artwork);
    setUserMoney(account.wallet.money);
  });

  return (
    <Box>
      {buttonIsShown && (
        <Button
          style={{ width: '100%' }}
          onClick={() => {
            setModalIsOpen(true);
            townController.pause();
          }}>
          Account Information
        </Button>
      )}
      <Modal
        isOpen={modalIsOpen}
        onClose={() => {
          setModalIsOpen(false);
          townController.unPause();
        }}
        closeOnOverlayClick={false}
        size={'6xl'}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader style={{ fontSize: 42, fontWeight: 700 }}>Account Information</ModalHeader>
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
