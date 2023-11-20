import {
  Button,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  UnorderedList,
  ListItem,
  Divider,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { Typography } from '@material-ui/core';
import React, { useCallback, useEffect, useState } from 'react';
import AuctionHouseAreaController from '../../../classes/interactable/AuctionHouseAreaController';
import { useInteractable } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import { AuctionFloorArea, AuctionHouseArea } from '../../../types/CoveyTownSocket';
import ArtworkDisplay from './AuctionHouse/ArtworkDisplay';
import AuctionFloorCard from './AuctionHouse/AuctionFloorCard';
import AuctionHouseAreaInteractable from './AuctionHouseArea';
import SignupSignIn from '../../Login/ArtAuctionHouseLogin/SignupSignIn';

function AuctionHouseComponent({
  controller,
}: {
  controller: AuctionHouseAreaController;
}): JSX.Element {
  const [floors, setFloors] = useState<AuctionFloorArea[]>([]);
  const [auctionHouseOccupants, setAuctionHouseOccupants] = useState(controller.occupants);
  const [selectedFloor, setSelectedFloor] = useState<AuctionFloorArea | undefined>();
  const townController = useTownController();

  useEffect(() => {
    const handleChanged = (model: AuctionHouseArea) => {
      setFloors(model.floors);
      setAuctionHouseOccupants(controller.occupants);
    };

    controller.addListener('interactableAreaChanged', handleChanged);
    townController.createAuctionHouseArea({
      id: 'Art Auction House',
      occupants: [],
    });

    return () => {
      controller.removeListener('interactableAreaChanged', handleChanged);
    };
  }, [controller, townController]);

  const handleAuctionMyArtwork = () => {
    console.log('User wants to auction their artwork');
  };

  const handleLogout = () => {
    console.log('User logged out');
  };

  const getAuctionStatus = (floor: AuctionFloorArea) => {
    if (floor.status === 'IN_PROGRESS') {
      return <Badge colorScheme='green'>Auction in progress</Badge>;
    } else if (floor.status === 'WAITING_TO_START') {
      return <Badge colorScheme='purple'>Waiting to start the auction</Badge>;
    } else {
      return <Badge colorScheme='red'>Auction ended</Badge>;
    }
  };

  // TODO - send command to backend that user joined the floor
  const handleFloorSelect = (floor: AuctionFloorArea) => {
    setSelectedFloor(floor);
  };

  return (
    <div>
      {selectedFloor ? (
        <div style={{ padding: 30, display: 'flex', flexDirection: 'column' }}>
          <Button
            colorScheme='teal'
            size='md'
            style={{ width: 100 }}
            onClick={() => setSelectedFloor(undefined)}>
            Back
          </Button>

          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              paddingTop: 40,
              gap: 20,
            }}>
            <div
              style={{
                width: '50%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'left',
              }}>
              <ArtworkDisplay artwork={selectedFloor.artBeingAuctioned} />
            </div>
            <div style={{ width: '50%' }}>
              <div>
                <Typography variant='h4' style={{ display: 'inline', fontWeight: 700 }}>
                  Auction Space
                </Typography>
                <div style={{ display: 'inline', float: 'inline-end' }}>
                  {getAuctionStatus(selectedFloor)}
                </div>
              </div>

              <Divider />

              <Typography variant='subtitle1' style={{ fontWeight: 400, marginTop: 15 }}>
                Users currently on the same floor
              </Typography>
              <UnorderedList>
                {selectedFloor.observers.map((o, idx) => (
                  <ListItem key={idx}>{o.userName}</ListItem>
                ))}
              </UnorderedList>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ paddingLeft: 30, paddingRight: 30 }}>
          <Typography variant='subtitle1'>
            Welcome to the art auction house! You can view an artwork by clicking on the art and
            join the auction for the art too. All auctions require a minimum of 3 bidders to start.
          </Typography>
          <Typography variant='subtitle1' style={{ marginTop: 15, fontWeight: 300 }}>
            Currently, there are {auctionHouseOccupants.length - 1} other users in the auction
            house.
          </Typography>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'left',
              marginTop: 30,
              gap: 10,
            }}>
            <Button colorScheme='teal' size='md' onClick={handleAuctionMyArtwork}>
              Auction my artwork
            </Button>
            <Button colorScheme='teal' variant='outline' size='md' onClick={handleLogout}>
              Logout
            </Button>
          </div>
          <div>
            {floors.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignContent: 'center',
                  gap: 20,
                  justifyContent: 'center',
                  padding: 30,
                }}>
                <Typography variant='h6'>Loading</Typography>
                <Spinner
                  thickness='4px'
                  speed='0.65s'
                  emptyColor='gray.200'
                  color='blue.500'
                  size='xl'
                />
              </div>
            ) : (
              <div
                style={{
                  paddingTop: 30,
                  paddingBottom: 30,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 20,
                }}>
                {floors.map((floor, idx) => (
                  <AuctionFloorCard key={idx} floor={floor} handleClick={handleFloorSelect} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuctionHouseAreaWrapper(): JSX.Element {
  const auctionHouseArea = useInteractable<AuctionHouseAreaInteractable>('auctionHouseArea');
  const townController = useTownController();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (auctionHouseArea) {
      townController.pause();
    } else {
      townController.unPause();
    }
  }, [townController, auctionHouseArea]);

  townController.addListener('loginStatus', success => {
    if (success) {
      setIsLoggedIn(true);
    }
  });

  townController.addListener('userLogoutStatus', success => {
    if (success) {
      setIsLoggedIn(false);
    }
  });

  const closeModal = useCallback(() => {
    if (auctionHouseArea) {
      townController.interactEnd(auctionHouseArea);
      // const controller = townController.getAuctionHouseAreaController(auctionHouseArea);
      // controller.leaveGame();
    }
  }, [townController, auctionHouseArea]);

  if (auctionHouseArea && auctionHouseArea.getData('type') === 'AuctionHouse') {
    return (
      <Modal
        isOpen={true}
        onClose={() => {
          closeModal();
          townController.unPause();
        }}
        closeOnOverlayClick={false}
        size='6xl'
        >
        <ModalOverlay />
        <ModalContent>
          {isLoggedIn ? (
            <>
              <ModalHeader style={{ fontSize: 42, fontWeight: 700 }}>{auctionHouseArea.name}</ModalHeader>
              <ModalCloseButton />
              <AuctionHouseComponent
                controller={townController.getAuctionHouseAreaController(auctionHouseArea)}
              />
            </>
          ) : (
            <>
              <ModalCloseButton />
              <SignupSignIn />
            </>
          )}
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
