/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';
import * as CompiledContractArtifact from '../../build/contracts/ERC20.json';
import { VoteWrapper } from '../lib/contracts/VoteWrapper';
import { CONFIG } from '../config';

interface IPizza {
    id: string;
    likes: string;
    dislikes: string;
}

const SUDT_PROXY_CONTRACT_ADDRESS = '0x26EbF5AFCBFe240E0Db0CA18abb00fdc57fe38D4';
const SUDT_TOKEN_ID = 1824;
const PIZZA_TYPES = [
    {
        id: 1,
        name: 'Neapolitan Pizza',
        url:
            'https://cdnimg.webstaurantstore.com/uploads/buying_guide/2014/11/pizzatypes-margherita-.jpg'
    },
    {
        id: 2,
        name: 'Chicago Pizza',
        url:
            'https://cdnimg.webstaurantstore.com/uploads/buying_guide/2014/11/pizzatypes-deepdish.jpg'
    },
    {
        id: 3,
        name: 'New York-Style Pizza',
        url: 'https://cdnimg.webstaurantstore.com/uploads/blog/2016/8/flat.jpg'
    },
    {
        id: 4,
        name: 'Sicilian Pizza',
        url: 'https://cdnimg.webstaurantstore.com/uploads/blog/2016/8/rectangle.jpg'
    },
    {
        id: 5,
        name: 'Greek Pizza',
        url: 'https://cdnimg.webstaurantstore.com/uploads/blog/2016/8/onions.jpg'
    },
    {
        id: 6,
        name: 'California Pizza',
        url:
            'https://cdnimg.webstaurantstore.com/uploads/buying_guide/2014/11/pizzatypes-gourmet.jpg'
    }
];

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<VoteWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [newStoredNumberInputValue, setNewStoredNumberInputValue] = useState<
        number | undefined
    >();

    const [pizzas, setPizzas] = useState<IPizza[]>();
    const [bestPizza, setBestPizza] = useState<string>();

    const [loading, setLoading] = useState<boolean>(false);
    const [userDepositAddress, setUserDepositAddress] = useState<string>();
    const [SUDTBalance, setSUDTBalance] = useState<any>();
    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (contract && accounts) {
            getAllPizza();
        }
    }, [contract, accounts]);

    useEffect(() => {
        if (pizzas) {
            getBestPizza();
        }
    }, [pizzas]);

    const getAllPizza = async () => {
        setLoading(true);
        try {
            const _pizzas = [];
            for (let i = 1; i <= 6; i++) {
                const _pizza = await getPizza(i);
                const newPizza = { id: _pizza[0], likes: _pizza[1], dislikes: _pizza[2] };

                _pizzas.push(newPizza);
            }
            setPizzas(_pizzas);
            setLoading(false);
            toast('New pizza data loaded 🙂 🍕 .', { type: 'success' });
        } catch (error) {
            setLoading(false);
            console.log(error);
        }
    };
    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function getPizza(_id: number) {
        const pizza = await contract.getPizza(_id, account);
        return pizza;
    }

    async function createPizza(_id: number) {
        try {
            setTransactionInProgress(true);
            await contract.createPizza(_id, account);
            toast('New 🍕 created for you to vote', {
                type: 'success'
            });
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function like(_id: number) {
        try {
            setTransactionInProgress(true);
            await contract.like(_id, account);
            toast('You like pizza, we like pizza, everyone likes pizza 🙂 Refresh the pizza', {
                type: 'success'
            });
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function dislike(_id: number) {
        try {
            setTransactionInProgress(true);
            await contract.dislike(_id, account);
            toast('Hmm... 😠 You disliked a pizza. Refresh the page', {
                type: 'success'
            });
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    const getLayer2DepositAddress = async () => {
        const addressTranslator = new AddressTranslator();

        const userAddress = await addressTranslator.getLayer2DepositAddress(web3, accounts?.[0]);

        setUserDepositAddress(userAddress.addressString);
    };

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });
            const _contract = new VoteWrapper(_web3);
            setContract(_contract);
            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);

                const addressTranslator = new AddressTranslator();

                const _polyjuiceAddress = addressTranslator.ethAddressToGodwokenShortAddress(
                    _accounts?.[0]
                );
                const ERC20ProxyContract = new _web3.eth.Contract(
                    CompiledContractArtifact.abi as any,
                    SUDT_PROXY_CONTRACT_ADDRESS
                );

                const _SUDTBalance = await ERC20ProxyContract.methods
                    .balanceOf(_polyjuiceAddress)
                    .call({ from: _accounts?.[0] });
                setSUDTBalance(_SUDTBalance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    const getBestPizza = () => {
        let max = 0;
        let maxId;
        if (!pizzas) {
            return;
        }
        for (const pizza of pizzas) {
            const avg = Number(pizza.likes) - Number(pizza.dislikes);
            if (avg > max) {
                max = avg;
                maxId = pizza.id;
            }
        }
        setBestPizza(maxId);
    };

    return (
        <div className="app">
            <h1>🍕 Nervos/Satoshi Pizza Store🍕</h1>
            <small>Vote for pizza</small>
            <div className="accounts">
                Your ETH address: <b>{accounts?.[0]}</b>
                <br />
                <br />
                <hr />
                Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
                <br />
                <br />
                <hr />
                Nervos Layer 2 balance:{' '}
                <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
                <br />
                <br />
                <hr />
                SUDT Pizza Token Balance: {SUDTBalance || <LoadingIndicator />}
                <b> Pizza Slice</b>
                <br />
                <br />
                SUDT Token ID: {SUDT_TOKEN_ID}
                <br />
                <br />
                <hr />
                Layer 2 Deposit Address :{' '}
                {!userDepositAddress ? (
                    <button
                        style={{ backgroundColor: 'black', color: 'white' }}
                        onClick={getLayer2DepositAddress}
                    >
                        👁 Get Address
                    </button>
                ) : (
                    <div
                        className="l2-address"
                        style={{ overflowWrap: 'break-word', wordWrap: 'break-word' }}
                    >
                        <b>{userDepositAddress}</b>
                    </div>
                )}
                <br />
                <br />
                <hr />
                👉{' '}
                <small style={{ backgroundColor: 'yellow' }}>
                    Copy your Layer2 Deposit Address and go to force bridge to deposit assets
                </small>
                <br />
                <div
                    style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    <button
                        style={{ backgroundColor: 'rgb(126, 0, 131)', color: 'white' }}
                        onClick={() => {
                            window.open(
                                'https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos?xchain-asset=0x0000000000000000000000000000000000000000',
                                '_blank' // <- This is what makes it open in a new window.
                            );
                        }}
                    >
                        💰 Deposit ETH
                    </button>
                </div>
                <br />
                <br />
            </div>

            <button className="mt-1 mb-1" onClick={getAllPizza}>
                Refresh 🍕{' '}
            </button>
            <div className="pizzas">
                {PIZZA_TYPES.map(pizza => {
                    return (
                        <div className="pizza" key={pizza.id}>
                            {bestPizza && bestPizza === pizza.id.toString() && (
                                <div className="best">🏆 BEST PIZZA </div>
                            )}
                            <img alt="pizza" src={pizza.url} />

                            <div className="description">
                                <h3>{pizza.name}</h3>
                                {loading && <LoadingIndicator />}
                                {!loading && (
                                    <div>
                                        {pizzas?.[pizza.id - 1].id !== pizza.id.toString() ? (
                                            <div>
                                                <div>
                                                    <small
                                                        style={{
                                                            backgroundColor: 'red',
                                                            color: 'white'
                                                        }}
                                                    >
                                                        No vote found!
                                                    </small>
                                                </div>
                                                <button
                                                    className="mt-1"
                                                    style={{
                                                        backgroundColor: 'yellow',
                                                        color: 'black'
                                                    }}
                                                    onClick={e => createPizza(pizza.id)}
                                                >
                                                    Open Vote
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="mb-1 action-wrapper">
                                                <span
                                                    title="like"
                                                    className="action"
                                                    style={{ marginRight: '0.2rem' }}
                                                    onClick={() => like(pizza.id)}
                                                >
                                                    👍{' '}
                                                    <strong>{pizzas?.[pizza.id - 1].likes}</strong>
                                                </span>
                                                <span
                                                    title="dislike"
                                                    onClick={() => dislike(pizza.id)}
                                                    className="action"
                                                    style={{ marginRight: '0.2rem' }}
                                                >
                                                    👎{' '}
                                                    <strong>
                                                        {pizzas?.[pizza.id - 1].dislikes}
                                                    </strong>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <ToastContainer />
        </div>
    );
}
