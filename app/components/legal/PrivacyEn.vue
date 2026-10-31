<template>
  <LegalText>
    <h1>Privacy policy</h1>
    <p>
      In short: this website uses no tracking and loads nothing from third-party servers. It sets a
      single cookie that remembers your language.
    </p>
    <p class="text-muted">Last updated: October 2026</p>
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
    <h2>3. Language cookie</h2>
    <p>
      We set a single cookie, <code>locale</code>. It stores whether you see the site in German or
      English and holds nothing else. Storing it is required for the function you asked for (§ 25
      (2) no. 2 TDDDG).
    </p>
    <h2>4. No tracking</h2>
    <p>
      We use no analytics or marketing tools. Fonts and icons are served from our own server; no
      connections to Google or other third parties are made.
    </p>
    <h2>5. Links to other websites</h2>
    <p>
      Links to the data sources, to Creative Commons or to GitHub are plain links. Data is only sent
      to the respective provider once you click one, and their privacy policy applies there.
    </p>
    <h2>6. Your rights</h2>
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
