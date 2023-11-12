import React, { useState } from 'react';
import useTownController from '../../hooks/useTownController';
import { signOut } from 'firebase/auth';
import auth from '../../classes/FirestoreConfig';
import { Button, Heading, useToast } from '@chakra-ui/react';
import { blue } from '@material-ui/core/colors';

export default function ArtAuctionAccountInfo(): JSX.Element {
  const townController = useTownController();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('')
  townController.addListener('loginStatus', success => {
    if (success) {
      if (townController.ourPlayer.artAuctionAccount) {
        setUser(townController.ourPlayer.artAuctionAccount?.email)
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
        <Heading> currently signed in as {user}</Heading>
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