import {
  Button,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { Typography } from '@material-ui/core';
import { signOut } from 'firebase/auth';
import React, { useCallback, useEffect, useState } from 'react';
import AuctionHouseAreaController from '../../../../classes/interactable/AuctionHouseAreaController';
import { useInteractable } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { ArtAuctionAccount, Artwork, AuctionFloorArea } from '../../../../types/CoveyTownSocket';
import AuctionHouseAreaInteractable from '../AuctionHouseArea';
import SignupSignIn from '../../../Login/ArtAuctionHouseLogin/SignupSignIn';
import AuctionFloorCard from './AuctionFloorCard';
import ArtworkDisplay from './ArtworkDisplay';
import auth from '../../../../classes/FirestoreConfig';
import ArtworkAuctionSpace from './ArtworkAuctionSpace';
import AuctionOurArtworkArea from './AuctionOurArtworkArea';

function ArtAuctionHouseArea({
  controller,
}: {
  controller: AuctionHouseAreaController;
}): JSX.Element {
  const toast = useToast();
  const townController = useTownController();
  const [floors, setFloors] = useState<AuctionFloorArea[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<AuctionFloorArea | undefined>();
  const [bidAmount, setBidAmount] = useState(0);
  const [canBid, setCanBid] = useState(false);
  const [userMoney, setUserMoney] = useState(
    townController.ourPlayer.artAuctionAccount?.wallet.money as number,
  );
  const [isAuctioningArtwork, setIsAuctioningArtwork] = useState(false);
  const [userArtwork, setUserArtwork] = useState<Artwork[]>([]);

  useEffect(() => {
    const handleFloorsChanged = (newFloors: AuctionFloorArea[]) => {
      if (newFloors.find(f => f.id === selectedFloor?.id) === undefined) {
        setSelectedFloor(undefined);
      }
      setFloors(newFloors);
      for (const f of newFloors) {
        if (f.id === selectedFloor?.id) {
          if (f.status !== 'WAITING_TO_START') {
            setCanBid(true);
          }
          if (f.timeLeft === 0) {
            let toastDescription = 'You lost the auction :(';
            if (
              f.currentBid &&
              f.currentBid.player.artAuctionAccount?.email ===
                townController.ourPlayer.artAuctionAccount?.email
            ) {
              toastDescription =
                'You won the auction! You can view the art in your account information :)';
            }
            toast({
              title: 'The auction ended!',
              description: toastDescription,
              status: 'info',
            });
            setSelectedFloor(undefined);
            setCanBid(false);
          }
          f.bidders.map(b => {
            if (
              b.id === townController.ourPlayer.id &&
              townController.ourPlayer.artAuctionAccount?.wallet.artwork.length !==
                b.artAuctionAccount?.wallet.artwork.length
            ) {
              townController.ourPlayer.artAuctionAccount = b.artAuctionAccount;
            }
          });
        }
      }
    };

    const handleFloorJoined = (floor: AuctionFloorArea) => {
      setSelectedFloor(floor);
    };

    const handleFloorLeft = () => {
      setSelectedFloor(undefined);
    };

    const handleArtAccountUpdated = (account: ArtAuctionAccount) => {
      setUserMoney(account.wallet.money);
      setUserArtwork([...account.wallet.artwork]);
    };

    const handleFloorTakenDown = (floorID: string) => {
      if (selectedFloor?.id === floorID) {
        setSelectedFloor(undefined);
      }
    };

    controller.addListener('floorTakenDown', handleFloorTakenDown);
    controller.addListener('floorsChanged', handleFloorsChanged);
    controller.addListener('floorJoined', handleFloorJoined);
    controller.addListener('floorLeft', handleFloorLeft);
    townController.addListener('artAccountUpdated', handleArtAccountUpdated);

    townController.createAuctionHouseArea({
      id: 'Art Auction House',
      occupants: [],
    });

    return () => {
      controller.removeListener('floorsChanged', handleFloorsChanged);
      controller.removeListener('floorJoined', handleFloorJoined);
      controller.removeListener('floorLeft', handleFloorLeft);
      controller.removeListener('floorTakenDown', handleFloorTakenDown);
      townController.removeListener('artAccountUpdated', handleArtAccountUpdated);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, townController, selectedFloor?.id]);

  const handleAuctionMyArtwork = () => {
    setIsAuctioningArtwork(true);
  };

  const handlePutForAuction = async (a: Artwork, bid: number) => {
    await controller.auctionOurArtwork(a, bid);
  };

  const handleTakeDownAuction = async (a: Artwork) => {
    await controller.takeDownAuction(a);
  };

  // logs the user out of the auction house
  const handleLogout = () => {
    const email = townController.ourPlayer.artAuctionAccount?.email;
    if (email !== undefined) {
      townController.once('userLogoutStatus', success => {
        if (success) {
          toast({
            title: 'Log out success!',
            description: `You are no longer logged in as ${email}.`,
            status: 'info',
          });
        } else {
          toast({
            title: 'Log out failed.',
            description: `We were not able to log you out. Please try again.`,
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

  const handleFloorSelect = async (floor: AuctionFloorArea, asBidder: boolean) => {
    await controller.joinFloor(floor, asBidder);
  };

  const handleFloorUnselect = async (floor: AuctionFloorArea) => {
    await controller.leaveFloor(floor);
  };

  const weAreBidder = () => {
    if (selectedFloor?.bidders.find(b => b.id === townController.ourPlayer.id) !== undefined) {
      return true;
    }
    return false;
  };

  const handleMakeBid = async (floor: AuctionFloorArea, bid: number) => {
    if (canBid) {
      if (floor.currentBid?.bid !== undefined && floor.currentBid.bid >= bid) {
        toast({
          title: 'Could not make the bid',
          description: `You must place a bid higher than the current bid of ${floor.currentBid.bid.toLocaleString()}`,
          status: 'info',
        });
      } else if (floor.minBid >= bid) {
        toast({
          title: 'Could not make the bid',
          description: `You must place a bid higher than the minimum starting bid of ${floor.minBid.toLocaleString()}.`,
          status: 'info',
        });
      }

      await controller.makeBid(floor, bid);
      setBidAmount(0);
    } else {
      toast({
        title: 'Could not make the bid',
        description: 'The auction has not started! Please wait till the auction begins.',
        status: 'info',
      });
    }
  };

  return (
    <div>
      <Typography variant='subtitle1' style={{ padding: 30, paddingTop: 15, fontWeight: 300 }}>
        You are logged in as: {townController.ourPlayer.artAuctionAccount?.email}
        <br />
        You have a balance of: ${userMoney.toLocaleString()}
      </Typography>

      {isAuctioningArtwork ? (
        <div
          style={{ padding: 30, paddingTop: 5, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Typography variant='h5' style={{ fontWeight: 700 }}>
            Choose your artwork to auction
          </Typography>

          <Button
            colorScheme='teal'
            size='md'
            width={200}
            onClick={() => setIsAuctioningArtwork(false)}>
            Back to Auction House
          </Button>

          {townController.ourPlayer.artAuctionAccount?.wallet.artwork.length === 0 ? (
            <div>
              <Typography>
                You do not own any artwork. Try bidding for an artwork in the Art Auction house!
              </Typography>
            </div>
          ) : (
            townController.ourPlayer.artAuctionAccount && (
              <div>
                <AuctionOurArtworkArea
                  artworks={userArtwork}
                  auctionFloors={floors}
                  handlePutForAuction={handlePutForAuction}
                  handleTakeDownAuction={handleTakeDownAuction}
                />
              </div>
            )
          )}
        </div>
      ) : selectedFloor !== undefined ? (
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
              <ArtworkAuctionSpace
                selectedFloor={selectedFloor}
                bidAmount={bidAmount}
                userMoney={userMoney}
                getSelectedFloor={getSelectedFloor}
                handleMakeBid={handleMakeBid}
                setBidAmount={setBidAmount}
                weAreBidder={weAreBidder}
              />
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
                    weAreOwner={
                      userArtwork.find(a => a.id === floor.artBeingAuctioned.id) !== undefined
                    }
                    handleClickJoinObserver={async () => {
                      await handleFloorSelect(floor, false);
                    }}
                    handleClickJoinFloorBidder={async () => {
                      await handleFloorSelect(floor, true);
                    }}
                    handleTakeDownAuction={handleTakeDownAuction}
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
