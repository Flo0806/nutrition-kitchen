import { expect, test } from "@playwright/test";

test("returns one food with values, marks and names", async ({ request }) => {
  const response = await request.get("/api/foods/R459000");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("public, max-age=86400");
  const food = await response.json();
  expect(food.name.de).toBe("Backhefe frisch (Frischbackhefe)");
  expect(food.per100g.polyols).toBeNull();
  expect(food).not.toHaveProperty("sources");
});

test("answers 404 for an unknown code", async ({ request }) => {
  expect((await request.get("/api/foods/X999999")).status()).toBe(404);
});

test("answers 400 for something that is no code", async ({ request }) => {
  for (const code of ["c214200", "%3Cscript%3E", "constructor", "C2142000X"]) {
    expect((await request.get(`/api/foods/${code}`)).status(), code).toBe(400);
  }
});

test("the Bluesky client metadata sends people back to the login route", async ({ request }) => {
  // What Bluesky fetches in production; behind the proxy the origin comes from its headers.
  const response = await request.get("/bluesky/client-metadata.json", {
    headers: { host: "nutrition.example", "x-forwarded-proto": "https" },
  });
  expect(response.status()).toBe(200);
  const metadata = (await response.json()) as { client_id: string; redirect_uris: string[] };
  expect(metadata.client_id).toBe("https://nutrition.example/bluesky/client-metadata.json");
  expect(metadata.redirect_uris).toEqual(["https://nutrition.example/auth/bluesky"]);
});
