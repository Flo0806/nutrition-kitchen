<template>
  <LegalText>
    <h1>Datenschutzerklärung</h1>
    <p>
      Kurz gesagt: Diese Website verwendet kein Tracking und lädt nichts von fremden Servern nach.
      Ein Konto brauchen Sie nur, um Rezepte zu speichern und zu teilen. Dafür speichern wir Ihren
      Namen und eine Kennung Ihres Kontos, keine E-Mail-Adresse. Sie können Ihr Konto jederzeit mit
      allem löschen.
    </p>
    <p class="text-muted">Stand: November 2026</p>
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
    <h2>3. Cookies und Speicher im Browser</h2>
    <p>Wir setzen nur Cookies, die für eine von Ihnen gewünschte Funktion nötig sind:</p>
    <ul>
      <li><code>locale</code> merkt sich, ob Sie die Seite auf Deutsch oder Englisch sehen.</li>
      <li>
        <code>nuxt-auth-session</code> hält Sie angemeldet. Es enthält Ihre Nutzernummer, Ihren
        Namen und den Anbieter, mit dem Sie sich angemeldet haben, verschlüsselt. Es gilt, bis Sie
        sich abmelden oder den Browser schließen.
      </li>
      <li>
        <code>nuxt-auth-state</code>, <code>nuxt-auth-pkce</code>, <code>nuxt-auth-nonce</code> und
        <code>oauth-bluesky-state</code> sichern den Ablauf der Anmeldung ab und verfallen nach 10
        Minuten.
      </li>
      <li>
        <code>login-return</code> merkt sich für 10 Minuten, zu welchem geteilten Rezept Sie nach
        der Anmeldung zurückkehren.
      </li>
    </ul>
    <p>
      Außerdem speichert Ihr Browser das Rezept, an dem Sie gerade arbeiten, im lokalen Speicher
      (<code>localStorage</code>), damit es nach einem Neuladen noch da ist. Dieser Entwurf bleibt
      auf Ihrem Gerät und wird erst an uns übertragen, wenn Sie ihn speichern.
    </p>
    <p>Rechtsgrundlage ist jeweils § 25 Abs. 2 Nr. 2 TDDDG.</p>
    <h2>4. Konto und Anmeldung</h2>
    <p>
      Sie können sich mit Google oder mit Bluesky anmelden. Wir haben kein eigenes Passwort von
      Ihnen. Bei der Anmeldung leiten wir Sie zu dem gewählten Anbieter weiter. Dort gelten dessen
      Datenschutzbestimmungen: die von Google Ireland Limited beziehungsweise die von Bluesky
      Social, PBC (USA) oder Ihres eigenen Bluesky-Servers.
    </p>
    <ul>
      <li>
        <strong>Google</strong> übermittelt uns eine Kennung Ihres Kontos und Ihren Namen. Nach
        Ihrer E-Mail-Adresse oder Ihrem Profilbild fragen wir nicht.
      </li>
      <li>
        <strong>Bluesky</strong> übermittelt uns die Kennung Ihres Kontos (DID). Ihren Anzeigenamen
        ruft unser Server danach aus Ihrem öffentlichen Profil bei
        <code>public.api.bsky.app</code> ab. Wir fragen keine weiteren Rechte an.
      </li>
    </ul>
    <p>
      Wir speichern den Anbieter, die Kennung Ihres Kontos, Ihren Namen und den Zeitpunkt der ersten
      Anmeldung. Ihr Name wird bei jeder Anmeldung aktualisiert. Das ist für die Nutzung des Kontos
      erforderlich (Art. 6 Abs. 1 lit. b DSGVO).
    </p>
    <h2>5. Rezepte und Fotos</h2>
    <p>
      Wenn Sie ein Rezept speichern, speichern wir Titel, Zubereitung, Zutaten mit Mengen, eigene
      Rohstoffe mit ihren Werten und die Einstellungen des Etiketts, außerdem ein Foto, wenn Sie
      eines hochladen. Fotos verkleinern wir und speichern sie neu. Dabei entfallen alle Metadaten
      der Kamera, auch ein Aufnahmeort. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Die Daten
      bleiben gespeichert, bis Sie das Rezept oder Ihr Konto löschen.
    </p>
    <h2>6. Geteilte Rezepte</h2>
    <p>
      Wenn Sie ein Rezept teilen, kann jeder mit dem Link das Rezept mit Foto, Zubereitung und
      Etikett sehen, aber nicht Ihren Namen. Die Seite ist für Suchmaschinen gesperrt. Beenden Sie
      den Link, ist das Rezept darüber nicht mehr erreichbar. Angemeldete Besucher können ein
      geteiltes Rezept in ihr eigenes Rezeptbuch kopieren. Eine solche Kopie gehört dann ihnen und
      bleibt bestehen, auch wenn Sie Ihr Rezept oder Ihr Konto löschen.
    </p>
    <h2>7. Fehler und Vorschläge</h2>
    <p>
      Wenn Sie über „Fehler &amp; Vorschläge“ etwas melden, senden wir Ihre Nachricht, die gewählte
      Art der Meldung, gegebenenfalls Ihren Suchbegriff und, nur wenn Sie sie angeben, Ihre
      E-Mail-Adresse per E-Mail an uns. Wir nutzen die Meldung, um die App zu verbessern, und Ihre
      E-Mail-Adresse nur, um Ihnen zu antworten. Die Mail löschen wir, sobald die Meldung erledigt
      ist. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO, bei Angabe einer E-Mail-Adresse Art. 6
      Abs. 1 lit. a DSGVO.
    </p>
    <p>
      Gegen automatisierte Meldungen löst Ihr Browser vor dem Senden eine kleine Rechenaufgabe
      (ALTCHA). Dafür werden keine Cookies gesetzt und keine Daten an Dritte übertragen. Pro Adresse
      nehmen wir höchstens fünf Meldungen pro Stunde an; die IP-Adresse wird dafür nur im
      Arbeitsspeicher des Servers gezählt und nicht gespeichert.
    </p>
    <h2>8. Konto löschen</h2>
    <p>
      Über das Menü mit Ihren Initialen können Sie Ihr Konto jederzeit löschen. Dabei löschen wir
      sofort Ihr Konto, alle Ihre Rezepte und ihre Fotos. Geteilte Links funktionieren danach nicht
      mehr, und jede bestehende Anmeldung endet.
    </p>
    <h2>9. Kein Tracking</h2>
    <p>
      Wir verwenden keine Analyse- oder Marketingwerkzeuge. Schriften und Symbole werden von unserem
      eigenen Server ausgeliefert. Verbindungen zu Google oder Bluesky entstehen nur, wenn Sie sich
      darüber anmelden.
    </p>
    <h2>10. Links zu anderen Websites</h2>
    <p>
      Links zu den Datenquellen, zu Creative Commons oder zu GitHub sind einfache Verweise. Erst
      wenn Sie einen Link anklicken, werden Daten an den jeweiligen Anbieter übertragen. Dort gelten
      dessen Datenschutzbestimmungen.
    </p>
    <h2>11. Ihre Rechte</h2>
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
