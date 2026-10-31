<template>
  <LegalText>
    <h1>Legal notice</h1>
    <h2>Information according to § 5 DDG</h2>
    <p>
      {{ company.legalName }}<br />
      Owner: {{ company.owner }}<br />
      Sole proprietorship<br />
      {{ company.street }}<br />
      {{ company.postalCode }} {{ company.city }}<br />
      Germany
    </p>
    <h2>Contact</h2>
    <p>
      Phone: <a :href="`tel:${company.phone}`">{{ company.phoneDisplay }}</a
      ><br />
      Email: <a :href="`mailto:${company.email}`">{{ company.email }}</a>
    </p>
    <h2>VAT ID</h2>
    <p>VAT identification number according to § 27a UStG: {{ company.vatId }}</p>
    <h2>Responsible for content according to § 18 (2) MStV</h2>
    <p>{{ company.owner }}, address as above</p>
    <h2>Consumer dispute resolution</h2>
    <p>
      We are neither willing nor obliged to take part in dispute resolution proceedings before a
      consumer arbitration board.
    </p>
    <h2>About the nutrition values</h2>
    <p>
      The calculated values are no legal advice. The food business stays responsible for the label
      of a food.
    </p>
    <h2>Liability for links</h2>
    <p>
      This website links to external websites, such as the data sources and GitHub. Their providers
      alone are responsible for their content. No legal violations were apparent when we linked
      them. If we learn of a violation, we remove the link at once.
    </p>
  </LegalText>
</template>
