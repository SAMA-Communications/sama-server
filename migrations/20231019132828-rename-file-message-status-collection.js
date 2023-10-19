export const up = async (db, client) => {
  //   vv CREATE MESSAGE STATUSES vv   //
  let indexes = await db.collection("message_status").indexes();
  indexes = indexes.filter(({ name }) => name !== "_id_");

  indexes = indexes.map((index) => {
    const { v, key, ...options } = index;
    return { key, options };
  });

  const newCollection = await db.createCollection("message_statuses");
  for (const { key, options } of indexes) {
    await newCollection.createIndex(key, options);
  }

  //   vv COPY MESSAGE STATUSES vv   //
  await db
    .collection("message_status")
    .aggregate([{ $out: "message_statuses" }])
    .toArray();

  //   vv DROP MESSAGE STATUSES vv   //
  await db.collection("message_status").drop();

  //   vv FILES vv   //
  await db.createCollection("files");
  await db
    .collection("file")
    .aggregate([{ $out: "files" }])
    .toArray();
  await db.collection("file").drop();
};

export const down = async (db, client) => {
  await db
    .collection("message_statuses")
    .rename("message_status", { dropTarget: true });
  await db.collection("files").rename("file", { dropTarget: true });
};
