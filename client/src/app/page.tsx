"use client";
import { KrmxProviderWithStore, useKrmx } from '@krmx/client';
import { useState } from 'react';

interface Message {
  type: string;
  payload?: unknown;
}
 
// Note: Don't use `KrmxProviderWithStore` if you are already creating a redux store in your app.
//       In that case, add the exported `krmxSlice` to your store and use `KrmxProvider` directly.
const { KrmxProvider } = KrmxProviderWithStore();
export default function MyApp() {
  const [serverUrl] = useState('ws://localhost:8082');
  return (
    <KrmxProvider
      serverUrl={serverUrl}
      onMessage={(message: Message) => {
        console.info(message);
      }}
    >
      <MyComponent />
    </KrmxProvider>
  );
}

function LoginForm(props: { link: (username: string) => void, rejectionReason?: string }) {
  const [formUsername, setFormUsername] = useState('');
  const isValidFormUsername = /^[a-z0-9]{3,20}$/.test(formUsername);
  return (
    <form
      className='w-1/2 lg:w-1/3 mx-auto text-center mt-10 p-6 bg-gray-200 border-t-8 border-gray-400 rounded shadow'
      onSubmit={(e) => { props.link(formUsername); e.preventDefault(); }}
    >
      <h1 className='mb-4 font-bold text-4xl'>Voromulti</h1>
      <input
        id="username"
        placeholder='username'
        type='text'
        name='username'
        value={formUsername}
        onChange={(e) => setFormUsername(e.target.value.toLowerCase())}
        className='mr-2 border border-gray-300 rounded p-2 data-[status=error]:border-red-700 data-[status=error]:bg-red-300'
        data-status={(isValidFormUsername || formUsername === '') ? 'good' : 'error'}
      />
      <button
        type="submit"
        disabled={!isValidFormUsername}
        className='rounded border px-4 py-2 bg-gray-100 border-gray-300 disabled:bg-gray-400 disabled:text-gray-500'
      >
        Join!
      </button>
      {props.rejectionReason && <p>Rejected: {props.rejectionReason}</p>}
    </form>
  );
}

function MyComponent() {
  const {username, isConnected, isLinked, link, rejectionReason, send, leave, users } = useKrmx();
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
    <div>
      <p>
        Welcome <strong>{username}</strong>!
      </p>
      <button onClick={leave}>Leave</button>
      <h2>Users</h2>
      <ul>
        {Object.entries(users)
          .map(([otherUsername, { isLinked }]) => (
            <li key={otherUsername}>
              {isLinked ? '🟢' : '🔴'} {otherUsername}
            </li>)
          )}
      </ul>
    </div>
  );
}