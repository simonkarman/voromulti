"use client";
import { KrmxProvider, useKrmx } from '@krmx/client';
import { useEffect, useState } from 'react';
import { useAppDispatch, voromultiSlice } from './store';
import { Provider } from 'react-redux'
import { store } from './store'
import { Voromulti } from './Voromulti';

interface Message {
  type: string;
  payload?: unknown;
}

export default function MyApplication() {
  return <Provider store={store}>
    <KrmxContainer />
  </Provider>
}

function KrmxContainer() {
  const serverUrl = `${process.env.NEXT_PUBLIC_KRMX_PROTOCOL ?? 'ws'}://${process.env.NEXT_PUBLIC_KRMX_SERVER ?? 'localhost:8082'}/game?voromulti&version=0.0.1`;
  const dispatch = useAppDispatch();
  return <>
    <main className={'container mx-auto grow px-4'}>
      <KrmxProvider
        serverUrl={serverUrl}
        onMessage={dispatch}
      >
        <MyComponent />
      </KrmxProvider>
    </main>
  </>;
}

function LoginForm(props: { link: (username: string) => void, rejectionReason?: string }) {
  const [formUsername, setFormUsername] = useState('');
  const isValidFormUsername = /^[a-z0-9]{3,20}$/.test(formUsername);
  return (
    <form
      className='max-w-[400px] mx-auto text-center mt-10 p-6 bg-gray-200 border-t-8 border-gray-400 rounded shadow'
      onSubmit={(e) => { props.link(formUsername); e.preventDefault(); }}
    >
      <h1 className='mb-6 font-bold text-4xl'>Voromulti</h1>
      <div className='flex items-center overflow-hidden'>
        <input
          id="username"
          placeholder='username'
          type='text'
          name='username'
          value={formUsername}
          onChange={(e) => setFormUsername(e.target.value.toLowerCase())}
          className='w-full mr-2 border border-gray-300 rounded p-2 data-[status=error]:border-red-700 data-[status=error]:bg-red-300'
          data-status={(isValidFormUsername || formUsername === '') ? 'good' : 'error'}
        />
        <button
          type="submit"
          disabled={!isValidFormUsername}
          className='rounded border px-4 py-2 bg-gray-100 border-gray-300 disabled:bg-gray-400 disabled:text-gray-500'
        >
          Join!
        </button>
      </div>
      {props.rejectionReason && <p>Rejected: {props.rejectionReason}</p>}
    </form>
  );
}

function MyComponent() {
  const {username, reconnect, isConnected, isLinked, link, rejectionReason, leave, users } = useKrmx();
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (!isLinked) {
      dispatch(voromultiSlice.actions.reset());
    }
  }, [dispatch, isConnected, isLinked]);
  useEffect(() => {
    const timer = setTimeout(() => reconnect(), 2500);
    return () => {
      clearTimeout(timer);
    };
  }, [isConnected, reconnect]);

  if (!isConnected) {
    // Your logic for when you're not connected to the server goes here
    return <p>No connection to the server...</p>;
  }
  if (!isLinked) {
    // Your logic for linking your connection with a user goes here
    return <LoginForm rejectionReason={rejectionReason} link={link} />
  }
  // Your logic for when you're ready to go goes here
  return (
    <>
      <Voromulti />
      <ul className='flex flex-wrap gap-2 my-2 sm:my-4'>
        {Object.entries(users)
          .map(([otherUsername, { isLinked }]) => (
            <li
              key={otherUsername}
              className='shadow flex-grow tracking-wider text-lg text-center py-1 px-2 data-[you=true]:border-amber-400 data-[you=true]:border-4 border-2 border-black rounded data-[linked=false]:opacity-40 text-black bg-white font-bold'
              data-linked={isLinked}
              data-you={otherUsername === username}
            >
              {otherUsername}
            </li>)
          )}
        <button className='py-2 px-4 font-bold bg-gray-100 border-2 border-black rounded shadow hover:shadow-lg hover:bg-gray-200' onClick={leave}>Leave</button>
      </ul>
    </>
  );
}
