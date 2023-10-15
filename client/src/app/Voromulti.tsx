"use client";

import { MouseEvent, useState } from "react";
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
  const { username, send: krmxSend } = useKrmx();
  const state = useAppSelector(state => state.voromulti);
  const [location, setLocation] = useState('');
  const selfLocation = state.sites.locations[state.claims[username]];
  const [lastSend, setLastSend] = useState(0);
  const send = (e: MouseEvent) => {
    const bbox = e.currentTarget!.getBoundingClientRect();
    const x = (e.clientX - bbox.x) / bbox.width;
    const y = (e.clientY - bbox.y) / bbox.height;
    if (lastSend + 25 < Date.now()) {
      setLastSend(Date.now());
      const message: VoromultiPositionMessage = { type: 'voromulti/position', payload: { x, y } };
      krmxSend(message);
    }
    setLocation(`${x.toFixed(3)} ${y.toFixed(3)}`);
  }
  return <>
    <svg
      className="border border-green-600 bg-green-300 w-3/4 rounded-xl"
      viewBox="0 0 1 1"
      onClick={send}
      onMouseMove={send}
    >
      {state.sites.locations.map((location, siteIndex) => {
        return <>
          <g key={siteIndex} transform={`translate(${location.x}, ${location.y})`}>
            <circle r={0.01} fillOpacity={0.7} fill={'#FFF'} />
          </g>
          <path d={state.sites.edges[siteIndex]} strokeWidth={0.003} fillOpacity={0} stroke={'black'} />
        </>;
      })}
      <circle cx={selfLocation?.x} cy={selfLocation?.y} r={0.015} fillOpacity={0.7} fill={'red'} />
    </svg>
    <pre className="text-xs p-1">
      Location: {location} ({selfLocation?.x.toFixed(3)}, {selfLocation?.y.toFixed(3)})
    </pre>
    {/* <pre className="text-xs text-blue-400">{JSON.stringify(state, undefined, 2)}</pre> */}
  </>;
}
