import Web3 from 'web3';
import * as VoteJSON from '../../../build/contracts/Vote.json';
import { Vote } from '../../types/Vote';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

const CONTRACT_ADDRESS = '0xE0dC75b6bef9EC62F81BE5C21C9DD35402C7a113';
export class VoteWrapper {
    web3: Web3;

    contract: Vote;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.address = CONTRACT_ADDRESS;
        this.contract = new web3.eth.Contract(VoteJSON.abi as any) as any;
        this.contract.options.address = CONTRACT_ADDRESS;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getPizza(_id: number, fromAddress: string) {
        const pizza = await this.contract.methods.getPizza(_id).call({ from: fromAddress });

        return pizza;
    }

    async createPizza(_id: number, fromAddress: string) {
        const tx = await this.contract.methods
            .createPizza(_id)
            .send({ ...DEFAULT_SEND_OPTIONS, from: fromAddress });

        return tx;
    }

    async like(_id: number, fromAddress: string) {
        const tx = await this.contract.methods.like(_id).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async dislike(_id: number, fromAddress: string) {
        const tx = await this.contract.methods.dislike(_id).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }
}
