import { useAddress, useMetamask, useEditionDrop, useToken, useVote, useNetwork } from '@thirdweb-dev/react';
import { ChainId } from '@thirdweb-dev/sdk';
import { useState, useEffect, useMemo } from 'react';

import {
  Container,
  Button,
  Grid,
  Typography,
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from '@mui/material';

import { faker } from '@faker-js/faker';
import { useTheme } from '@mui/material/styles';
import Iconify from '../components/Iconify';

import {
  AppTasks,
  AppNewsUpdate,
  AppOrderTimeline,
  AppCurrentVisits,
  AppWebsiteVisits,
  AppTrafficBySite,
  AppWidgetSummary,
  AppCurrentSubject,
  AppConversionRates,
} from '../sections/@dashboard/app';

const DAO = () => {
  const theme = useTheme();

  const address = useAddress();
  const connectWithMetamask = useMetamask();
  //   console.log('👋 Address:', address);

  // Initialize token, vote and editionDrop contracts and network
  const network = useNetwork();
  const token = useToken('0x84fa17c04B1009f34e62468833cd428fA1813fB0');
  const vote = useVote('0x9237C8e1e544768F506AAD9a5E263A632235590c');
  const editionDrop = useEditionDrop('0x1d8DEAABa02D93c9C5Df2dAE28274ec745e25DeB');

  const [hasClaimedNFT, setHasClaimedNFT] = useState(false);
  const [treasury, setTreasury] = useState({});
  const [memberTokenAmounts, setMemberTokenAmounts] = useState([]);
  const [memberAddresses, setMemberAddresses] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // This useEffect grabs all the addresses of our members holding our NFT.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // Just like we did in the 7-airdrop-token.js file! Grab the users who hold our NFT
    // with tokenId 0.
    const getAllAddresses = async () => {
      try {
        const memberAddresses = await editionDrop.history.getAllClaimerAddresses(0);
        setMemberAddresses(memberAddresses);
        console.log('🚀 Members addresses', memberAddresses);
      } catch (error) {
        console.error('failed to get member list', error);
      }
    };
    getAllAddresses();
  }, [hasClaimedNFT, editionDrop.history]);

  // This useEffect grabs the # of token each member holds.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    const getAllBalances = async () => {
      try {
        const amounts = await token.history.getAllHolderBalances();
        setMemberTokenAmounts(amounts);
        const treasury = amounts?.find(({ holder }) => holder === '0x9237C8e1e544768F506AAD9a5E263A632235590c');
        setTreasury(treasury);
        // console.log('👜 Amounts', amounts);
      } catch (error) {
        console.error('failed to get member balances', error);
      }
    };
    getAllBalances();
  }, [hasClaimedNFT, token.history]);

  // Now, we combine the memberAddresses and memberTokenAmounts into a single array
  const memberList = useMemo(
    () =>
      memberAddresses.map((address) => {
        // We're checking if we are finding the address in the memberTokenAmounts array.
        // If we are, we'll return the amount of token the user has.
        // Otherwise, return 0.
        const member = memberTokenAmounts?.find(({ holder }) => holder === address);

        return {
          address,
          tokenAmount: member?.balance.displayValue || '0',
        };
      }),
    [memberAddresses, memberTokenAmounts]
  );

  useEffect(() => {
    // If they don't have an connected wallet, exit!
    if (!address) {
      return;
    }

    const checkBalance = async () => {
      try {
        const balance = await editionDrop.balanceOf(address, 0);
        if (balance.gt(0)) {
          setHasClaimedNFT(true);
          console.log('🌟 this user has a membership NFT!');
        } else {
          setHasClaimedNFT(false);
          console.log("😭 this user doesn't have a membership NFT.");
        }
      } catch (error) {
        setHasClaimedNFT(false);
        console.error('Failed to get balance', error);
      }
    };
    checkBalance();
  }, [address, editionDrop]);

  // Retrieve all our existing proposals from the contract.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // A simple call to vote.getAll() to grab the proposals.
    const getAllProposals = async () => {
      try {
        const proposals = await vote.getAll();
        setProposals(proposals);
      } catch (error) {
        console.log('failed to get proposals', error);
      }
    };
    getAllProposals();
  }, [hasClaimedNFT, vote]);

  // We also need to check if the user already voted.
  useEffect(() => {
    if (!hasClaimedNFT) {
      return;
    }

    // If we haven't finished retrieving the proposals from the useEffect above
    // then we can't check if the user voted yet!
    if (!proposals.length) {
      return;
    }

    const checkIfUserHasVoted = async () => {
      try {
        const hasVoted = await vote.hasVoted(proposals[0].proposalId, address);
        setHasVoted(hasVoted);
        if (hasVoted) {
          console.log('🥵 User has already voted');
        } else {
          console.log('🙂 User has not voted yet');
        }
      } catch (error) {
        console.error('Failed to check if wallet has voted', error);
      }
    };
    checkIfUserHasVoted();
  }, [hasClaimedNFT, proposals, address, vote]);

  //   console.log('network', network);
  //   console.log('ChainId', ChainId);

  // if (network?.[0].data?.chain?.id !== ChainId?.Rinkeby) {
  //   return (
  //     <div className="unsupported-network">
  //       <h2>Please connect to Rinkeby</h2>
  //       <p>
  //         This dapp only works on the Rinkeby network, please switch networks
  //         in your connected wallet.
  //       </p>
  //     </div>
  //   );
  // }

  // A fancy function to shorten someones wallet address, no need to show the whole thing.
  const shortenAddress = (str) => `${str.substring(0, 6)}...${str.substring(str.length - 4)}`;

  // FIX THIS
  const AddressZero = '0x000000000000000000000000000';

  return (
    <div className="member-page">
      <Typography variant="h4" gutterBottom>
        DAO Member Page
      </Typography>

      <Typography sx={{ color: 'text.secondary', mb: 5 }}>Congratulations on being a member!</Typography>

      <Container maxWidth="xl">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary title="Total Supply" total={1000000} icon={'mdi:bitcoin'} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary title="Treasury" total={treasury?.balance?.displayValue} color="info" icon={'mdi:bank'} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary title="Members" total={3} color="warning" icon={'mdi:account-group'} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary title="Proposals" total={2} color="error" icon={'mdi:comment-question'} />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h4" gutterBottom>
              Member List
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Address</TableCell>
                    <TableCell align="right"># of Tokens</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {memberList.map((member) => (
                    <TableRow key={member.address} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row">
                        {shortenAddress(member.address)}
                      </TableCell>
                      <TableCell align="right">{member.tokenAmount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
              Active Proposals
            </Typography>
            <Paper sx={{ mb: 3, p: 2 }}>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // before we do async things, we want to disable the button to prevent double clicks
                  setIsVoting(true);

                  // lets get the votes from the form for the values
                  const votes = proposals.map((proposal) => {
                    const voteResult = {
                      proposalId: proposal.proposalId,
                      // abstain by default
                      vote: 2,
                    };
                    proposal.votes.forEach((vote) => {
                      const elem = document.getElementById(`${proposal.proposalId}-${vote.type}`);

                      if (elem.checked) {
                        voteResult.vote = vote.type;
                      }
                    });
                    return voteResult;
                  });

                  // first we need to make sure the user delegates their token to vote
                  try {
                    // we'll check if the wallet still needs to delegate their tokens before they can vote
                    const delegation = await token.getDelegationOf(address);
                    // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
                    if (delegation === AddressZero) {
                      // if they haven't delegated their tokens yet, we'll have them delegate them before voting
                      await token.delegateTo(address);
                    }
                    // then we need to vote on the proposals
                    try {
                      await Promise.all(
                        votes.map(async ({ proposalId, vote: _vote }) => {
                          // before voting we first need to check whether the proposal is open for voting
                          // we first need to get the latest state of the proposal
                          const proposal = await vote.get(proposalId);
                          // then we check if the proposal is open for voting (state === 1 means it is open)
                          if (proposal.state === 1) {
                            // if it is open for voting, we'll vote on it
                            return vote.vote(proposalId, _vote);
                          }
                          // if the proposal is not open for voting we just return nothing, letting us continue
                        })
                      );
                      try {
                        // if any of the propsals are ready to be executed we'll need to execute them
                        // a proposal is ready to be executed if it is in state 4
                        await Promise.all(
                          votes.map(async ({ proposalId }) => {
                            // we'll first get the latest state of the proposal again, since we may have just voted before
                            const proposal = await vote.get(proposalId);

                            // if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                            if (proposal.state === 4) {
                              return vote.execute(proposalId);
                            }
                          })
                        );
                        // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
                        setHasVoted(true);
                        // and log out a success message
                        console.log('successfully voted');
                      } catch (err) {
                        console.error('failed to execute votes', err);
                      }
                    } catch (err) {
                      console.error('failed to vote', err);
                    }
                  } catch (err) {
                    console.error('failed to delegate tokens');
                  } finally {
                    // in *either* case we need to set the isVoting state to false to enable the button again
                    setIsVoting(false);
                  }
                }}
              >
                <Grid container spacing={2}>
                  {proposals.length > 0 ? (
                    proposals.map((proposal) => {
                      return (
                        <Grid item xs={12} md={6} key={proposal.proposalId}>
                          <Typography color="textPrimary" variant="h6" sx={{ mb: 2 }}>
                            {proposal.description}
                          </Typography>
                          {proposal.votes.map(({ type, label }) => (
                            <div key={type}>
                              <input
                                type="radio"
                                id={`${proposal.proposalId}-${type}`}
                                name={proposal.proposalId}
                                value={type}
                                // default the "abstain" vote to checked
                                defaultChecked={type === 2}
                              />
                              <label htmlFor={`${proposal.proposalId}-${type}`}>{label}</label>
                            </div>
                          ))}
                        </Grid>
                      );
                    })
                  ) : (
                    <div>No active proposals</div>
                  )}
                </Grid>
              </form>

              <Button variant="contained" disabled={isVoting || hasVoted} type="submit">
                {isVoting ? 'Voting...' : ''}
                {hasVoted ? 'You Already Voted' : 'Submit Votes'}
              </Button>

              {!hasVoted && (
                <Typography sx={{ pt: 2 }}>
                  This will trigger multiple transactions that you will need to sign.
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={8} sx={{ mt: 3 }}>
            <AppWebsiteVisits
              title="Token Value"
              subheader="CIGAR Governance Token"
              chartLabels={[
                '01/01/2003',
                '02/01/2003',
                '03/01/2003',
                '04/01/2003',
                '05/01/2003',
                '06/01/2003',
                '07/01/2003',
                '08/01/2003',
                '09/01/2003',
                '10/01/2003',
                '11/01/2003',
              ]}
              chartData={[
                {
                  name: 'Team A',
                  type: 'column',
                  fill: 'solid',
                  data: [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30],
                },
                {
                  name: 'Team B',
                  type: 'area',
                  fill: 'gradient',
                  data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43],
                },
                {
                  name: 'Team C',
                  type: 'line',
                  fill: 'solid',
                  data: [30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39],
                },
              ]}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={4} sx={{ mt: 3 }}>
            <AppCurrentVisits
              title="Ownership"
              chartData={[
                { label: 'Des', value: 250000 },
                { label: 'Alex', value: 250000 },
                { label: 'Treasury', value: 500000 },
                { label: 'Other', value: 0 },
              ]}
              chartColors={[
                theme.palette.primary.main,
                theme.palette.chart.blue[0],
                theme.palette.chart.violet[0],
                theme.palette.chart.yellow[0],
              ]}
            />
          </Grid>

          {/* 
          <Grid item xs={12} md={6} lg={8}>
            <AppConversionRates
              title="Conversion Rates"
              subheader="(+43%) than last year"
              chartData={[
                { label: 'Italy', value: 400 },
                { label: 'Japan', value: 430 },
                { label: 'China', value: 448 },
                { label: 'Canada', value: 470 },
                { label: 'France', value: 540 },
                { label: 'Germany', value: 580 },
                { label: 'South Korea', value: 690 },
                { label: 'Netherlands', value: 1100 },
                { label: 'United States', value: 1200 },
                { label: 'United Kingdom', value: 1380 },
              ]}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <AppCurrentSubject
              title="Current Subject"
              chartLabels={['English', 'History', 'Physics', 'Geography', 'Chinese', 'Math']}
              chartData={[
                { name: 'Series 1', data: [80, 50, 30, 40, 100, 20] },
                { name: 'Series 2', data: [20, 30, 40, 80, 20, 80] },
                { name: 'Series 3', data: [44, 76, 78, 13, 43, 10] },
              ]}
              chartColors={[...Array(6)].map(() => theme.palette.text.secondary)}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={8}>
            <AppNewsUpdate
              title="News Update"
              list={[...Array(5)].map((_, index) => ({
                id: faker.datatype.uuid(),
                title: faker.name.jobTitle(),
                description: faker.name.jobTitle(),
                image: `/static/mock-images/covers/cover_${index + 1}.jpg`,
                postedAt: faker.date.recent(),
              }))}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <AppOrderTimeline
              title="Order Timeline"
              list={[...Array(5)].map((_, index) => ({
                id: faker.datatype.uuid(),
                title: [
                  '1983, orders, $4220',
                  '12 Invoices have been paid',
                  'Order #37745 from September',
                  'New order placed #XF-2356',
                  'New order placed #XF-2346',
                ][index],
                type: `order${index + 1}`,
                time: faker.date.past(),
              }))}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <AppTrafficBySite
              title="Traffic by Site"
              list={[
                {
                  name: 'FaceBook',
                  value: 323234,
                  icon: <Iconify icon={'eva:facebook-fill'} color="#1877F2" width={32} height={32} />,
                },
                {
                  name: 'Google',
                  value: 341212,
                  icon: <Iconify icon={'eva:google-fill'} color="#DF3E30" width={32} height={32} />,
                },
                {
                  name: 'Linkedin',
                  value: 411213,
                  icon: <Iconify icon={'eva:linkedin-fill'} color="#006097" width={32} height={32} />,
                },
                {
                  name: 'Twitter',
                  value: 443232,
                  icon: <Iconify icon={'eva:twitter-fill'} color="#1C9CEA" width={32} height={32} />,
                },
              ]}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={8}>
            <AppTasks
              title="Tasks"
              list={[
                { id: '1', label: 'Create FireStone Logo' },
                { id: '2', label: 'Add SCSS and JS files if required' },
                { id: '3', label: 'Stakeholder Meeting' },
                { id: '4', label: 'Scoping & Estimations' },
                { id: '5', label: 'Sprint Showcase' },
              ]}
            />
          </Grid> */}
        </Grid>
      </Container>
    </div>
  );
};

export default DAO;
