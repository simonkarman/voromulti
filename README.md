# Voromulti
A multiplayer Voronoi diagram by [Simon Karman](https://www.simonkarman.nl) implemented using [Krmx](https://simonkarman.github.io/krmx) and [D3](https://github.com/d3/d3-delaunay).

![Voromulti Showcase](voromulti.png)

## Modules
- **[server](./server)** - The NodeJS application containing the server-side logic
- **[client](./client)** - The React web application contain the ui and client-side logic

## Getting Started
In the server directory run:
```bash
npm install
npm run dev
```

Keep the server process running and then, in the client directory run:
```bash
npm install
npm run dev
# open the application on localhost:3000
```

## Implementation
Implemented using React, [Krmx](https://simonkarman.github.io/krmx) and [D3](https://github.com/d3/d3-delaunay).