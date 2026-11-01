<template>
  <LegalText>
    <h1>Privacy policy</h1>
    <p>
      In short: this website uses no tracking and loads nothing from third-party servers. You need
      an account only to save and share recipes. For that we store your name and an identifier of
      your account, no email address. You can delete your account with everything in it at any time.
    </p>
    <p class="text-muted">Last updated: November 2026</p>
    <h2>1. Controller</h2>
    <p>
      {{ company.shortName }}, {{ company.owner }}<br />
      {{ company.street }}, {{ company.postalCode }} {{ company.city }}, Germany<br />
      Phone: <a :href="`tel:${company.phone}`">{{ company.phoneDisplay }}</a
      ><br />
      Email: <a :href="`mailto:${company.email}`">{{ company.email }}</a>
    </p>
    <h2>2. Hosting and server log files</h2>
    <p>
      This website runs on server hardware owned and operated by {{ company.shortName }} in
      {{ company.city }}, Germany. No external hosting provider is involved.
    </p>
    <p>
      When you open the website, the server processes technically necessary data: IP address, date
      and time, requested page, referrer, browser and operating system. This keeps the site secure
      and helps fend off attacks. The legal basis is Art. 6 (1) (f) GDPR. Log data is deleted after
      14 days at the latest unless it is needed to investigate a security incident.
    </p>
    <h2>3. Cookies and browser storage</h2>
    <p>We only set cookies needed for a function you asked for:</p>
    <ul>
      <li><code>locale</code> remembers whether you see the site in German or English.</li>
      <li>
        <code>nuxt-auth-session</code> keeps you signed in. It holds your user number, your name and
        the provider you signed in with, encrypted. It lasts until you sign out or close the
        browser.
      </li>
      <li>
        <code>nuxt-auth-state</code>, <code>nuxt-auth-pkce</code>, <code>nuxt-auth-nonce</code> and
        <code>oauth-bluesky-state</code> secure the sign-in flow and expire after 10 minutes.
      </li>
      <li>
        <code>login-return</code> remembers for 10 minutes which shared recipe to return to after
        signing in.
      </li>
    </ul>
    <p>
      Your browser also keeps the recipe you are working on in local storage
      (<code>localStorage</code>), so it is still there after a reload. This draft stays on your
      device and only reaches us when you save it.
    </p>
    <p>The legal basis is § 25 (2) no. 2 TDDDG in each case.</p>
    <h2>4. Account and sign-in</h2>
    <p>
      You can sign in with Google or with Bluesky. We hold no password of yours. To sign in, we send
      you to the provider you chose, where their privacy policy applies: that of Google Ireland
      Limited, or that of Bluesky Social, PBC (USA) or of your own Bluesky server.
    </p>
    <ul>
      <li>
        <strong>Google</strong> sends us an identifier of your account and your name. We do not ask
        for your email address or your profile picture.
      </li>
      <li>
        <strong>Bluesky</strong> sends us the identifier of your account (DID). Our server then
        reads your display name from your public profile at <code>public.api.bsky.app</code>. We ask
        for no further permissions.
      </li>
    </ul>
    <p>
      We store the provider, the identifier of your account, your name and the time of your first
      sign-in. Your name is updated on every sign-in. This is needed to provide the account (Art. 6
      (1) (b) GDPR).
    </p>
    <h2>5. Recipes and photos</h2>
    <p>
      When you save a recipe, we store its title, method, ingredients with amounts, your own raw
      materials with their values and the label settings, and a photo if you upload one. We shrink
      photos and store them anew, which drops all camera metadata, a location included. The legal
      basis is Art. 6 (1) (b) GDPR. The data stays until you delete the recipe or your account.
    </p>
    <h2>6. Shared recipes</h2>
    <p>
      When you share a recipe, anyone with the link can see it with its photo, method and label, but
      not your name. The page is closed to search engines. Once you end the link, the recipe can no
      longer be reached through it. Signed-in visitors can copy a shared recipe into their own
      recipe book. Such a copy is then theirs and stays, even if you delete your recipe or your
      account.
    </p>
    <h2>7. Problems and ideas</h2>
    <p>
      When you report something through "Problems &amp; ideas", we send your message, the kind of
      report you chose, your search term if any and, only if you give it, your email address to us
      by email. We use the report to improve the app, and your email address only to answer you. We
      delete the mail once the report is dealt with. The legal basis is Art. 6 (1) (f) GDPR, and
      Art. 6 (1) (a) GDPR where you give an email address.
    </p>
    <p>
      Against automated reports, your browser solves a small computing task before sending (ALTCHA).
      It sets no cookies and sends no data to third parties. We accept at most five reports per hour
      from one address; the IP address is counted for this in the server's memory only, never
      stored.
    </p>
    <h2>8. Deleting your account</h2>
    <p>
      You can delete your account at any time from the menu with your initials. We then delete your
      account, all your recipes and their photos at once. Shared links stop working, and every
      existing sign-in ends.
    </p>
    <h2>9. No tracking</h2>
    <p>
      We use no analytics or marketing tools. Fonts and icons are served from our own server.
      Connections to Google or Bluesky only happen when you sign in with them.
    </p>
    <h2>10. Links to other websites</h2>
    <p>
      Links to the data sources, to Creative Commons or to GitHub are plain links. Data is only sent
      to the respective provider once you click one, and their privacy policy applies there.
    </p>
    <h2>11. Your rights</h2>
    <p>
      You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17),
      restriction of processing (Art. 18), data portability (Art. 20) and to object to processing
      based on Art. 6 (1) (f) GDPR (Art. 21). An email to us is enough.
    </p>
    <p>
      You may also lodge a complaint with a data protection authority. The authority responsible for
      us is the Bavarian State Office for Data Protection Supervision (BayLDA), Promenade 18, 91522
      Ansbach, Germany.
    </p>
  </LegalText>
</template>
