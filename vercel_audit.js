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
        "User-Agent": "vercel-audit-script",
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
    console.log("\n=== GET /v1/projects ===");
    const projects = await get("/v1/projects");
    const list = projects.projects || projects;
    console.log(
      "projects_count=",
      Array.isArray(list) ? list.length : Object.keys(list || {}).length,
    );
    let proj = list.find(
      (p) =>
        p.name === "perscadors" ||
        (p.aliases && p.aliases.some((a) => a.includes("perscadors"))),
    );
    if (!proj) {
      proj = list.find((p) => p.name && p.name.includes("perscadors"));
    }
    if (!proj) {
      console.log("Project not found by name; printing first 10 projects:");
      console.log(JSON.stringify(list.slice(0, 10), null, 2));
      process.exit(0);
    }
    console.log("Found project:", proj.name, proj.id);
    const pid = proj.id;
    const tries = [
      "/v6/deployments?projectId=" + pid,
      "/v13/deployments?projectId=" + pid,
      "/v4/now/deployments?projectId=" + pid,
    ];
    let deployments = null,
      used = null;
    for (const t of tries) {
      try {
        const res = await get(t);
        if (
          res &&
          (Array.isArray(res) || res.deployments || res.pager || res.length)
        ) {
          deployments = res;
          used = t;
          break;
        }
      } catch (e) {
        /* continue */
      }
    }
    console.log("\ndeployments_endpoint_used=", used);
    if (!deployments) {
      console.log("No deployments returned");
      process.exit(0);
    }
    // normalize list
    let dlist = Array.isArray(deployments)
      ? deployments
      : deployments.deployments ||
          deployments.results ||
          (deployments.pager && deployments.pager.results)
        ? deployments.deployments ||
          deployments.results ||
          deployments.pager.results
        : [];
    if (!dlist.length && deployments.length) dlist = deployments;
    console.log("\ndeployments_count=", dlist.length);
    const sample = dlist[0];
    console.log("\n--- first deployment summary ---");
    console.log(
      JSON.stringify(
        {
          id: sample.id,
          url: sample.url,
          state: sample.state,
          target: sample.target,
          created: sample.created,
          meta: sample.meta,
          githubCommitSha:
            (sample.meta && sample.meta.githubCommitSha) ||
            (sample.meta && sample.meta.commitSha) ||
            (sample.github && sample.github.commit) ||
            (sample.meta && sample.meta.commit),
        },
        null,
        2,
      ),
    );
    const prod = dlist.find(
      (d) =>
        d.target === "production" ||
        (d.alias &&
          d.alias.includes &&
          d.alias.includes("perscadors.vercel.app")) ||
        (d.aliases &&
          d.aliases.some((a) => a.includes("perscadors.vercel.app"))),
    );
    if (prod)
      console.log(
        "\n--- production deployment ---\n",
        JSON.stringify(prod, null, 2),
      );
    else
      console.log("\nNo explicit production deployment found in the list.\n");
  } catch (e) {
    console.error("ERR", e);
    process.exit(1);
  }
})();
