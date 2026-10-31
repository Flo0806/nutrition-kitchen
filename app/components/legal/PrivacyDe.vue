<template>
  <LegalText>
    <h1>Datenschutzerklärung</h1>
    <p>
      Kurz gesagt: Diese Website verwendet kein Tracking und lädt nichts von fremden Servern nach.
      Sie setzt ein einziges Cookie, das sich Ihre Sprache merkt.
    </p>
    <p class="text-muted">Stand: Oktober 2026</p>
    <h2>1. Verantwortlicher</h2>
    <p>
      {{ company.shortName }}, {{ company.owner }}<br />
      {{ company.street }}, {{ company.postalCode }} {{ company.city }}<br />
      Telefon: <a :href="`tel:${company.phone}`">{{ company.phoneDisplay }}</a
      ><br />
      E-Mail: <a :href="`mailto:${company.email}`">{{ company.email }}</a>
    </p>
    <h2>2. Hosting und Server-Logfiles</h2>
    <p>
      Diese Website läuft auf eigener Server-Hardware von {{ company.shortName }} in
      {{ company.city }}, Deutschland. Es ist kein externer Hosting-Anbieter beteiligt.
    </p>
    <p>
      Beim Aufruf der Website verarbeitet der Server technisch notwendige Daten: IP-Adresse, Datum
      und Uhrzeit, aufgerufene Seite, Referrer sowie Browser und Betriebssystem. Das dient dem
      sicheren Betrieb und der Abwehr von Angriffen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
      Die Logdaten werden nach spätestens 14 Tagen gelöscht, sofern sie nicht zur Aufklärung eines
      Sicherheitsvorfalls benötigt werden.
    </p>
    <h2>3. Cookie für die Sprache</h2>
    <p>
      Wir setzen ein einziges Cookie, <code>locale</code>. Es speichert, ob Sie die Seite auf
      Deutsch oder Englisch sehen, und enthält nichts anderes. Die Speicherung ist für die von Ihnen
      gewünschte Funktion erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG).
    </p>
    <h2>4. Kein Tracking</h2>
    <p>
      Wir verwenden keine Analyse- oder Marketingwerkzeuge. Schriften und Symbole werden von unserem
      eigenen Server ausgeliefert, es werden keine Verbindungen zu Google oder anderen
      Drittanbietern aufgebaut.
    </p>
    <h2>5. Links zu anderen Websites</h2>
    <p>
      Links zu den Datenquellen, zu Creative Commons oder zu GitHub sind einfache Verweise. Erst
      wenn Sie einen Link anklicken, werden Daten an den jeweiligen Anbieter übertragen. Dort gelten
      dessen Datenschutzbestimmungen.
    </p>
    <h2>6. Ihre Rechte</h2>
    <p>
      Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17),
      Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen
      Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21). Eine E-Mail an uns
      genügt.
    </p>
    <p>
      Sie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren. Für uns zuständig
      ist das Bayerische Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach.
    </p>
  </LegalText>
</template>
