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
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { Typography } from '@material-ui/core';
import { signOut } from 'firebase/auth';
import React, { useCallback, useEffect, useState } from 'react';
import AuctionHouseAreaController from '../../../../classes/interactable/AuctionHouseAreaController';
import { useInteractable } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { AuctionFloorArea } from '../../../../types/CoveyTownSocket';
import AuctionHouseAreaInteractable from '../AuctionHouseArea';
import SignupSignIn from '../../../Login/ArtAuctionHouseLogin/SignupSignIn';
import AuctionFloorCard from './AuctionFloorCard';
import ArtworkDisplay from './ArtworkDisplay';
import auth from '../../../../classes/FirestoreConfig';

function ArtAuctionHouseArea({
  controller,
}: {
  controller: AuctionHouseAreaController;
}): JSX.Element {
  const toast = useToast();
  const [floors, setFloors] = useState<AuctionFloorArea[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<AuctionFloorArea | undefined>();
  const [bidAmount, setBidAmount] = useState(0);
  const townController = useTownController();

  useEffect(() => {
    const handleFloorsChanged = (newFloors: AuctionFloorArea[]) => {
      setFloors(newFloors);
      for (const f of newFloors) {
        console.log('we are on floor', selectedFloor?.id);
        console.log('floor with id is now', f.id);
        if (f.id === selectedFloor?.id) {
          console.log('found floor');
          if (f.timeLeft === 0) {
            setSelectedFloor(undefined);
          }
        }
      }
    };

    const handleFloorJoined = (floor: AuctionFloorArea) => {
      setSelectedFloor(floor);
    };

    const handleFloorLeft = () => {
      setSelectedFloor(undefined);
    };

    controller.addListener('floorsChanged', handleFloorsChanged);
    controller.addListener('floorJoined', handleFloorJoined);
    controller.addListener('floorLeft', handleFloorLeft);

    townController.createAuctionHouseArea({
      id: 'Art Auction House',
      occupants: [],
    });

    return () => {
      controller.removeListener('floorsChanged', handleFloorsChanged);
      controller.removeListener('floorJoined', handleFloorJoined);
      controller.removeListener('floorLeft', handleFloorLeft);
    };
  }, [controller, townController, selectedFloor?.id]);

  // TODO
  const handleAuctionMyArtwork = () => {
    console.log('User wants to auction their artwork');
  };

  // logs the user out of the auction house
  const handleLogout = () => {
    const email = townController.ourPlayer.artAuctionAccount?.email;
    if (email !== undefined) {
      townController.once('userLogoutStatus', success => {
        if (success) {
          toast({
            title: 'Log out success!',
            description: `You are no longer logged in as ${email}`,
            status: 'info',
          });
        } else {
          toast({
            title: 'Log out failed',
            description: `Logging out did not work!`,
            status: 'error',
          });
        }
      });
      signOut(auth)
        .then(() => {
          townController.sendLogoutCommand(email);
        })
        .catch(error => {
          toast({
            title: 'Log out failed',
            description: `${error}`,
            status: 'error',
          });
        });
    }
  };

  // gets the selected floor from all the floors
  // USE THIS method when using updateFrom and handleCommand
  const getSelectedFloor = (): AuctionFloorArea | undefined => {
    if (selectedFloor !== undefined) {
      const selFloor = floors.find(f => f.id === selectedFloor.id);
      if (selFloor) {
        return selFloor;
      }
    }
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

  const getCurrentBid = (floor: AuctionFloorArea) => {
    if (floor.status === 'WAITING_TO_START') {
      return (
        <Typography variant='subtitle1' style={{ fontWeight: 400, fontSize: 24 }}>
          <strong>Starting bid</strong>: ${floor.minBid.toLocaleString()}
        </Typography>
      );
    } else if (floor.status === 'IN_PROGRESS' && floor.currentBid !== undefined) {
      return (
        <Typography variant='subtitle1' style={{ fontWeight: 400, fontSize: 24 }}>
          <strong>Current bid</strong>: ${floor.currentBid.bid.toLocaleString()}
          <br />
          <strong>User</strong>: ${floor.currentBid.player}
        </Typography>
      );
    } else {
      return (
        <Typography variant='subtitle1' style={{ fontWeight: 400, fontSize: 24 }}>
          <strong>Winning bid</strong>: ${floor.currentBid?.bid.toLocaleString()}
          <br />
          <strong>User</strong>: ${floor.currentBid?.player}
        </Typography>
      );
    }
  };

  const handleFloorSelect = async (floor: AuctionFloorArea, asBidder: boolean) => {
    await controller.joinFloor(floor, asBidder);
  };

  const handleFloorUnselect = async (floor: AuctionFloorArea) => {
    await controller.leaveFloor(floor);
  };

  return (
    <div>
      <Typography variant='subtitle1' style={{ padding: 30, paddingTop: 15, fontWeight: 300 }}>
        You are logged in as: {townController.ourPlayer.artAuctionAccount?.email}
        <br />
        You have a balance of: $
        {townController.ourPlayer.artAuctionAccount?.wallet.money.toLocaleString()}
      </Typography>
      {selectedFloor !== undefined ? (
        <div style={{ padding: 30, paddingTop: 5, display: 'flex', flexDirection: 'column' }}>
          <Button
            colorScheme='teal'
            size='md'
            style={{ width: 100 }}
            onClick={async () => {
              await handleFloorUnselect(selectedFloor);
            }}>
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
                  {getAuctionStatus(getSelectedFloor() as AuctionFloorArea)}
                </div>
              </div>
              <Divider />
              <Typography
                variant='subtitle1'
                style={{ fontWeight: 400, marginTop: 15, fontSize: 24 }}>
                <strong>Auctioneer</strong>:{' '}
                {selectedFloor.auctioneer
                  ? selectedFloor.auctioneer.artAuctionAccount?.email
                  : 'Auction House'}
              </Typography>
              {getCurrentBid(selectedFloor)}
              <Typography
                variant='subtitle1'
                style={{ fontWeight: 400, marginTop: 5, fontSize: 18 }}>
                Users currently on the same floor
              </Typography>
              observers
              <UnorderedList>
                {getSelectedFloor()?.observers.map((o, idx) => (
                  <ListItem key={idx}>{o.artAuctionAccount?.email}</ListItem>
                ))}
              </UnorderedList>
              bidders
              <UnorderedList>
                {getSelectedFloor()?.bidders.map((o, idx) => (
                  <ListItem key={idx}>{o.artAuctionAccount?.email}</ListItem>
                ))}
              </UnorderedList>
              <div>
                time left
                {getSelectedFloor()?.timeLeft}
              </div>
              <NumberInput
                onChange={valueString => setBidAmount(Number(valueString))}
                value={bidAmount}
                max={townController.ourPlayer.artAuctionAccount?.wallet.money}>
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Button>Make Bid!</Button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ paddingLeft: 30, paddingRight: 30 }}>
          <Typography variant='subtitle1'>
            Welcome to the art auction house! You can view an artwork by clicking on the art and
            join the auction for the art too. All auctions require a minimum of 3 bidders to start.
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
                  <AuctionFloorCard
                    key={idx}
                    floor={floor}
                    handleClickJoinObserver={async () => {
                      await handleFloorSelect(floor, false);
                    }}
                    handleClickJoinFloorBidder={async () => {
                      await handleFloorSelect(floor, true);
                    }}
                  />
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
        size={isLoggedIn ? '6xl' : 'xl'}>
        <ModalOverlay />
        <ModalContent>
          {isLoggedIn ? (
            <>
              <ModalHeader style={{ fontSize: 42, fontWeight: 700 }}>
                {auctionHouseArea.name}
              </ModalHeader>
              <ModalCloseButton />
              <ArtAuctionHouseArea
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
