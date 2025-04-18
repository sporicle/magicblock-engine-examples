import React, {useCallback, useEffect, useRef, useState} from "react";
import Button from "./components/Button";
import {useConnection, useWallet} from '@solana/wallet-adapter-react';
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import Alert from "./components/Alert";
import {Program, Provider} from "@coral-xyz/anchor";
import {SimpleProvider} from "./components/Wallet";
import {
    AccountInfo,
    Commitment,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction, TransactionInstruction
} from "@solana/web3.js";
import ColorPalette from "./components/ColorPalette";
import PaintingBoard from "./components/PaintingBoard";

const PAINTING_PDA_SEED = "painting-canvas";
const PAINTING_PROGRAM = new PublicKey("EB9qNdGitcvC6XPagSJaCxWbDsbGpzP7qKKArbK8iax5");
const BOARD_SIZE = 20;

const App: React.FC = () => {
    let { connection } = useConnection();
    const ephemeralConnection  = useRef<Connection | null>(null);
    const provider = useRef<Provider>(new SimpleProvider(connection));
    const { publicKey, sendTransaction } = useWallet();
    const tempKeypair = useRef<Keypair | null>(null);
    const [selectedColor, setSelectedColor] = useState<number>(0);
    const [pixels, setPixels] = useState<number[][]>(Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0)));
    const [ephemeralPixels, setEphemeralPixels] = useState<number[][]>(Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0)));
    const [isDelegated, setIsDelegated] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const [transactionSuccess, setTransactionSuccess] = useState<string | null>(null);
    const paintingProgramClient = useRef<Program | null>(null);
    const [paintingPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(PAINTING_PDA_SEED)],
        PAINTING_PROGRAM
    );
    let paintingSubscriptionId = useRef<number | null>(null);
    let ephemeralPaintingSubscriptionId = useRef<number | null>(null);

    // Helpers to Dynamically fetch the IDL and initialize the program client
    const getProgramClient = useCallback(async (program: PublicKey): Promise<Program> => {
        const idl = await Program.fetchIdl(program, provider.current);
        if (!idl) throw new Error('IDL not found');
        return new Program(idl, provider.current);
    }, [provider]);

    // Define callbacks function to handle account changes
    const handlePaintingChange = useCallback((accountInfo: AccountInfo<Buffer>) => {
        console.log("Painting changed", accountInfo);
        if (!paintingProgramClient.current) return;
        
        try {
            const decodedData = paintingProgramClient.current.coder.accounts.decode('painting', accountInfo.data);
            setIsDelegated(!accountInfo.owner.equals(paintingProgramClient.current.programId));
            
            // Convert the painting pixels to our state format
            const newPixels = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    newPixels[y][x] = decodedData.pixels[y][x];
                }
            }
            setPixels(newPixels);
        } catch (error) {
            console.error("Error decoding painting data:", error);
        }
    }, []);

    const handleEphemeralPaintingChange = useCallback((accountInfo: AccountInfo<Buffer>) => {
        console.log("Ephemeral painting changed", accountInfo);
        if (!paintingProgramClient.current) return;

        try {
            const decodedData = paintingProgramClient.current.coder.accounts.decode('painting', accountInfo.data);
            
            // Convert the painting pixels to our state format
            const newPixels = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
            for (let y = 0; y < BOARD_SIZE; y++) {
                for (let x = 0; x < BOARD_SIZE; x++) {
                    newPixels[y][x] = decodedData.pixels[y][x];
                }
            }
            setEphemeralPixels(newPixels);
        } catch (error) {
            console.error("Error decoding ephemeral painting data:", error);
        }
    }, []);

    // Subscribe to the painting updates
    const subscribeToPainting = useCallback(async (): Promise<void> => {
        if (paintingSubscriptionId && paintingSubscriptionId.current) await connection.removeAccountChangeListener(paintingSubscriptionId.current);
        console.log("Subscribing to painting", paintingPda.toBase58());
        // Subscribe to painting changes
        paintingSubscriptionId.current = connection.onAccountChange(paintingPda, handlePaintingChange, 'processed');
    }, [connection, paintingPda, handlePaintingChange]);

    // Subscribe to the ephemeral painting updates
    const subscribeToEphemeralPainting = useCallback(async (): Promise<void> => {
        if(!ephemeralConnection.current) return;
        console.log("Subscribing to ephemeral painting", paintingPda.toBase58());
        if (ephemeralPaintingSubscriptionId && ephemeralPaintingSubscriptionId.current) await ephemeralConnection.current.removeAccountChangeListener(ephemeralPaintingSubscriptionId.current);
        // Subscribe to ephemeral painting changes
        ephemeralPaintingSubscriptionId.current = ephemeralConnection.current.onAccountChange(paintingPda, handleEphemeralPaintingChange, 'confirmed');
    }, [paintingPda, handleEphemeralPaintingChange]);

    useEffect(() => {
        const initializeProgramClient = async () => {
            if(paintingProgramClient.current) return;
            try {
                setIsLoading(true);
                paintingProgramClient.current = await getProgramClient(PAINTING_PROGRAM);
                const accountInfo = await provider.current.connection.getAccountInfo(paintingPda);
                console.log("Account exists:", !!accountInfo);
                if (accountInfo) {
                    // Decode the painting account data
                    const painting = paintingProgramClient.current.coder.accounts.decode('painting', accountInfo.data);
                    
                    // Convert the painting pixels to our state format
                    const newPixels = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
                    for (let y = 0; y < BOARD_SIZE; y++) {
                        for (let x = 0; x < BOARD_SIZE; x++) {
                            newPixels[y][x] = painting.pixels[y][x];
                        }
                    }
                    setPixels(newPixels);
                    setIsDelegated(!accountInfo.owner.equals(PAINTING_PROGRAM));
                    await subscribeToPainting();
                }
                setIsLoading(false);
            } catch (error) {
                console.error("Error initializing program client:", error);
                setIsLoading(false);
            }
        };
        initializeProgramClient();
    }, [connection, paintingPda, getProgramClient, subscribeToPainting]);

    // Detect when publicKey is set/connected
    useEffect( () => {
        if (!publicKey) return;
        if (!publicKey || Keypair.fromSeed(publicKey.toBytes()).publicKey.equals(tempKeypair.current?.publicKey || PublicKey.default)) return;
        console.log("Wallet connected with publicKey:", publicKey.toBase58());
        // Derive the temp keypair from the publicKey
        const newTempKeypair = Keypair.fromSeed(publicKey.toBytes());
        tempKeypair.current = newTempKeypair;
        console.log("Temp Keypair", newTempKeypair.publicKey.toBase58());
    }, [connection, publicKey]);

    useEffect(() => {
        const checkAndTransfer = async () => {
            if (tempKeypair.current) {
                const accountTmpWallet = await connection.getAccountInfo(tempKeypair.current.publicKey);
                if (!accountTmpWallet || accountTmpWallet.lamports <= 0.01 * LAMPORTS_PER_SOL) {
                    await transferToTempKeypair()
                }
            }
        };
        checkAndTransfer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDelegated, connection]);

    useEffect(() => {
        const initializeEphemeralConnection = async () => {
            const cluster = process.env.REACT_APP_MAGICBLOCK_URL || "https://devnet.magicblock.app"
            if(ephemeralConnection.current || paintingProgramClient.current == null) {
                return;
            }
            ephemeralConnection.current = new Connection(cluster);
            // Airdrop to trigger lazy reload
            try {
                await ephemeralConnection.current?.requestAirdrop(paintingPda, 1);
            }catch (_){
                console.log("Refreshed account in the ephemeral");
            }
            const accountInfo = await ephemeralConnection.current.getAccountInfo(paintingPda);
            if (accountInfo) {
                // Decode the painting account data
                const painting = paintingProgramClient.current.coder.accounts.decode('painting', accountInfo.data);
                
                // Convert the painting pixels to our state format
                const newPixels = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(0));
                for (let y = 0; y < BOARD_SIZE; y++) {
                    for (let x = 0; x < BOARD_SIZE; x++) {
                        newPixels[y][x] = painting.pixels[y][x];
                    }
                }
                setEphemeralPixels(newPixels);
                await subscribeToPainting();
            }
            await subscribeToEphemeralPainting();
        };
        initializeEphemeralConnection().catch(console.error);
    }, [paintingPda, subscribeToPainting, subscribeToEphemeralPainting]);

    const paintPixel = async (x: number, y: number): Promise<void> => {
        if (!publicKey) {
            setTransactionError("Please connect your wallet to paint pixels");
            return;
        }
        await paintPixelTx(x, y, selectedColor);
    };

    const submitTransaction = useCallback(async (transaction: Transaction, useTempKeypair: boolean = false, ephemeral: boolean = false, confirmCommitment : Commitment = "processed"): Promise<string | null> => {
        if (!tempKeypair.current) return null;
        if (!publicKey) return null;
        if (!ephemeralConnection.current) return null;
        setIsSubmitting(true);
        setTransactionError(null);
        setTransactionSuccess(null);
        let connection = ephemeral ? ephemeralConnection.current : provider.current.connection;
        try {
            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight }
            } = await connection.getLatestBlockhashAndContext();
            console.log("Submitting transaction...");
            if (!transaction.recentBlockhash) transaction.recentBlockhash = blockhash;
            if (!transaction.feePayer) useTempKeypair ? transaction.feePayer = tempKeypair.current.publicKey : transaction.feePayer = publicKey;
            if(useTempKeypair) transaction.sign(tempKeypair.current);
            let signature;
            if(!ephemeral && !useTempKeypair){
                signature = await sendTransaction(transaction, connection, { minContextSlot, skipPreflight: true});
            }else{
                signature = await connection.sendRawTransaction(transaction.serialize(), {skipPreflight: true});
            }
            await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, confirmCommitment);
            // Transaction was successful
            console.log(`Transaction confirmed: ${signature}`);
            setTransactionSuccess(`Transaction confirmed`);
            return signature;
        } catch (error) {
            setTransactionError(`Transaction failed: ${error}`);
        } finally {
            setIsSubmitting(false);
        }
        return null;
    }, [publicKey, sendTransaction, tempKeypair]);

    /**
     * Transfer some SOL to temp keypair
     */
    const transferToTempKeypair = useCallback(async () => {
        if (!publicKey || !tempKeypair.current) return;
        console.log("Transfer some SOL to temp keypair");
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: tempKeypair.current.publicKey,
                lamports: 0.1 * LAMPORTS_PER_SOL,
            })
        );
        transaction.feePayer = publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        await submitTransaction(transaction);
    }, [publicKey, tempKeypair, connection, submitTransaction]);

    /**
     * Paint pixel transaction
     */
    const paintPixelTx = useCallback(async (x: number, y: number, colorIndex: number) => {
        if (!tempKeypair.current) return;
        if(!isDelegated){
            const accountTmpWallet = await connection.getAccountInfo(tempKeypair.current.publicKey);
            if (!accountTmpWallet || accountTmpWallet.lamports <= 0.01 * LAMPORTS_PER_SOL) {
                await transferToTempKeypair()
            }
        }

        const transaction = await paintingProgramClient.current?.methods
            .paintPixel(x, y, colorIndex)
            .accounts({
                painting: paintingPda,
                user: tempKeypair.current.publicKey,
            }).transaction() as Transaction;

        // Add instruction to print to the noop program and and make the transaction unique
        const noopInstruction = new TransactionInstruction({
            programId: new PublicKey('noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV'),
            keys: [],
            data: Buffer.from(crypto.getRandomValues(new Uint8Array(5))),
        });
        transaction.add(noopInstruction);

        await submitTransaction(transaction, true, isDelegated);
    }, [isDelegated, paintingPda, submitTransaction, connection, transferToTempKeypair]);

    /**
     * Delegate PDA transaction
     */
    const delegatePdaTx = useCallback(async () => {
        console.log("Delegate PDA transaction");
        console.log(tempKeypair.current);
        if (!tempKeypair.current) return;
        const accountTmpWallet = await connection.getAccountInfo(tempKeypair.current.publicKey);
        if (!accountTmpWallet || accountTmpWallet.lamports <= 0.01 * LAMPORTS_PER_SOL) {
            await transferToTempKeypair()
        }

        // create transaction to delegate the account
        const transaction = await paintingProgramClient.current?.methods
            .delegate()
            .accounts({
                payer: tempKeypair.current.publicKey,
                pda: paintingPda,
            }).transaction() as Transaction;

        const tx = await submitTransaction(transaction, true);
        console.log("Delegate transaction", tx);
    }, [connection, paintingPda, submitTransaction, transferToTempKeypair]);

    /**
     * Undelegate Tx
     */
    const undelegateTx = useCallback(async () => {
        if (!tempKeypair.current) return;
        console.log("Undelegate PDA transaction");

        // Create a transaction to undelegate
        const transaction = await paintingProgramClient.current?.methods
            .undelegate()
            .accounts({
                payer: tempKeypair.current.publicKey,
                painting: paintingPda,
            }).transaction() as Transaction;

        const tx = await submitTransaction(transaction, true, true);
        console.log("Undelegate transaction", tx);
    }, [paintingPda, submitTransaction]);

    /**
     * Initialize painting Tx
     */
    const initializePaintingTx = useCallback(async () => {
        if (!publicKey) return;
        console.log("Initialize painting transaction");

        try {
            // Create a transaction to initialize the painting
            const transaction = await paintingProgramClient.current?.methods
                .initialize()
                .accounts({
                    painting: paintingPda,
                    user: publicKey,
                    systemProgram: SystemProgram.programId,
                }).transaction() as Transaction;

            transaction.feePayer = publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            const tx = await sendTransaction(transaction, connection);
            console.log("Initialize transaction", tx);
            setTransactionSuccess("Canvas initialized successfully!");
        } catch (error) {
            console.error("Failed to initialize painting:", error);
            setTransactionError(`Failed to initialize: ${error}`);
        }
    }, [publicKey, paintingPda, connection, sendTransaction]);

    return (
        <div className="App">
            <div className="wallet-container">
                <WalletMultiButton />
            </div>

            <div className="container">
                <div className="alerts">
                    {transactionError && <Alert type="error" message={transactionError} />}
                    {transactionSuccess && <Alert type="success" message={transactionSuccess} />}
                </div>

                {isLoading ? (
                    <div className="loading-container">
                        <h3>Loading Board...</h3>
                        <p>Please wait while we fetch the latest canvas data</p>
                    </div>
                ) : (
                    <>
                        {publicKey ? (
                            <>
                                <div className="painting-controls">
                                    <ColorPalette 
                                        selectedColor={selectedColor} 
                                        onColorSelect={setSelectedColor} 
                                    />
                                    
                                    <div className="buttons">
                                        <Button
                                            onClick={initializePaintingTx}
                                            disabled={isSubmitting}
                                            title="Initialize the canvas if it doesn't exist yet"
                                        >
                                            Initialize Canvas
                                        </Button>
                                        
                                        <Button
                                            onClick={delegatePdaTx}
                                            disabled={isSubmitting || isDelegated}
                                            title="Delegate the canvas to the Ephemeral Rollup"
                                        >
                                            Delegate to Ephemeral
                                        </Button>
                                        
                                        <Button
                                            onClick={undelegateTx}
                                            disabled={isSubmitting || !isDelegated}
                                            title="Undelegate the canvas from the Ephemeral Rollup"
                                        >
                                            Undelegate
                                        </Button>
                                    </div>
                                </div>

                                <div className="status-info">
                                    <h3>Status: {isDelegated ? "Delegated to Ephemeral Rollup" : "On Solana Mainnet"}</h3>
                                    <p>Connected Wallet: {publicKey.toString()}</p>
                                </div>
                            </>
                        ) : (
                            <div className="view-only-notice">
                                <h3>View-Only Mode</h3>
                                <p>Connect your wallet to interact with the canvas</p>
                            </div>
                        )}

                        <PaintingBoard 
                            pixels={isDelegated ? ephemeralPixels : pixels} 
                            onPixelClick={paintPixel}
                            isSubmitting={isSubmitting || !publicKey}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default App;