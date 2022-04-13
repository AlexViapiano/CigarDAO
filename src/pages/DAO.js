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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Card,
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
  const [chartData, setChartData] = useState([]);
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
        // console.log('🚀 Members addresses', memberAddresses);
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
        const chartData = amounts.map((member) => {
          return { label: member?.holder, value: Number(member?.balance?.displayValue) };
        });
        setChartData(chartData);
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

  console.log('network', network);
  console.log('ChainId', ChainId);

  // A fancy function to shorten someones wallet address, no need to show the whole thing.
  const shortenAddress = (str) => `${str.substring(0, 6)}...${str.substring(str.length - 4)}`;

  // FIX THIS
  const AddressZero = '0x000000000000000000000000000';

  return (
    <div className="member-page">
      {network?.[0].data?.chain?.id !== ChainId?.Rinkeby && (
        <Alert variant="filled" severity="warning" sx={{ mb: 5 }}>
          Please connect to Rinkeby. This dapp only works on the Rinkeby network, please switch networks in your
          connected wallet.
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>
        CigarDAO Member Page
      </Typography>

      <Typography sx={{ color: 'text.secondary', mb: 5 }}>Congratulations on being a member!</Typography>

      <Container maxWidth="xl">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary title="Total Supply" total={1000000} icon={'mdi:bitcoin'} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Treasury"
              total={treasury?.balance?.displayValue != null ? Number(treasury?.balance?.displayValue) : 0}
              color="info"
              icon={'mdi:bank'}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Members"
              total={memberAddresses?.length}
              color="warning"
              icon={'mdi:account-group'}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary title="Proposals" total={proposals?.length} color="error" icon={'mdi:comment-question'} />
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h5" gutterBottom>
                Member List
              </Typography>
              <TableContainer component={Paper}>
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
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Active Proposals
              </Typography>
              <Paper sx={{ mb: 3 }}>
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
                      proposals.map((proposal, index) => {
                        return (
                          <Grid key={index} item xs={12} sx={{ mb: 2 }}>
                            <FormControl>
                              <FormLabel id="demo-row-radio-buttons-group-label">
                                ({index + 1}) {proposal.description}
                              </FormLabel>
                              <RadioGroup
                                row
                                aria-labelledby="demo-row-radio-buttons-group-label"
                                name="row-radio-buttons-group"
                              >
                                {proposal.votes.map(({ type, label }) => (
                                  <FormControlLabel
                                    key={type}
                                    value={type}
                                    control={<Radio />}
                                    label={label}
                                    type="radio"
                                    id={`${proposal.proposalId}-${type}`}
                                    // name={proposal.proposalId}
                                    // default the "abstain" vote to checked
                                    defaultChecked={type === 2}
                                    disabled={hasVoted}
                                  />
                                ))}
                              </RadioGroup>
                            </FormControl>

                            {/* 
                          <Typography color="textPrimary" variant="h6">
                            ({index + 1}) {proposal.description}
                          </Typography> */}
                            {/* {proposal.votes.map(({ type, label }) => (
                            <div key={type}>
                              <input
                                type="radio"
                                id={`${proposal.proposalId}-${type}`}
                                name={proposal.proposalId}
                                value={type}
                                // default the "abstain" vote to checked
                                defaultChecked={type === 2}
                                disabled={hasVoted}
                              />
                              <label htmlFor={`${proposal.proposalId}-${type}`}>{label}</label>
                            </div>
                          ))} */}
                          </Grid>
                        );
                      })
                    ) : (
                      <Typography sx={{ p: 2 }}>No Active Proposals</Typography>
                    )}
                  </Grid>

                  {proposals.length > 0 && (
                    <center>
                      <Button sx={{ mt: 4 }} variant="contained" disabled={isVoting || hasVoted} type="submit">
                        {/* eslint-disable-next-line */}
                        {isVoting ? 'Voting...' : hasVoted ? 'You Already Voted' : 'Submit Votes'}
                      </Button>

                      {!hasVoted && (
                        <Typography sx={{ pt: 2 }}>
                          This will trigger multiple transactions that you will need to sign.
                        </Typography>
                      )}
                    </center>
                  )}
                </form>
              </Paper>
            </Card>
          </Grid>

          <Grid item xs={12} sx={{ mt: 3 }}>
            <AppCurrentVisits
              title="CigarDAO Governance Token"
              chartData={chartData}
              chartColors={[
                theme.palette.primary.main,
                theme.palette.chart.blue[0],
                theme.palette.chart.violet[0],
                theme.palette.chart.yellow[0],
              ]}
            />
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default DAO;
