const config = {
  mongodb: {
    url: "mongodb+srv://oleksandr:admin@cluster0.njiaclc.mongodb.net/samadb",
    // databaseName: "YOURDATABASENAME",

    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
      useUnifiedTopology: true, // removes a deprecating warning when connecting
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    },
  },

  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determin
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  moduleSystem: "esm",
};

export default config;
