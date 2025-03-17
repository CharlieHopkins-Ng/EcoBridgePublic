import Link from "next/link";
import Head from "next/head";
import Script from "next/script";
import React from "react";

const AboutUs = () => {
  return (
    <div>
      <Head>
        <title>About Us - EcoBridge</title>
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
      <main className="main">
        <section className="about-container">
            <header className="header">
            <h1>EcoBridge - Connecting You to Environmental Change</h1>
            </header>
            <h1>About EcoBridge</h1>
            <p>
            Ecobridge is a platform to connect people with other organization or charities to support environmental cause. Whether it is donating items, volunteering, or getting involved in local sustainability initiatives, we make it easier to get involved and take action.
            </p>
            <h2>Our Mission</h2>
            <p>
            At EcoBridge, our mission is to facilitate individuals and communities to take meaningful action for the environment by connecting them with opportunities to donate, volunteer, and contribute to sustainable initiatives. We want advocacy for sustainability to be easily accessible by others who are interested in actively supporting the environment. Through Ecobrige, you can connect with other organizations to donate food for a local food bank nearby you, volunteer at a environmental nonprofit, and donate money to support people suffering from environmental crises. We aim to bridge the gap between environmental needs and the people who truly care about making a profound difference.
            </p>
            <h2>Meet the Team</h2>
            <p>
            We are a team of environmental enthusiasts, coders, and volunteers passionate about making a difference.
            If you'd like to contribute, get in touch with us at supp0rtecobridge@gmail.com (we do not have a domain yet)! We are completely open source, and our repository is <a href="https://github.com/NoAyeBeardo/EcoBridgePublic">here</a>.
            All of our icons are from <a href="https://icons8.com/icons">Icons8</a>
            </p>
            <div style={{ textAlign: 'left' }}>
            <p>
                <strong>Siyeong Park (Founder):</strong><br />
                Hi! I am Siyeong Park, the founder of Ecobridge. I am a freshman at Shanghai American School. The LA wildfire that occurred at the start of 2025 inspired me to make this platform by thinking: “How can I help environmental crises like the LA wildfire when I am living at the other side of the world?” Combining this with my prior interests for the environment, this inspired me to create a platform where people can easily access opportunities to donate various items, volunteer for the environment, and work for a local sustainability project. Through Ecobridge, I hope this can facilitate the community to make it more accessible to help the environment regardless of where we are and who we are.
            </p>
            <p>
                <strong>Charlie Hopkins-Ng (Website Developer & Co-Founder):</strong><br />
                Hi! I am Charlie Hopkins-Ng, Ecobridge's website developer. I am in third year at Jordanhill Secondary School. I have always been passionate about the environment, and have been to multiple protests about the environment. I met Siyeong at a maths competition in December 2024, and when Siyeong contacted me, I gladly accepted!
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutUs;