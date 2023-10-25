import { createServer as createHttpServer } from 'http';
import { createServer, Props } from '@krmx/server';
import { Delaunay } from 'd3';
import express from 'express';

// Create http server
const expressServer = express();
expressServer.get('/health', (_, res) => {
  res.send('Server is running!');
});
const httpServer = createHttpServer(expressServer);

type VoromultiClaimMessage = {
  type: 'voromulti/claim';
  payload: {
    username: string;
    siteIndex: number;
  };
};

type VoromultiUnclaimMessage = {
  type: 'voromulti/unclaim';
  payload: {
    username: string;
  };
};

type VoromultiClaimsMessage = {
  type: 'voromulti/claims';
  payload: { [username: string]: number };
};

type VoromultiSitesMessage = {
  type: 'voromulti/sites';
  payload: {
    locations: Point[];
    edges: string[];
  };
};

type VoromultiPositionMessage = {
  type: 'voromulti/position';
  payload: Point;
};

type Point = {
  x: number;
  y: number;
};

const props: Props = {
  http: { server: httpServer, path: 'game', queryParams: { voromulti: true, version: '0.0.1' } },
};
const server = createServer(props);

const generateSites = (numberOfSites: number): Point[] => {
  const sites: Point[] = [];
  for (let i = 0; i < numberOfSites; i++) {
    const point: Point = {
      x: (0.5 + (i % 3)) / 3,
      y: (i + 0.5) / numberOfSites,
    };
    sites.push(point);
  }
  return sites;
}

const maxNumberOfPlayers = 10;
const siteIndexByUser: { [username: string]: number } = {};
const unclaimedSites = Array.from(Array(maxNumberOfPlayers).keys());
const siteLocations: Point[] = generateSites(maxNumberOfPlayers);

const computeEdges = (): string[] => {
  const fromTime = Date.now();
  const voronoi = Delaunay.from(siteLocations.map(({ x, y }) => [x, y]))
    .voronoi([0, 0, 1, 1]);
  console.info('voronoi', Date.now() - fromTime, 'ms');
  return Array.from(Array(siteLocations.length).keys()).map(i => voronoi.renderCell(i));
}

server.on('authenticate', (_, isNewUser, reject) => {
  if (isNewUser && server.getUsers().length >= maxNumberOfPlayers) {
    reject('server is full');
  }
});
server.on('join', (username) => {
  siteIndexByUser[username] = unclaimedSites.shift()!;
  server.broadcast<VoromultiClaimMessage>({ type: 'voromulti/claim', payload: { username, siteIndex: siteIndexByUser[username] }});
})
server.on('link', (username) => {
  server.send<VoromultiClaimsMessage>(username, { type: 'voromulti/claims', payload: siteIndexByUser });
  server.send<VoromultiSitesMessage>(username, { type: 'voromulti/sites', payload: { locations: siteLocations, edges: computeEdges() } });
});
server.on('leave', (username) => {
  server.broadcast<VoromultiUnclaimMessage>({ type: 'voromulti/unclaim', payload: { username }});
  unclaimedSites.push(siteIndexByUser[username]);
  delete siteIndexByUser[username];
});
server.on('message', (username, message) => {
  switch (message.type) {
  case 'voromulti/position':
    siteLocations[siteIndexByUser[username]] = (message as VoromultiPositionMessage).payload;
    server.broadcast<VoromultiSitesMessage>({ type: 'voromulti/sites', payload: { locations: siteLocations, edges: computeEdges() } });
    break;
  default:
    console.debug(`[debug] [my-app] ${username} sent unhandled ${message.type}`);
    break;
  }
});

server.listen(8082);
