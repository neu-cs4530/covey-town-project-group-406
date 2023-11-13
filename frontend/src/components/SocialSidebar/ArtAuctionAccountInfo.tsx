import React, { useState } from 'react';
import useTownController from '../../hooks/useTownController';
import { signOut } from 'firebase/auth';
import auth from '../../classes/FirestoreConfig';
import { Button, Heading, useToast } from '@chakra-ui/react';
import { blue } from '@material-ui/core/colors';
import { Artwork } from '../../types/CoveyTownSocket';

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
      <div style={{borderStyle: 'solid', borderColor: 'blue', borderWidth: 1, padding: 5, margin: 5}}>
        <Heading style={{marginTop: 10, marginBottom: 10}}> currently signed in as {userEmail}</Heading>
        <Heading style={{marginTop: 10, marginBottom: 10}}> money: {userMoney}</Heading>
        {userArtworks.map(artwork => <Heading style={{marginTop: 10, marginBottom: 10}}> artwork: {artwork.id}</Heading>)}

      </div>
    );
  } else {
    return (
      <div style={{borderStyle: 'solid', borderColor: 'blue', borderWidth: 1, padding: 5, margin: 5}}>
        <Heading>Currently not signed in</Heading>
      </div>
    )
  }

}