import Document, { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="icon" href="/favicon.png" />
          <Script src="https://www.gstatic.com/firebasejs/8.6.8/firebase-app.js" strategy="beforeInteractive" />
          <Script src="https://www.gstatic.com/firebasejs/8.6.8/firebase-auth.js" strategy="beforeInteractive" />
          <Script src="https://www.gstatic.com/firebasejs/8.6.8/firebase-database.js" strategy="beforeInteractive" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
