import * as LDClient from "launchdarkly-js-client-sdk";
import { getCanonicalKey } from "./context.js";
import hljs from "highlight.js/core.js";
import javascript from "highlight.js/languages/javascript.min.js";
hljs.registerLanguage("javascript", javascript);
const userContext = {
  kind: "user",
  key: "1",
  name: "Alice Demo",
  anonymous: true,
};

const companyContexts = [
  {
    kind: "company",
    key: "acme",
    name: "Acme Co.",
  },
  {
    kind: "company",
    key: "globex",
    name: "Globex Corp.",
  },
  {
    kind: "company",
    key: "umbrella",
    name: "Umbrella Corp.",
  },
  {
    kind: "company",
    key: "wayne",
    name: "Wayne Enterprises",
  },
  {
    kind: "company",
    key: "stark",
    name: "Stark Industries",
  },
  {
    kind: "company",
    key: "wonka",
    name: "Wonka Industries",
  },
  {
    kind: "company",
    key: "hooli",
    name: "Hooli",
  },
  {
    kind: "company",
    key: "bluth",
    name: "Bluth Company",
  },
  {
    kind: "company",
    key: "dunder",
    name: "Dunder Mifflin",
  },
  {
    kind: "company",
    key: "piedpiper",
    name: "Pied Piper",
  },
];

// one context for each combination of user and company
const CONTEXTS = companyContexts.map((company) => {
  return {
    kind: "multi",
    user: userContext,
    company: company,
  };
});

console.log('contexts',CONTEXTS);

// takes a list of contexts and returns a map of canonical keys to bootstrap objects
async function getBootstrapObject(contexts) {
  // fetch the bootstrap data from a custom endpoint
  // this is where you'd make a request to your server to get the bootstrap object
  // below is just a mockup to emulate the expected response
  return Object.fromEntries(
    contexts.map((context) => {
      const isMatch = context.company && context.company.key === "acme";
      return [
        getCanonicalKey(context),
        /* use ldClient.allFlagsState on server-side */
        {
          "release-widget": isMatch,
          $flagsState: {
            "release-widget": {
              variation: 1,
              version: 0,
              reason: {
                kind: isMatch ? "TARGET_MATCH" : "FALLTHROUGH",
              },
            },
          },
          $valid: false,
        },
      ];
    })
  );
  /* server side implementation example */
  /*
  return JSON.stringify(
    Object.fromEntries(
      req.body.map((context) => [
        getCanonicalKey(context),
        ldClient.allFlagsState(context, {
          withReasons: true,
          clientSideOnly: true,
        }),
      ])
    ).toJSON()
  );
  */
}

function createContextRow(context, { value, reason }) {
  const template = document.getElementById("contextrow");
  const clone = template.content.cloneNode(true);
  updateContextRow(clone, context, { value, reason });
  return clone.querySelector("tr");
}

function updateContextRow(row, context, { value, reason }) {
  const contextCell = row.querySelector(".context");
  const valueCell = row.querySelector(".value");
  const reasonCell = row.querySelector(".reason");
  contextCell.innerHTML = hljs.highlight(""+JSON.stringify(context, null, 2), {
    language: "javascript",
  }).value;
  valueCell.innerHTML = hljs.highlight(""+JSON.stringify(value, null, 2), {
    language: "javascript",
  }).value;
  reasonCell.innerHTML = hljs.highlight(""+JSON.stringify(reason, null, 2), {
    language: "javascript",
  }).value;
}

async function main() {
  const DEFAULT_LD_CLIENT_ID = "66193cb3e201590f9fd3c4ca";
  const params = new URLSearchParams(window.location.search);
  const clientID = params.get("clientId");
  const useBootstrap = params.get("bootstrap") !== null && params.get("bootstrap") !== "false";
  const flagKey = params.get("flagKey") || "release-widget";
  const LD_CLIENT_ID = clientID || DEFAULT_LD_CLIENT_ID;
  document.querySelector("#clientId").value = LD_CLIENT_ID;
    document.querySelector("#flagKey").value = flagKey;
    document.querySelector("#bootstrap").checked = useBootstrap;
    // sync back up to the url 
    let url = new URL(window.location);
    url.searchParams.set("clientId", LD_CLIENT_ID);
    url.searchParams.set("flagKey", flagKey);
    url.searchParams.set("bootstrap", useBootstrap);
    window.history.replaceState({}, "", url);
  // fetch the boostrap data for all of our contexts
  // if there's an error, we want to return undefined so the sdk will try and fetch flags itself
  const bootstrapData = useBootstrap ? await getBootstrapObject(CONTEXTS).catch((err) => {
    return null;
  }) : null;
  console.log('bootstrap data', bootstrapData);
  const tableBody = document.querySelector("#context-table tbody");
  // map of context objects -> ld clients
  // uses the canonical key to find the correct bootstrap object from the API response
  const ldClients = new Map(
    CONTEXTS.map((context) => {
      return [
        context,
        LDClient.initialize(LD_CLIENT_ID, context, {
            streaming: true,
            evaluationReasons: true,
            bootstrap: bootstrapData ? bootstrapData[getCanonicalKey(context)] : undefined,
          })
      ];
    })
  );
  
  for (let [context, ldClient] of ldClients) {
    const row = createContextRow(
        context,
        ldClient.variationDetail(flagKey)
      );
      tableBody.appendChild(row);
      const updateRow = () => updateContextRow(
        row,
        context,
        ldClient.variationDetail(flagKey)
      );
      
      ldClient.on('ready', updateRow);
      ldClient.on("change", updateRow);
      
  }
  // getting a ldClient by context
  console.log('acme client', ldClients.get(CONTEXTS[0]));
 
}

main();
