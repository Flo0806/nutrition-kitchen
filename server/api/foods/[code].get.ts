import { z } from "zod";

const params = z.object({ code: foodCode });

export default defineEventHandler(async (event) => {
  const { code } = await getValidatedRouterParams(event, params.parse);
  const food = findFood(code);
  if (!food) throw createError({ statusCode: 404, statusMessage: "Unknown food code" });
  // Values only change with a deploy.
  setResponseHeader(event, "cache-control", "public, max-age=86400");
  return food;
});
