import { useAddress, useMetamask, useEditionDrop, useToken, useVote, useNetwork } from '@thirdweb-dev/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
// @mui
import { styled } from '@mui/material/styles';
import { Card, Link, Container, Typography, Button, CircularProgress, Grid } from '@mui/material';
// hooks
import useResponsive from '../hooks/useResponsive';
// components
import Page from '../components/Page';
import Logo from '../components/Logo';
// sections
// import { LoginForm } from '../sections/auth/login';
// import AuthSocial from '../sections/auth/AuthSocial';

// ----------------------------------------------------------------------

const RootStyle = styled('div')(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    display: 'flex',
  },
}));

const HeaderStyle = styled('header')(({ theme }) => ({
  top: 0,
  zIndex: 9,
  lineHeight: 0,
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  position: 'absolute',
  padding: theme.spacing(3),
  justifyContent: 'space-between',
  [theme.breakpoints.up('md')]: {
    alignItems: 'flex-start',
    padding: theme.spacing(7, 5, 0, 7),
  },
}));

const SectionStyle = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 464,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  margin: theme.spacing(2, 0, 2, 2),
}));

const ContentStyle = styled('div')(({ theme }) => ({
  maxWidth: 480,
  margin: 'auto',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'column',
  padding: theme.spacing(12, 0),
}));

// ----------------------------------------------------------------------

export default function Login() {
  const navigate = useNavigate();
  const address = useAddress();
  const connectWithMetamask = useMetamask();
  const editionDrop = useEditionDrop('0x1d8DEAABa02D93c9C5Df2dAE28274ec745e25DeB');

  const [isLoading, setIsLoading] = useState(false);
  const [hasClaimedNFT, setHasClaimedNFT] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const mdUp = useResponsive('up', 'md');

  useEffect(() => {
    // If they don't have an connected wallet, exit!
    if (!address) {
      return;
    }

    const checkBalance = async () => {
      setIsLoading(true);
      try {
        const balance = await editionDrop.balanceOf(address, 0);
        if (balance.gt(0)) {
          setIsLoading(false);
          setHasClaimedNFT(true);
          console.log('🌟 this user has a membership NFT!');
          navigate('/dashboard/app', { replace: true });
        } else {
          setIsLoading(false);
          setHasClaimedNFT(false);
          console.log("😭 this user doesn't have a membership NFT.");
        }
      } catch (error) {
        setIsLoading(false);
        setHasClaimedNFT(false);
        console.error('Failed to get balance', error);
      }
    };
    checkBalance();
  }, [address, editionDrop]);

  const mintNft = async () => {
    try {
      setIsClaiming(true);
      await editionDrop.claim('0', 1);
      console.log(
        `🌊 Successfully Minted! Check it out on OpenSea: https://testnets.opensea.io/assets/${editionDrop.getAddress()}/0`
      );
      setHasClaimedNFT(true);
      navigate('/dashboard/app', { replace: true });
    } catch (error) {
      setHasClaimedNFT(false);
      console.error('Failed to mint NFT', error);
    } finally {
      setIsClaiming(false);
    }
  };

  console.log(address);

  return (
    <Page title="Login">
      <RootStyle>
        <HeaderStyle>
          <Logo />
        </HeaderStyle>

        {mdUp && (
          <SectionStyle>
            <Typography variant="h3" sx={{ px: 5, mt: 10, mb: 5 }}>
              Hi, Welcome Back
            </Typography>
            <img src="/static/illustrations/illustration_login.png" alt="login" />
          </SectionStyle>
        )}

        <Container maxWidth="sm">
          {isLoading ? (
            <ContentStyle>
              <Grid container direction="row" justifyContent="center" alignItems="center">
                <CircularProgress />
              </Grid>
            </ContentStyle>
          ) : (
            <ContentStyle>
              {!address ? (
                <>
                  <Typography variant="h4" gutterBottom>
                    Sign in to CigarDAO
                  </Typography>

                  <Typography sx={{ color: 'text.secondary', mb: 5 }}>Connect your wallet.</Typography>

                  <Button
                    onClick={connectWithMetamask}
                    fullWidth
                    size="large"
                    type="submit"
                    variant="contained"
                    loading={false}
                  >
                    Connect your walet
                  </Button>
                </>
              ) : (
                <>
                  <h1>Mint your DAO Cigar Membership NFT 💪</h1>
                  <Typography sx={{ color: 'text.secondary', mb: 5 }}>
                    The Cigar NFT is required to enter the DAO
                  </Typography>
                  <Button onClick={mintNft} fullWidth size="large" type="submit" variant="contained" loading={false}>
                    {isClaiming ? 'Minting...' : 'Mint Cigar NFT'}
                  </Button>
                </>
              )}
            </ContentStyle>
          )}
        </Container>
      </RootStyle>
    </Page>
  );
}
