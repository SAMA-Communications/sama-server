export default function getUpdatedField(obj1, obj2) {
  const objField = {};

  for (const field in obj2) {
    if (!obj1[field]) {
      objField[field] = obj2[field];
      continue;
    }

    if (obj1[field] !== obj2[field]) {
      objField[field] = obj2[field];
    }
  }

  return objField;
}
