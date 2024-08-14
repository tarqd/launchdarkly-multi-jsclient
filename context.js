/* copied from https://github.com/launchdarkly/js-sdk-common/blob/main/src/context.js */
/*

Copyright 2019 Catamorphic, Co.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * The partial URL encoding is needed because : is a valid character in context keys.
 *
 * Partial encoding is the replacement of all colon (:) characters with the URL
 * encoded equivalent (%3A) and all percent (%) characters with the URL encoded
 * equivalent (%25).
 * @param {string} key The key to encode.
 * @returns {string} Partially URL encoded key.
 */
function encodeKey(key) {
  if (key.includes('%') || key.includes(':')) {
    return key.replace(/%/g, '%25').replace(/:/g, '%3A');
  }
  return key;
}

export function getCanonicalKey(context) {
  if (context) {
    if ((context.kind === undefined || context.kind === null || context.kind === 'user') && context.key) {
      return context.key;
    } else if (context.kind !== 'multi' && context.key) {
      return `${context.kind}:${encodeKey(context.key)}`;
    } else if (context.kind === 'multi') {
      return Object.keys(context)
        .sort()
        .filter(key => key !== 'kind')
        .map(key => `${key}:${encodeKey(context[key].key)}`)
        .join(':');
    }
  }
}
