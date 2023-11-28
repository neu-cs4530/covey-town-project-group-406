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

/**
 * The ArtAuctionHouse Area component renders the Art Auction House
 *
 * It renders a login/ signup screen
 *
 * Once logged in, displays current user information (email and balance), buttons to auction artwork and logout,
 * and at least 5 auction floor cards which a user can join using buttons as a bidder or observer
 *
 * If joining as an observer, it will render a screen with the artwork and addition information about the artwork
 * and information about the bidding: current bidder, starting price, current price, list of observers, list of bidders, time left
 * there is also basic user info at the top with a back button to go back to the auction house
 *
 * If joining as an bidder, a dropdown and slider will appear with range min bid price - user's balance which they can
 * use to make bids and submit those bids using a make bid button which will only work when the bidding is in progress
 *
 * If users click the Auction my artwork button, it renders a list of their artworks with a button and a dropdown next to each
 * of them allowing them to set a price and add the artwork to the auction house
 * Once added, it renders a new floor card which behaves the same as the others except that the user is able to take down their own artwork from auction
 */
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
            if (f.bidders.find(b => b.userName === townController.ourPlayer.userName)) {
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
            }
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

    // sets the selected floor and bid amount as the floor's min bid price
    const handleFloorJoined = (floor: AuctionFloorArea) => {
      setSelectedFloor(floor);
      setBidAmount(floor.minBid);
    };

    // sets the selected floor to be undefined
    const handleFloorLeft = () => {
      setSelectedFloor(undefined);
    };

    // sets the user's money to their new money amount and adds new artworks to the userArtwork
    const handleArtAccountUpdated = (account: ArtAuctionAccount) => {
      setUserMoney(account.wallet.money);
      setUserArtwork([...account.wallet.artwork]);
    };

    // if the selected floor is taken down, sets it to undefined
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

  // sets isAuctioningArtwork to true
  const handleAuctionMyArtwork = () => {
    setIsAuctioningArtwork(true);
  };

  // puts up artwork for auction
  const handlePutForAuction = async (a: Artwork, bid: number) => {
    await controller.auctionOurArtwork(a, bid);
  };

  // takes down auction floor associated with the given artwork
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

  // joins floor, if joining as a bidder, checks if user is a valid bidder for this floor
  const handleFloorSelect = async (floor: AuctionFloorArea, asBidder: boolean) => {
    if (asBidder) {
      if (
        (floor.currentBid === undefined && userMoney <= floor.minBid) ||
        (floor.currentBid !== undefined && userMoney <= floor.currentBid.bid)
      ) {
        toast({
          title: 'Could not join the floor as a bidder.',
          description: 'You do not have enough money!',
          status: 'info',
        });
        return;
      }
    }
    await controller.joinFloor(floor, asBidder);
  };

  // leaves given floor
  const handleFloorUnselect = async (floor: AuctionFloorArea) => {
    await controller.leaveFloor(floor);
  };

  // returns if our player is a bidder
  const weAreBidder = () => {
    if (selectedFloor?.bidders.find(b => b.id === townController.ourPlayer.id) !== undefined) {
      return true;
    }
    return false;
  };

  // makes bid if user can bid and it is a valid bid, otherwise renders a toast with the issue
  const handleMakeBid = async (floor: AuctionFloorArea, bid: number) => {
    if (canBid) {
      if (floor.currentBid?.bid !== undefined && floor.currentBid.bid >= bid) {
        toast({
          title: 'Could not make the bid',
          description: `You must place a bid higher than the current bid of ${floor.currentBid.bid.toLocaleString()}`,
          status: 'info',
        });
        return;
      } else if (floor.minBid > bid) {
        toast({
          title: 'Could not make the bid',
          description: `You must place a bid higher than the minimum starting bid of ${floor.minBid.toLocaleString()}.`,
          status: 'info',
        });
        return;
      }

      await controller.makeBid(floor, bid);

      if (
        townController.ourPlayer.artAuctionAccount &&
        bid === townController.ourPlayer.artAuctionAccount.wallet.money
      ) {
        toast({
          title: 'Caution!',
          description: `You are bidding ALL your money.`,
          status: 'warning',
        });
      }
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

/**
 * A wrapper component for the AuctionHouseArea component
 * Determins if the user is logged in, if they are, renders the ArtAuctionHouse component,
 * else renders a login/sign up modal
 */
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
