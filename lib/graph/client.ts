import { Client } from '@microsoft/microsoft-graph-client';

export interface GraphClientOptions {
  accessToken: string;
}

export function createGraphClient({ accessToken }: GraphClientOptions): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}
