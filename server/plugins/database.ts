// Open and migrate at start, so a broken database stops the server instead of the first save.
export default defineNitroPlugin(() => {
  useDb();
});
