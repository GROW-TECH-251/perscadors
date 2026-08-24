const https = require("https");
const token = process.env.VERCEL_TOKEN || "";
if (!token) {
  console.error("No token provided in VERCEL_TOKEN");
  process.exit(1);
}
function get(path) {
  return new Promise((res, rej) => {
    const options = {
      hostname: "api.vercel.com",
      path,
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
        "User-Agent": "vercel-audit",
      },
    };
    const req = https.request(options, (r) => {
      let b = "";
      r.on("data", (c) => (b += c));
      r.on("end", () => {
        try {
          res(JSON.parse(b));
        } catch (e) {
          res(b);
        }
      });
    });
    req.on("error", (e) => rej(e));
    req.end();
  });
}
(async () => {
  try {
    const uid = "dpl_CvJeKWyfrDZxu9cGhFPyynH4T4T5";
    const pid = "prj_8tYBJy8vCB4dtQITe2Om3yCCdexJ";
    console.log("GET /v6/deployments/" + uid + "/events");
    const events = await get("/v6/deployments/" + uid + "/events");
    if (Array.isArray(events) && events.length) {
      console.log("events_count=", events.length);
      const tail = events
        .slice(-10)
        .map((e) => ({
          type: e.type,
          body:
            e.body && e.body.text
              ? e.body.text.substring(0, 400)
              : e.body
                ? String(e.body).substring(0, 400)
                : "",
        }));
      console.log("last_events_sample=", JSON.stringify(tail, null, 2));
    } else console.log("no events or empty response");

    console.log("\nGET /v1/projects/" + pid + "/domains");
    const domains = await get("/v1/projects/" + pid + "/domains");
    console.log(
      "domains_count=",
      Array.isArray(domains)
        ? domains.length
        : Object.keys(domains || {}).length,
    );
    console.log(
      JSON.stringify(domains.slice ? domains : domains, null, 2).substring(
        0,
        2000,
      ),
    );

    console.log("\nGET /v1/projects/" + pid);
    const proj = await get("/v1/projects/" + pid);
    console.log(
      "git:",
      JSON.stringify(proj.git || proj, null, 2).substring(0, 2000),
    );
  } catch (e) {
    console.error("ERR", e);
    process.exit(1);
  }
})();
