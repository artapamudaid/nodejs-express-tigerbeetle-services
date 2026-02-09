import { createClient } from 'tigerbeetle-node';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  cluster_id: BigInt(process.env.TB_CLUSTER_ID || 0),
  replica_addresses: [process.env.TB_REPLICA_ADDRESSES || '3000'],
});

// console.log(`Connected to TigerBeetle on port ${process.env.TB_REPLICA_ADDRESSES}`);

export default client;