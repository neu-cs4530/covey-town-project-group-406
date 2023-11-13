import React, { useState } from 'react';
import useTownController from '../../hooks/useTownController';
import { signOut } from 'firebase/auth';
import auth from '../../classes/FirestoreConfig';
import { Box, Button, Heading, useToast } from '@chakra-ui/react';
import { blue } from '@material-ui/core/colors';
import { Artwork } from '../../types/CoveyTownSocket';
import UserArtworks from './UserArtworks';

export default function ArtAuctionAccountInfo(): JSX.Element {
  const townController = useTownController();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('')
  const [userMoney, setUserMoney] = useState(0)
  const [userArtworks, setUserArtworks] = useState([] as Artwork[])

  townController.addListener('loginStatus', success => {
    if (success) {
      if (townController.ourPlayer.artAuctionAccount) {
        setUserEmail(townController.ourPlayer.artAuctionAccount?.email)
        setUserMoney(townController.ourPlayer.artAuctionAccount.wallet.money)
        setUserArtworks(townController.ourPlayer.artAuctionAccount.wallet.artwork)
        setIsLoggedIn(true)
      }
    }
  })

  townController.addListener('userLogoutStatus', success => {
    if (success) {
      setIsLoggedIn(false);
    }
  })

  if (isLoggedIn) {
    return (
      <Box>
        <Heading as='h3' fontSize='m' style={{marginTop: 10, marginBottom: 10}}> currently signed in as {userEmail}</Heading>
        <Heading as='h3' fontSize='m' style={{marginTop: 10, marginBottom: 10}}> money: {userMoney}</Heading>
        <UserArtworks userArtworks={userArtworks}/>
      </Box>
    );
  } else {
    return (
      <Box>
        <Heading as='h3' fontSize='m'>Currently not signed in</Heading>
      </Box>
    )
  }

}