import Link from "next/link";
import Head from "next/head";
import Script from "next/script";
import React from "react";

const News = () => {
  return (
    <div>
      <Head>
        <title>News - EcoBridge</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Script src="https://www.gstatic.com/firebasejs/8.6.8/firebase-app.js" strategy="beforeInteractive" />
      <Script src="https://www.gstatic.com/firebasejs/8.6.8/firebase-auth.js" strategy="beforeInteractive" />
      <Script src="https://www.gstatic.com/firebasejs/8.6.8/firebase-database.js" strategy="beforeInteractive" />
      <nav className="nav">
        <Link href="/" legacyBehavior>
          <button>Home</button>
        </Link>
        <Link href="/about-us" legacyBehavior>
          <button>About Us</button>
        </Link>
        <Link href="/news" legacyBehavior>
          <button>News</button>
        </Link>
      </nav>
      <header className="header">
        EcoBridge - Latest News and Updates
      </header>
      <main className="main">
        <section className="news-container">
          <h1>Latest News</h1>
          <article>
            <h2>[#insert date here] Beta Launch!</h2>
            <p>
              We are happy to announce that EcoBridge has launched! More features will be coming soon such as:
            </p>
              <ul>
                <li>The ability to submit your own locations (this is mostly developed!)</li>
                <li>User accounts (this too!)</li>
                <li>Multi-language support (feel free to contact us if you want to help with this)</li>
                <li>A custom domain</li>
                <li>Community blogs</li>
              </ul>
          </article>
        </section>
      </main>
      <div id="sidebar" className="sidebar">
        <button className="close-btn" onClick={() => toggleSidebar()}>×</button>
        <h2>User Profile</h2>
        <p id="sidebarUsername">Username: N/A</p>
        <p id="sidebarEmail">Email: N/A</p>
        <p id="authStatus">Not Authenticated</p>
        <button className="sign-out-btn" onClick={() => signOut()}>Sign Out</button>
      </div>
    </div>
  );
};

export default News;
