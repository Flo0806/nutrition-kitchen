// Check the config, open and migrate at start: a wrong setup stops the server, not the first user.
export default defineNitroPlugin(() => {
  serverConfig();
  useDb();
});
