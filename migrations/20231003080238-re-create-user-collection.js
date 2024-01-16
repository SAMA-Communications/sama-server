export const up = async (db, client) => {
  //   vv CREATE vv   //
  let indexes = await db.collection('users').indexes()
  indexes = indexes.filter(({ name }) => name !== '_id_')

  const loginIndex = indexes.find(({ name }) => name === 'login_1')
  delete loginIndex.collation

  indexes = indexes.map((index) => {
    const { v, key, ...options } = index
    return { key, options }
  })

  const collectionSettings = { collation: { locale: 'en', strength: 2 } }
  const newCollection = await db.createCollection(
    'users_copy',
    collectionSettings
  )
  for (const { key, options } of indexes) {
    await newCollection.createIndex(key, options)
  }

  //   vv COPY vv   //
  await db
    .collection('users')
    .aggregate([{ $out: 'users_copy' }])
    .toArray()

  //   vv RENAME vv   //
  await db.collection('users').rename('old_users', { dropTarget: true })
  await db.collection('users_copy').rename('users', { dropTarget: true })
}

export const down = async (db, client) => {
  await db.collection("old_users").drop();
};
