"use client";

import React, { useState } from "react";
import { useAppSelector } from "./store";
import { useKrmx } from "@krmx/client";

type Point = {
  x: number;
  y: number;
};

type VoromultiPositionMessage = {
  type: 'voromulti/position';
  payload: Point;
};

export function Voromulti() {
  const { username, send: krmxSend, users } = useKrmx();
  const state = useAppSelector(state => state.voromulti);
  const [location, setLocation] = useState('');
  const selfLocation = state.sites.locations[state.claims[username]];
  const [lastSend, setLastSend] = useState(0);
  const sendMouse = (e: React.MouseEvent) => {
    const bbox = e.currentTarget!.getBoundingClientRect();
    send(bbox, e.clientX, e.clientY);
  }
  const sendTouch = (e: React.TouchEvent) => {
    const bbox = e.currentTarget!.getBoundingClientRect();
    if (e.touches.length > 0) {
      send(bbox, e.touches[0].clientX, e.touches[0].clientY);
    }
  }
  const send = (bbox, clientX, clientY) => {
    const x = (clientX - bbox.x) / bbox.width;
    const y = (clientY - bbox.y) / bbox.height;
    if (lastSend + 25 < Date.now()) {
      setLastSend(Date.now());
      const message: VoromultiPositionMessage = { type: 'voromulti/position', payload: { x, y } };
      krmxSend(message);
    }
    setLocation(`${x.toFixed(3)} ${y.toFixed(3)}`);
  }
  const getClaimUsername = (siteIndex: number) : string | undefined => {
    const claimIndex = Object.entries(state.claims).findIndex((([, claimIndex]) => claimIndex === siteIndex));
    return claimIndex === -1 ? undefined : Object.entries(state.claims)[claimIndex][0];
  }
  return <>
    <svg
      className="-z-10 absolute w-full h-full top-0 left-0"
      viewBox="0 0 1 1"
      onMouseMove={sendMouse}
      onTouchMove={sendTouch}
      preserveAspectRatio='none'
    >
      {state.sites.locations.map((location, siteIndex) => {
        const claimedUsername = getClaimUsername(siteIndex);
        const isClaimed = claimedUsername !== undefined;
        const isConnected = isClaimed && users[claimedUsername]?.isLinked;
        const self = siteIndex === state.claims[username];
        if (self) {
          return null;
        }
        return <g key={siteIndex}>
          <g transform={`translate(${location.x}, ${location.y})`}>
            <circle r={isClaimed ? 0.01 : 0.005} strokeWidth={isClaimed ? 0.004 : 0} stroke={'black'} fill={'white'} fillOpacity={isConnected ? 1 : 0.5} strokeOpacity={isConnected ? 1 : 0.5} />
          </g>
          <path d={state.sites.edges[siteIndex]} strokeWidth={0.005} fillOpacity={0} stroke='green' strokeOpacity={0.5} />
        </g>;
      })}
      <g>
        <g transform={`translate(${selfLocation?.x}, ${selfLocation?.y})`}>
          <circle r={0.015} strokeWidth={0.004} stroke={'black'} fill={'rgb(251 191 36)'} />
        </g>
        <path d={state.sites.edges[state.claims[username]]} strokeWidth={0.005} fillOpacity={0} stroke='rgb(251 191 36)' />
      </g>
    </svg>
    <pre className="absolute bottom-0 right-0 text-xs tracking-tight p-1">
      Location: {location} ({selfLocation?.x?.toFixed(3)}, {selfLocation?.y?.toFixed(3)})
    </pre>
  </>;
}
