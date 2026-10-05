import Head from "next/head";
import '../styles/globals.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          media="screen"
          href="https://fontlibrary.org//face/santa-barbara-streets"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

