export const up = async (db, client) => {
  //   async function migrationUp() {
  //     await createNewCollection();
  //     console.log("[Collection][created]");
  //     await copyUsers();
  //     console.log("[Collection][copy][done]");
  //     await renameCollectionsUp();
  //     console.log("[Collections][renamed]");
  //   }
  //   async function migrationDown() {
  //     await renameCollectionsDown();
  //     console.log("[Collections][renamed]");
  //   }
  //   async function createNewCollection() {
  //     const indexes = await getIndexes();
  //     console.log("[Indexes]", indexes.length);
  //     const collectionSettings = { collation: { locale: "en", strength: 2 } };
  //     const newCollection = await mongoDBConnection["mongodb"].createCollection(
  //       NEW_COLLECTION_NAME,
  //       collectionSettings
  //     );
  //     for (const { key, options } of indexes) {
  //       const effect = await newCollection.createIndex(key, options);
  //       console.log("[Index][create][effect]", effect);
  //     }
  //     return newCollection;
  //   }
  //   async function getIndexes() {
  //     let indexes = await mongoDBConnection["mongodb"]
  //       .collection(TARGET_COLLECTION_NAME)
  //       .indexes();
  //     indexes = indexes.filter(({ name }) => name !== "_id_");
  //     const loginIndex = indexes.find(
  //       ({ name }) => name === "login_unique_case_insensitive_index"
  //     );
  //     delete loginIndex.collation;
  //     indexes = indexes.map((index) => {
  //       const { v, key, ...options } = index;
  //       return { key, options };
  //     });
  //     return indexes;
  //   }
  //   async function copyUsers() {
  //     await this.mongoDBConnection["mongodb"]
  //       .collection(TARGET_COLLECTION_NAME)
  //       .aggregate([{ $out: NEW_COLLECTION_NAME }])
  //       .toArray();
  //   }
  //   async function renameCollectionsUp() {
  //     await mongoDBConnection["mongodb"]
  //       .collection(TARGET_COLLECTION_NAME)
  //       .rename(OLD_COLLECTION_NAME, { dropTarget: true });
  //     await mongoDBConnection["mongodb"]
  //       .collection(NEW_COLLECTION_NAME)
  //       .rename(TARGET_COLLECTION_NAME, { dropTarget: true });
  //   }
  //   async function renameCollectionsDown() {
  //     await mongoDBConnection["mongodb"]
  //       .collection(TARGET_COLLECTION_NAME)
  //       .rename(NEW_COLLECTION_NAME, { dropTarget: true });
  //     await mongoDBConnection["mongodb"]
  //       .collection(OLD_COLLECTION_NAME)
  //       .rename(TARGET_COLLECTION_NAME, { dropTarget: true });
  //   }
};

export const down = async (db, client) => {
  // TODO write the statements to rollback your migration (if possible)
  // Example:
  // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
};
