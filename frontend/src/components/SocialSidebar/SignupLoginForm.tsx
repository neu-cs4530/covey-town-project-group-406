import React, { useEffect, useState } from 'react';
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalContent,
  ModalOverlay,
  ModalCloseButton,
} from '@chakra-ui/react';
import useTownController from '../../hooks/useTownController';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

export default function SingupLoginWrapper(): JSX.Element {
  const [modalIsOpen, setModalIsOpen] = useState(true);
  const townController = useTownController();

  useEffect(() => {
    if (modalIsOpen) {
      townController.pause();
    }
  }, [modalIsOpen, townController]);

  townController.addListener('loginStatus', success => {
    if (success) {
      setModalIsOpen(false);
      townController.unPause();
    }
  });

  townController.addListener('userLogoutStatus', success => {
    if (success) {
      townController.unPause();
    } else {
      setModalIsOpen(false);
    }
  });
  return (
    <Modal
      isOpen={modalIsOpen}
      onClose={() => {
        setModalIsOpen(false);
        townController.unPause();
      }}
      closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <Tabs>
          <TabList>
            <Tab>Login</Tab>
            <Tab>Signup</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <LoginForm />
            </TabPanel>
            <TabPanel>
              <SignupForm />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ModalContent>
    </Modal>
  );
}
