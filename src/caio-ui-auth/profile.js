/**
 * Matching profiles against a required list, including **scoped** profiles.
 *
 * `identity.profileList` is a flat list of strings that goes into the JWT unchanged, so a
 * role that applies to one record rather than to the whole app has to carry its scope in
 * its own name: `teamEditor:6512ab34…`, `projectOwner:42`. Exact-match comparison then
 * cannot express "anyone who edits some team", which is what a route guard usually needs --
 * the screen decides *which* team once it is open.
 *
 * A required entry ending with `:*` therefore matches any profile with that prefix and a
 * non-empty scope. Everything else matches exactly, so existing callers are unaffected.
 */

const SCOPE_SEPARATOR = ":";
const WILDCARD_SUFFIX = SCOPE_SEPARATOR + "*";

/** Does `profile` satisfy one required entry? */
function matches(required, profile) {
  if (!required.endsWith(WILDCARD_SUFFIX)) return required === profile;
  const prefix = required.slice(0, -1); // keep the colon, drop the star
  // The scope must be there: bare "teamEditor" is not "editor of some team".
  return profile.startsWith(prefix) && profile.length > prefix.length;
}

/**
 * @param identity     session identity (may be null/undefined)
 * @param profileList  required profiles; at least one has to match
 * @returns boolean
 */
function hasProfile(identity, profileList) {
  if (!Array.isArray(profileList)) return true;
  const owned = identity?.profileList;
  if (!Array.isArray(owned)) return false;
  return profileList.some((required) => owned.some((profile) => matches(required, profile)));
}

/**
 * The scopes an identity holds for one scoped role, e.g. `getScopeList(identity,
 * "teamEditor")` -> `["6512ab34…", "78cd90…"]`. The counterpart of `hasProfile` for the
 * screen that is already open and has to know *which* records it may touch.
 */
function getScopeList(identity, role) {
  const prefix = role + SCOPE_SEPARATOR;
  return (identity?.profileList ?? [])
    .filter((profile) => profile.startsWith(prefix) && profile.length > prefix.length)
    .map((profile) => profile.slice(prefix.length));
}

//@@viewOn:exports
export { hasProfile, getScopeList };
//@@viewOff:exports
