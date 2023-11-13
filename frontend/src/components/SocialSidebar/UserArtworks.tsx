import React from "react"
import { Artwork } from "../../types/CoveyTownSocket"
import { Box, Heading, Image, StackDivider, VStack } from "@chakra-ui/react"
type Props = {
    userArtworks: Artwork[]
  }
export default function UserArtworks({userArtworks}: Props): JSX.Element {
    return (
    <VStack
      align='left'
      spacing={2}
      border='2px'
      padding={2}
      marginLeft={2}
      borderColor='gray.500'
      height='100%'
      divider={<StackDivider borderColor='gray.200' />}
      borderRadius='4px'>

        {userArtworks.map((artwork: Artwork) => {
            return (
            <Box>
                <Heading as='h2' fontSize='lg'>{artwork.id}</Heading>
                <Image src={artwork.primaryImage} alt="not found"></Image>
            </Box>
            )}
        )}

    </VStack>
    )
}