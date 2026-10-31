<template>
  <LegalText>
    <h1>Impressum</h1>
    <h2>Angaben gemäß § 5 DDG</h2>
    <p>
      {{ company.legalName }}<br />
      Inhaber: {{ company.owner }}<br />
      Einzelunternehmen<br />
      {{ company.street }}<br />
      {{ company.postalCode }} {{ company.city }}<br />
      Deutschland
    </p>
    <h2>Kontakt</h2>
    <p>
      Telefon: <a :href="`tel:${company.phone}`">{{ company.phoneDisplay }}</a
      ><br />
      E-Mail: <a :href="`mailto:${company.email}`">{{ company.email }}</a>
    </p>
    <h2>Umsatzsteuer-ID</h2>
    <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {{ company.vatId }}</p>
    <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
    <p>{{ company.owner }}, Anschrift wie oben</p>
    <h2>Verbraucherstreitbeilegung</h2>
    <p>
      Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
      Verbraucherschlichtungsstelle teilzunehmen.
    </p>
    <h2>Hinweis zu den Nährwerten</h2>
    <p>
      Die berechneten Nährwerte sind keine Rechtsberatung. Für die Kennzeichnung eines Lebensmittels
      bleibt das Lebensmittelunternehmen verantwortlich.
    </p>
    <h2>Haftung für Links</h2>
    <p>
      Diese Website enthält Links zu externen Websites, etwa zu den Datenquellen und zu GitHub. Für
      deren Inhalte sind ausschließlich die jeweiligen Anbieter verantwortlich. Zum Zeitpunkt der
      Verlinkung waren keine Rechtsverstöße erkennbar. Werden uns Rechtsverletzungen bekannt,
      entfernen wir den Link umgehend.
    </p>
  </LegalText>
</template>
