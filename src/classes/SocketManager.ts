const CORE = ["connected", "disconnected", "authenticated", "error", "joined", "left"];
const ACTIONS = ["error", "follow", "unfollow", "send", "receieve"];
const ENTITIES = ["project", "bucket", "study"];
const CRUD = ["create", "update", "remove", "move"];

function createEntityCrud(entity) {
  return CRUD.map((action) => `${entity}:${action}`);
}

console.log([...CORE.map((v) => `${v}:id`), ENTITIES.reduce((acc, entity) => createEntityCrud(entity))]);
