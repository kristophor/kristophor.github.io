(function () {
  const ROOT_MAP = {
    apps: "content/apps",
    blog: "content/blog",
  };

  function renderMarkdown(mdText) {
    if (window.marked && typeof window.marked.parse === "function") {
      return window.marked.parse(mdText);
    }

    return mdText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
  }

  function setStatus(container, text) {
    container.innerHTML = '<p class="status">' + text + "</p>";
  }

  function createTagNode(tag) {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    return span;
  }

  async function loadText(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load " + path);
    }

    return response.text();
  }

  function parseEntryMarkdown(markdown, slug) {
    const lines = markdown.split("\n");
    const titleLine = lines.find((line) => /^#{1,2}\s+/.test(line.trim()));
    const title = titleLine
      ? titleLine.replace(/^#{1,2}\s+/, "").trim()
      : slug.replace(/-/g, " ");

    const titleIndex = lines.findIndex((line) => line === titleLine);
    const bodyLines = lines.slice(Math.max(0, titleIndex + 1));
    const metadata = {};
    let contentStart = 0;

    for (let i = 0; i < bodyLines.length; i += 1) {
      const current = bodyLines[i].trim();

      if (!current) {
        continue;
      }

      const metaMatch = current.match(/^[-*]\s*([^:]+):\s*(.+)$/);
      if (metaMatch) {
        const key = metaMatch[1].trim().toLowerCase();
        metadata[key] = metaMatch[2].trim();
        contentStart = i + 1;
        continue;
      }

      contentStart = i;
      break;
    }

    const content = bodyLines.slice(contentStart).join("\n").trim();
    const tags = (metadata.tags || "")
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    return {
      title,
      date: metadata.date || "",
      status: metadata.status || "",
      disclaimer: metadata.disclaimer || "",
      tags,
      html: renderMarkdown(content),
    };
  }

  async function renderEntry() {
    const panel = document.getElementById("entry-panel");
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const slug = params.get("slug");

    if (!type || !slug || !ROOT_MAP[type]) {
      setStatus(panel, "Invalid entry URL. Use type=apps|blog and a valid slug.");
      return;
    }

    try {
      const markdown = await loadText(ROOT_MAP[type] + "/" + slug + "/index.md");
      const entry = parseEntryMarkdown(markdown, slug);

      document.title = entry.title + " | Kris Chen";
      panel.innerHTML = "";

      const sectionType = document.createElement("p");
      sectionType.className = "eyebrow";
      sectionType.textContent = type === "apps" ? "App Page" : "Blog Post";
      panel.appendChild(sectionType);

      const title = document.createElement("h1");
      title.className = "entry-title";
      title.textContent = entry.title;
      panel.appendChild(title);

      if (entry.date) {
        const date = document.createElement("p");
        date.className = "post-date";
        date.textContent = entry.date;
        panel.appendChild(date);
      }

      const meta = document.createElement("p");
      meta.className = "meta";

      if (entry.status) {
        meta.appendChild(createTagNode("status: " + entry.status));
      }

      entry.tags.forEach((tag) => meta.appendChild(createTagNode(tag)));
      if (meta.childNodes.length > 0) {
        panel.appendChild(meta);
      }

      const body = document.createElement("div");
      body.className = "entry-content";
      body.innerHTML = entry.html;
      panel.appendChild(body);

      if (entry.disclaimer) {
        const disclaimer = document.createElement("p");
        disclaimer.className = "disclaimer";
        disclaimer.textContent = "Disclaimer: " + entry.disclaimer;
        panel.appendChild(disclaimer);
      }
    } catch (error) {
      setStatus(panel, "Unable to load entry content.");
      console.error(error);
    }
  }

  renderEntry();
})();
