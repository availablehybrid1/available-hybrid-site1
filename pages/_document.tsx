import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="icon" type="image/png" href="/logo.%20available%20hybrid%20premium.png" />
          <link rel="shortcut icon" type="image/png" href="/logo.%20available%20hybrid%20premium.png" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
